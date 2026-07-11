from __future__ import annotations

import json
import logging
import os
from typing import Any, Literal

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI
from pydantic import BaseModel, Field, ValidationError

from openai_config import get_openai_api_key


logger = logging.getLogger(__name__)
DEFAULT_VISUALIZATION_MODEL = os.getenv("OPENAI_VISUALIZATION_MODEL", "gpt-5.5")
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "180"))


class VisualizationAnalysisError(RuntimeError):
    pass


class ColumnProfile(BaseModel):
    name: str
    type: Literal["numeric", "categorical", "date", "boolean", "text", "unknown"] | str
    missingPercent: float | int = 0
    uniqueCount: int = 0
    summary: str | None = None


class DatasetVisualizationRequest(BaseModel):
    fileName: str | None = None
    rowCount: int = Field(ge=0)
    columnCount: int = Field(ge=0)
    columns: list[ColumnProfile]
    sampleRows: list[dict[str, Any]] = Field(default_factory=list, max_length=80)
    userGoal: str = Field(min_length=3, max_length=1000)


class InsightColumn(BaseModel):
    column: str
    role: Literal["x", "y", "color", "facet", "filter", "label", "stratification", "time", "metric"]
    reason: str
    priority: Literal["high", "medium", "low"] = "medium"


class ChartSpec(BaseModel):
    id: str
    title: str
    chartType: Literal["bar", "line", "scatter", "area", "histogram", "pie"]
    x: str
    y: str | None = None
    color: str | None = None
    aggregation: Literal["count", "mean", "median", "sum", "min", "max", "none"] = "none"
    cumulative: bool = False
    timeGrain: Literal["none", "day", "week", "month", "quarter", "year"] = "none"
    rationale: str
    insight: str


class VisualizationFinding(BaseModel):
    severity: Literal["low", "medium", "high"]
    title: str
    detail: str


class DatasetVisualizationResponse(BaseModel):
    model: str
    analysisSummary: str
    insightColumns: list[InsightColumn]
    chartSpecs: list[ChartSpec] = Field(max_length=1)
    dataQualityFindings: list[VisualizationFinding]
    followUpQuestions: list[str] = Field(default_factory=list)


SYSTEM_PROMPT = """
You are Granulariti's Clinical Data Visualization Assistant.
Translate a user's natural-language analytical question into one scientifically appropriate chart.

Return strict JSON only. Do not include markdown.

Your job:
1. Interpret the user's question in the context of the supplied dataset schema and sample rows.
2. Select only existing columns needed to answer that question.
3. Choose the best chart type, X/Y variables, optional color grouping, aggregation, and time grain.
4. Set cumulative=true only when the user asks for accumulation, running total, growth-to-date, or a cumulative measure.
5. Explain what the resulting chart answers and flag any ambiguity or data-quality limitation.

Rules:
- Be practical and scientifically grounded.
- Prefer clinically meaningful comparisons: treatment arm, visit, site, cohort, biomarker, endpoint, response, adverse event, time/date, enrollment, lab value.
- Do not invent columns that are not present.
- If a chart needs y but no numeric column exists, use aggregation "count" and y null.
- Return exactly one chartSpec that best answers the user's request.
- Do not generate a chart when the request cannot be answered from the available columns; return an empty chartSpecs list and ask a specific follow-up question.
- Use chartType only from: bar, line, scatter, area, histogram, pie.
- Use aggregation only from: count, mean, median, sum, min, max, none.
- For cumulative values over time, normally use line or area, aggregation sum, cumulative true, and an appropriate timeGrain.
- Use line or area for trends over ordered time, bar for categorical comparisons, scatter for relationships between numeric variables, histogram for one numeric distribution, and pie only for a small part-to-whole comparison.
- Preserve exact column names in x, y, and color.
- The browser, not the model, performs calculations over the full dataset. Never invent computed values.
- Outputs are exploratory and require human review.
"""


def analyze_visualization_dataset(
    request: DatasetVisualizationRequest,
) -> DatasetVisualizationResponse:
    api_key = get_openai_api_key()
    if not api_key:
        raise VisualizationAnalysisError("OPENAI_API_KEY is not configured.")

    payload = {
        "fileName": request.fileName,
        "rowCount": request.rowCount,
        "columnCount": request.columnCount,
        "columns": [column.model_dump() for column in request.columns],
        "sampleRows": request.sampleRows[:50],
        "userGoal": request.userGoal,
        "requiredJsonShape": {
            "analysisSummary": "short practical summary",
            "insightColumns": [
                {
                    "column": "existing column name",
                    "role": "x|y|color|facet|filter|label|stratification|time|metric",
                    "reason": "why useful",
                    "priority": "high|medium|low",
                }
            ],
            "chartSpecs": [
                {
                    "id": "stable-kebab-case-id",
                    "title": "chart title",
                    "chartType": "bar|line|scatter|area|histogram|pie",
                    "x": "existing column name",
                    "y": "existing column name or null",
                    "color": "existing column name or null",
                    "aggregation": "count|mean|median|sum|min|max|none",
                    "cumulative": "true only for a running total",
                    "timeGrain": "none|day|week|month|quarter|year",
                    "rationale": "why this chart is suitable",
                    "insight": "what to look for",
                }
            ],
            "dataQualityFindings": [
                {"severity": "low|medium|high", "title": "issue", "detail": "impact"}
            ],
            "followUpQuestions": ["optional questions for better analysis"],
        },
    }

    client = OpenAI(api_key=api_key, timeout=OPENAI_TIMEOUT_SECONDS)
    try:
        response = client.chat.completions.create(
            model=DEFAULT_VISUALIZATION_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, default=str)},
            ],
        )
    except APITimeoutError as exc:
        logger.exception("OpenAI visualization analysis timed out.")
        raise VisualizationAnalysisError("OpenAI visualization analysis timed out.") from exc
    except APIConnectionError as exc:
        logger.exception("OpenAI visualization analysis could not connect.")
        raise VisualizationAnalysisError("The backend could not connect to api.openai.com.") from exc
    except APIStatusError as exc:
        logger.exception("OpenAI visualization analysis returned status %s.", exc.status_code)
        if exc.status_code == 401:
            message = "OpenAI authentication failed. Check OPENAI_API_KEY."
        elif exc.status_code == 404:
            message = (
                f"OpenAI model '{DEFAULT_VISUALIZATION_MODEL}' was not found or is not enabled for this project. "
                "Set OPENAI_VISUALIZATION_MODEL to an available model."
            )
        elif exc.status_code == 429:
            message = "OpenAI rate limit or quota error. Check project billing, quota, and retry later."
        else:
            message = f"OpenAI API returned an error with status {exc.status_code}."
        raise VisualizationAnalysisError(message) from exc
    except Exception as exc:
        logger.exception("OpenAI visualization analysis failed.")
        raise VisualizationAnalysisError("OpenAI visualization analysis failed.") from exc

    try:
        content = response.choices[0].message.content
        if not content:
            raise VisualizationAnalysisError("OpenAI returned an empty visualization analysis.")
        data = json.loads(content)
        data["model"] = DEFAULT_VISUALIZATION_MODEL
        return DatasetVisualizationResponse.model_validate(data)
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        logger.exception("OpenAI returned invalid visualization JSON.")
        raise VisualizationAnalysisError("OpenAI returned visualization JSON that did not match the expected schema.") from exc
