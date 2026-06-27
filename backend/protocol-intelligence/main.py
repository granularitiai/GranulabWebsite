from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from csv_exporter import protocol_to_csv
from clinicaltrials_export_parser import ClinicalTrialsExportParsingError, parse_clinicaltrials_export
from document_parser import (
    DocumentParsingError,
    EmptyExtractedTextError,
    FileTooLargeError,
    TokenLimitExceededError,
    UnsupportedFileTypeError,
    parse_document,
)
from llm_extractor import LLMJsonParsingError, OpenAIExtractionError, extract_protocol_intelligence
from openai_diagnostics import run_openai_diagnostics
from schemas import CsvExportRequest, HealthResponse, ProtocolIntelligence


app = FastAPI(
    title="Clinical Trial Protocol Intelligence Assistant API",
    version="0.1.0",
    description="Structured clinical trial protocol intelligence extraction for PDF and DOCX protocol documents.",
)

def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="protocol-intelligence-api", version="0.1.0")


@app.get("/diagnostics/openai")
def openai_diagnostics() -> dict:
    return run_openai_diagnostics()


@app.post("/analyze/protocol", response_model=ProtocolIntelligence)
async def analyze_protocol(file: UploadFile | None = File(default=None)) -> ProtocolIntelligence:
    if file is None:
        raise HTTPException(status_code=400, detail="Missing file. Upload one PDF or DOCX clinical trial protocol.")

    try:
        file_bytes = await file.read()
        parsed_document = parse_document(file.filename or "", file_bytes)
        return extract_protocol_intelligence(
            document_text="\n\n".join(
                f"[Chunk {index + 1}]\n{chunk}" for index, chunk in enumerate(parsed_document.chunks)
            ),
            heuristic_validation=parsed_document.validation,
            warnings=parsed_document.warnings,
        )
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except FileTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except TokenLimitExceededError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except EmptyExtractedTextError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except DocumentParsingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except OpenAIExtractionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except LLMJsonParsingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/analyze/clinicaltrials-export", response_model=list[ProtocolIntelligence])
async def analyze_clinicaltrials_export(file: UploadFile | None = File(default=None)) -> list[ProtocolIntelligence]:
    if file is None:
        raise HTTPException(status_code=400, detail="Missing file. Upload one CSV or JSON ClinicalTrials.gov export.")

    try:
        file_bytes = await file.read()
        return parse_clinicaltrials_export(file.filename or "", file_bytes)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except FileTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except ClinicalTrialsExportParsingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/export/csv")
async def export_csv(request: CsvExportRequest) -> Response:
    try:
        csv_payload = protocol_to_csv(request.data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not convert the provided protocol JSON into CSV.") from exc

    return Response(
        content=csv_payload,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="protocol-intelligence.csv"'},
    )
