import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileText,
  LineChart,
  PieChart,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TableProperties,
  UploadCloud,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = (
  import.meta.env.VITE_PROTOCOL_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "https://granulariti-protocol-intelligence-api.onrender.com")
).replace(/\/$/, "");

const chartColors = ["#32a9ff", "#8b5cf6", "#14b8a6", "#f59e0b", "#ef4444"];

const supportedDataTypes = [
  "Clinical trial exports",
  "Laboratory assay data",
  "Biomarker datasets",
  "Adverse event summaries",
  "Enrollment and operations data",
  "CSV and JSON tables",
];

const exampleColumns = [
  ["subject_id", "categorical"],
  ["visit", "categorical"],
  ["treatment_arm", "categorical"],
  ["biomarker_value", "numeric"],
  ["collection_date", "date"],
  ["response_status", "categorical"],
];

export default function ClinicalDataVisualizationAssistant() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysis = useMemo(() => analyzeDataset(rows, columns), [rows, columns]);
  const hasData = rows.length > 0;

  async function handleFile(file) {
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseDataset(file.name, text);
      const localAnalysis = analyzeDataset(parsed.rows, parsed.columns);
      setFileName(file.name);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setAiAnalysis(null);
      setAiError(null);
      await requestModelAnalysis(file.name, parsed, localAnalysis);
    } catch (err) {
      setRows([]);
      setColumns([]);
      setFileName("");
      setAiAnalysis(null);
      setAiError(null);
      setError(err instanceof Error ? err.message : "Could not parse this dataset.");
    }
  }

  async function requestModelAnalysis(name, parsed, localAnalysis) {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/analyze/clinical-data-visualization`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: name,
            rowCount: parsed.rows.length,
            columnCount: parsed.columns.length,
            columns: localAnalysis.columnProfiles,
            sampleRows: parsed.rows.slice(0, 50),
          }),
        },
      );
      if (!response.ok) throw new Error(await readApiError(response));
      setAiAnalysis(await response.json());
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "AI visualization analysis failed. Local profiling is still available.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setFileName("");
    setRows([]);
    setColumns([]);
    setError(null);
    setAiAnalysis(null);
    setAiError(null);
    setIsAnalyzing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="bg-ink text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(50,169,255,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.16),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">
              Granulariti Product
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Clinical Data Visualization Assistant
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Upload clinical trial, laboratory, biomarker, or biotech datasets and
              receive scientifically relevant visualizations, data-quality checks,
              and AI-assisted analysis recommendations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-electric px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-sky-300"
              >
                <UploadCloud size={18} /> Launch Visualization Assistant
              </button>
              {hasData && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-electric/60 hover:bg-white/12"
                >
                  <RefreshCcw size={18} /> Reset Dataset
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-glow backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2">
              {exampleColumns.map(([name, type]) => (
                <div
                  key={name}
                  className="rounded-xl border border-white/10 bg-ink/60 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {type}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {name}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-electric/20 bg-electric/10 p-4 text-sm leading-6 text-slate-200">
              <ShieldCheck className="mb-2 text-electric" size={22} />
              Exploratory use only. Do not upload patient-identifying data,
              protected health information, or regulated production datasets.
              This client-side prototype is for scientific exploration and review
              by qualified humans.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <UploadPanel
            inputRef={inputRef}
            fileName={fileName}
            hasData={hasData}
            error={error}
            onFile={handleFile}
          />
          <SupportedDataPanel />
        </section>

        {hasData ? (
          <div className="mt-8 space-y-6">
            <ModelStatus
              aiAnalysis={aiAnalysis}
              aiError={aiError}
              isAnalyzing={isAnalyzing}
            />
            <DatasetProfile analysis={analysis} fileName={fileName} />
            <InsightColumns aiAnalysis={aiAnalysis} />
            <Recommendations
              recommendations={analysis.recommendations}
              aiAnalysis={aiAnalysis}
            />
            <GeneratedVisualizations
              analysis={analysis}
              aiAnalysis={aiAnalysis}
              aiError={aiError}
              isAnalyzing={isAnalyzing}
              rows={rows}
            />
            <QualityFindings
              findings={analysis.qualityFindings}
              aiAnalysis={aiAnalysis}
            />
            <ExportControls
              analysis={analysis}
              aiAnalysis={aiAnalysis}
              rows={rows}
              fileName={fileName}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function UploadPanel({ inputRef, fileName, hasData, error, onFile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-glow">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-electric/12 p-3 text-electric">
          <UploadCloud size={24} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Upload a Dataset</h2>
          <p className="mt-1 text-sm text-slate-400">Accepted files: .csv, .json</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          onFile(event.dataTransfer.files[0]);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="mt-5 flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-electric/35 bg-ink/60 px-6 py-10 text-center transition hover:border-electric hover:bg-electric/10 focus:outline-none focus:ring-2 focus:ring-electric"
      >
        <FileText className="mb-3 text-electric" size={36} />
        <span className="text-base font-semibold text-white">
          Select or drop a clinical dataset
        </span>
        <span className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Upload CSV or JSON data to profile fields, identify quality risks, and
          generate visualization recommendations.
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv,.json,application/json,text/csv"
        onChange={(event) => onFile(event.target.files?.[0])}
      />

      {hasData && (
        <div className="mt-5 rounded-xl border border-electric/30 bg-electric/10 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-electric">
            Dataset ready
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{fileName}</p>
        </div>
      )}

      {error && (
        <div className="mt-5 flex gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}

function SupportedDataPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-midnight/70 p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-violet/15 p-3 text-violet">
          <Database size={24} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Supported Data Types</h2>
          <p className="mt-1 text-sm text-slate-400">
            Built for clinical, biotech, and translational analytics workflows.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {supportedDataTypes.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold text-slate-200"
          >
            <CheckCircle2 className="shrink-0 text-electric" size={18} />
            {item}
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        This assistant produces exploratory analysis guidance. It is not a
        validated clinical, regulatory, safety, or diagnostic decision system.
      </div>
    </section>
  );
}

function DatasetProfile({ analysis, fileName }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <SectionTitle
        icon={TableProperties}
        title="Dataset Profile Results"
        subtitle={fileName}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Rows" value={analysis.rowCount} />
        <Metric label="Columns" value={analysis.columnCount} />
        <Metric label="Numeric fields" value={analysis.numericColumns.length} />
        <Metric label="Date fields" value={analysis.dateColumns.length} />
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Column</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Missing</th>
              <th className="px-4 py-3">Unique</th>
              <th className="px-4 py-3">Range / Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {analysis.columnProfiles.map((column) => (
              <tr key={column.name}>
                <td className="px-4 py-3 font-semibold text-white">{column.name}</td>
                <td className="px-4 py-3 text-slate-300">{column.type}</td>
                <td className="px-4 py-3 text-slate-300">{column.missingPercent}%</td>
                <td className="px-4 py-3 text-slate-300">{column.uniqueCount}</td>
                <td className="px-4 py-3 text-slate-300">{column.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModelStatus({ aiAnalysis, aiError, isAnalyzing }) {
  if (!isAnalyzing && !aiError && !aiAnalysis) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-midnight/70 p-5">
      {isAnalyzing && (
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <Sparkles className="text-electric" size={20} />
          GPT is analyzing the dataset, ranking insight columns, and selecting chart specs.
        </div>
      )}
      {aiAnalysis && !isAnalyzing && (
        <div className="flex items-start gap-3 text-sm leading-6 text-slate-200">
          <CheckCircle2 className="mt-0.5 shrink-0 text-electric" size={20} />
          <span>
            Model analysis complete with <strong>{aiAnalysis.model}</strong>:{" "}
            {aiAnalysis.analysisSummary}
          </span>
        </div>
      )}
      {aiError && !isAnalyzing && (
        <div className="flex items-start gap-3 text-sm leading-6 text-amber-50">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={20} />
          <span>
            GPT analysis is unavailable, so the page is showing local fallback
            profiling. Backend message: {aiError}
          </span>
        </div>
      )}
    </section>
  );
}

function InsightColumns({ aiAnalysis }) {
  if (!aiAnalysis?.insightColumns?.length) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <SectionTitle
        icon={Sparkles}
        title="Model-Selected Insight Columns"
        subtitle="Columns GPT selected as the most useful variables for charting and interpretation."
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {aiAnalysis.insightColumns.map((item) => (
          <div
            key={`${item.column}-${item.role}`}
            className="rounded-xl border border-white/10 bg-ink/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-base font-bold text-white">
                {item.column}
              </h3>
              <span className="rounded-full bg-electric/10 px-2.5 py-1 text-xs font-bold uppercase text-electric">
                {item.role}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Recommendations({ recommendations, aiAnalysis }) {
  const modelRecommendations = aiAnalysis?.chartSpecs?.map((spec) => ({
    chartType: spec.chartType,
    title: spec.title,
    fields: [spec.x, spec.y, spec.color].filter(Boolean),
    reason: spec.rationale,
    icon: chartIcon(spec.chartType),
  }));
  const visibleRecommendations = modelRecommendations?.length
    ? modelRecommendations
    : recommendations;

  return (
    <section className="rounded-2xl border border-white/10 bg-midnight/70 p-5">
      <SectionTitle
        icon={Sparkles}
        title="AI Visualization Recommendations"
        subtitle={
          aiAnalysis
            ? "GPT-selected chart plans based on dataset structure, clinical context, and candidate X/Y variables."
            : "Local fallback recommendations based on detected column types and clinical analytics patterns."
        }
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {visibleRecommendations.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-center gap-2 text-electric">
              <item.icon size={20} />
              <span className="text-xs font-bold uppercase tracking-wide">
                {item.chartType}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.reason}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fields: {item.fields.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function GeneratedVisualizations({ analysis, aiAnalysis, aiError, isAnalyzing, rows }) {
  const modelCharts = aiAnalysis?.chartSpecs || [];
  const shouldShowFallback = !isAnalyzing && !modelCharts.length && aiError;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <SectionTitle
        icon={BarChart3}
        title="Generated Visualizations"
        subtitle={
          modelCharts.length
            ? "Recharts visualizations generated from GPT-selected chart specs."
            : isAnalyzing
              ? "GPT is selecting the best chart types, X variables, and Y variables for this dataset."
              : "Fallback previews are available because GPT visualization generation did not complete."
        }
      />
      {isAnalyzing && !modelCharts.length ? (
        <VisualizationLoadingBar />
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {modelCharts.length
            ? modelCharts.map((spec) => (
                <ModelChartCard key={spec.id || spec.title} spec={spec} rows={rows} />
              ))
            : shouldShowFallback
              ? analysis.charts.map((chart) => (
                  <ChartCard key={chart.title} chart={chart} />
                ))
              : null}
        </div>
      )}
    </section>
  );
}

function VisualizationLoadingBar() {
  return (
    <div className="mt-5 rounded-2xl border border-electric/20 bg-ink/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Generating visualizations</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            GPT is ranking insight columns and preparing Recharts chart specs.
          </p>
        </div>
        <Sparkles className="shrink-0 text-electric" size={24} />
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[visualization-progress_1.5s_ease-in-out_infinite] rounded-full bg-electric shadow-glow" />
      </div>
    </div>
  );
}

function QualityFindings({ findings, aiAnalysis }) {
  const visibleFindings = aiAnalysis?.dataQualityFindings?.length
    ? aiAnalysis.dataQualityFindings
    : findings;
  return (
    <section className="rounded-2xl border border-white/10 bg-midnight/70 p-5">
      <SectionTitle
        icon={AlertTriangle}
        title="Data-Quality Findings"
        subtitle={
          aiAnalysis
            ? "Model-detected issues that may affect visualization, modeling, or interpretation."
            : "Local checks to review before modeling, visualization, or operational decisions."
        }
      />
      <div className="mt-5 grid gap-3">
        {visibleFindings.map((finding) => (
          <div
            key={finding.title}
            className={`rounded-xl border px-4 py-3 ${
              finding.severity === "high"
                ? "border-red-400/25 bg-red-500/10"
                : finding.severity === "medium"
                  ? "border-amber-300/25 bg-amber-300/10"
                  : "border-electric/25 bg-electric/10"
            }`}
          >
            <p className="text-sm font-bold text-white">{finding.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{finding.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExportControls({ analysis, aiAnalysis, rows, fileName }) {
  const profile = {
    fileName,
    generatedAt: new Date().toISOString(),
    profile: {
      rowCount: analysis.rowCount,
      columnCount: analysis.columnCount,
      columns: analysis.columnProfiles,
    },
    modelAnalysis: aiAnalysis,
    recommendations: analysis.recommendations.map(({ icon, ...item }) => item),
    qualityFindings: analysis.qualityFindings,
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <SectionTitle
        icon={Download}
        title="Export Controls"
        subtitle="Download analysis outputs for review, documentation, or downstream notebooks."
      />
      <div className="mt-5 flex flex-wrap gap-3">
        <ExportButton
          icon={FileJson}
          label="Download Profile JSON"
          onClick={() =>
            downloadText(
              "clinical-data-visualization-profile.json",
              JSON.stringify(profile, null, 2),
              "application/json",
            )
          }
        />
        <ExportButton
          icon={FileText}
          label="Download Column Summary CSV"
          onClick={() =>
            downloadText(
              "clinical-data-column-summary.csv",
              toCsv(
                analysis.columnProfiles.map((column) => ({
                  column: column.name,
                  type: column.type,
                  missing_percent: column.missingPercent,
                  unique_count: column.uniqueCount,
                  summary: column.summary,
                })),
              ),
              "text/csv",
            )
          }
        />
        <ExportButton
          icon={Database}
          label="Download Clean Preview JSON"
          onClick={() =>
            downloadText(
              "clinical-data-preview.json",
              JSON.stringify(rows.slice(0, 100), null, 2),
              "application/json",
            )
          }
        />
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center">
      <LineChart className="mx-auto text-electric" size={36} />
      <h2 className="mt-4 text-xl font-bold text-white">
        Upload a dataset to generate visualization intelligence.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        The assistant will profile fields, infer column types, recommend
        scientific visualizations, flag data-quality risks, and generate chart
        previews without replacing expert review.
      </p>
    </section>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-electric/12 p-2.5 text-electric">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ExportButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-electric/60 hover:bg-white/12"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function ModelChartCard({ spec, rows }) {
  const chartData = buildModelChartData(rows, spec);
  return (
    <article className="rounded-2xl border border-white/10 bg-ink/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{spec.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{spec.insight}</p>
        </div>
        <span className="rounded-full bg-electric/10 px-2.5 py-1 text-xs font-bold uppercase text-electric">
          {spec.chartType}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        X: {formatFieldName(spec.x)}
        {spec.y ? ` | Y: ${formatFieldName(spec.y)}` : ""}
        {spec.color ? ` | Group: ${formatFieldName(spec.color)}` : ""}
      </p>
      <div className="mt-4 h-64 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderRechart(spec, chartData)}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-slate-500">
            This chart spec could not be rendered from the current row values.
            Review the selected X/Y variables.
          </div>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{spec.rationale}</p>
    </article>
  );
}

function renderRechart(spec, data) {
  const yKey = spec.y || "value";
  const seriesKeys = getSeriesKeys(data, spec);
  if (spec.chartType === "line") {
    return (
      <RechartsLineChart data={data}>
        <CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {(seriesKeys.length ? seriesKeys : [yKey]).map((key, index) => (
          <Line key={key} type="monotone" dataKey={key} name={key} stroke={chartColors[index % chartColors.length]} strokeWidth={2} dot={false} connectNulls />
        ))}
      </RechartsLineChart>
    );
  }
  if (spec.chartType === "area") {
    return (
      <AreaChart data={data}>
        <CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        {(seriesKeys.length ? seriesKeys : [yKey]).map((key, index) => (
          <Area key={key} type="monotone" dataKey={key} name={key} stroke={chartColors[index % chartColors.length]} fill={chartColors[index % chartColors.length]} fillOpacity={0.2} connectNulls />
        ))}
      </AreaChart>
    );
  }
  if (spec.chartType === "scatter") {
    return (
      <ScatterChart>
        <CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="x" name={spec.x} stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <YAxis dataKey={yKey} name={spec.y || "value"} stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
        {seriesKeys.length ? seriesKeys.map((key, index) => (
          <Scatter key={key} name={key} data={data.filter((row) => row.__series === key)} fill={chartColors[index % chartColors.length]} />
        )) : <Scatter data={data} fill="#32a9ff" />}
        {seriesKeys.length > 0 && <Legend />}
      </ScatterChart>
    );
  }
  if (spec.chartType === "pie") {
    return (
      <RechartsPieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie data={data} dataKey="value" nameKey="x" innerRadius={42} outerRadius={82}>
          {data.map((entry, index) => (
            <Cell key={entry.x} fill={chartColors[index % chartColors.length]} />
          ))}
        </Pie>
        <Legend />
      </RechartsPieChart>
    );
  }
  return (
    <BarChart data={data}>
      <CartesianGrid stroke="#1e293b" />
      <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 11 }} />
      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
      <Tooltip contentStyle={tooltipStyle} />
      {seriesKeys.length > 0 && <Legend />}
      {(seriesKeys.length ? seriesKeys : [yKey]).map((key, index) => (
        <Bar key={key} dataKey={key} name={key} fill={chartColors[index % chartColors.length]} radius={[6, 6, 0, 0]} />
      ))}
    </BarChart>
  );
}

const tooltipStyle = {
  backgroundColor: "#0b1023",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  color: "#fff",
};

function ChartCard({ chart }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-ink/60 p-4">
      <h3 className="text-base font-bold text-white">{chart.title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-400">{chart.subtitle}</p>
      <div className="mt-4 h-56 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        {chart.data.length ? (
          <>
            {chart.type === "bar" && <BarSvg data={chart.data} />}
            {chart.type === "histogram" && <HistogramSvg data={chart.data} />}
            {chart.type === "scatter" && <ScatterSvg data={chart.data} />}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-slate-500">
            Upload a dataset with categorical or numeric columns to generate a
            chart preview.
          </div>
        )}
      </div>
    </article>
  );
}

function BarSvg({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <svg viewBox="0 0 320 190" role="img" className="h-full w-full">
      {data.map((item, index) => {
        const barHeight = (item.value / max) * 120;
        const x = 18 + index * 58;
        const y = 145 - barHeight;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width="34" height={barHeight} rx="6" fill="#32a9ff" />
            <text x={x + 17} y="166" textAnchor="middle" fontSize="9" fill="#94a3b8">
              {shortLabel(item.label)}
            </text>
            <text x={x + 17} y={Math.max(14, y - 6)} textAnchor="middle" fontSize="10" fill="#e2e8f0">
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HistogramSvg({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <svg viewBox="0 0 320 190" role="img" className="h-full w-full">
      {data.map((item, index) => {
        const barHeight = (item.value / max) * 118;
        const x = 16 + index * 29;
        const y = 145 - barHeight;
        return (
          <rect
            key={`${item.label}-${index}`}
            x={x}
            y={y}
            width="22"
            height={barHeight}
            rx="4"
            fill={index % 2 ? "#8b5cf6" : "#32a9ff"}
          />
        );
      })}
      <text x="16" y="166" fontSize="10" fill="#94a3b8">
        low
      </text>
      <text x="288" y="166" textAnchor="end" fontSize="10" fill="#94a3b8">
        high
      </text>
    </svg>
  );
}

function ScatterSvg({ data }) {
  return (
    <svg viewBox="0 0 320 190" role="img" className="h-full w-full">
      <line x1="28" y1="150" x2="294" y2="150" stroke="#334155" />
      <line x1="28" y1="20" x2="28" y2="150" stroke="#334155" />
      {data.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={28 + point.x * 266}
          cy={150 - point.y * 130}
          r="5"
          fill={index % 2 ? "#8b5cf6" : "#32a9ff"}
          opacity="0.82"
        />
      ))}
    </svg>
  );
}

function parseDataset(fileName, text) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (extension === ".csv") return parseCsvDataset(text);
  if (extension === ".json") return parseJsonDataset(text);
  throw new Error("Unsupported file type. Please upload a CSV or JSON file.");
}

function parseCsvDataset(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV must include a header row and data rows.");
  const headers = rows[0].map((header, index) => header.trim() || `column_${index + 1}`);
  const records = rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
    );
  if (!records.length) throw new Error("No data rows were found in this CSV.");
  return { rows: records, columns: headers };
}

function parseJsonDataset(text) {
  const parsed = JSON.parse(text);
  const records = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.records)
        ? parsed.records
        : null;
  if (!records || !records.length || typeof records[0] !== "object") {
    throw new Error("JSON must be an array of objects, or contain a data/records array.");
  }
  const columns = [...new Set(records.flatMap((row) => Object.keys(row)))];
  return {
    rows: records.map((row) =>
      Object.fromEntries(columns.map((column) => [column, normalizeCell(row[column])])),
    ),
    columns,
  };
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function analyzeDataset(rows, columns) {
  const columnProfiles = columns.map((name) => profileColumn(name, rows));
  const numericColumns = columnProfiles.filter((column) => column.type === "numeric");
  const categoricalColumns = columnProfiles.filter((column) => column.type === "categorical");
  const dateColumns = columnProfiles.filter((column) => column.type === "date");
  const recommendations = makeRecommendations({
    numericColumns,
    categoricalColumns,
    dateColumns,
  });
  const qualityFindings = makeQualityFindings(rows, columnProfiles);
  const charts = makeCharts(rows, { numericColumns, categoricalColumns });

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columnProfiles,
    numericColumns,
    categoricalColumns,
    dateColumns,
    recommendations,
    qualityFindings,
    charts,
  };
}

function profileColumn(name, rows) {
  const values = rows.map((row) => normalizeCell(row[name]));
  const populated = values.filter((value) => value !== "");
  const uniqueValues = [...new Set(populated)];
  const numericValues = populated.map(Number).filter((value) => Number.isFinite(value));
  const dateValues = populated.filter((value) => !Number.isNaN(Date.parse(value)));
  const type =
    populated.length > 0 && numericValues.length / populated.length >= 0.85
      ? "numeric"
      : populated.length > 0 && dateValues.length / populated.length >= 0.85
        ? "date"
        : "categorical";
  const missingPercent = rows.length
    ? Math.round(((rows.length - populated.length) / rows.length) * 100)
    : 0;

  let summary = uniqueValues[0] || "No populated values";
  if (type === "numeric" && numericValues.length) {
    summary = `${formatNumber(Math.min(...numericValues))} to ${formatNumber(
      Math.max(...numericValues),
    )}`;
  } else if (type === "date" && dateValues.length) {
    const timestamps = dateValues.map((value) => Date.parse(value));
    summary = `${new Date(Math.min(...timestamps)).toLocaleDateString()} to ${new Date(
      Math.max(...timestamps),
    ).toLocaleDateString()}`;
  }

  return {
    name,
    type,
    missingPercent,
    uniqueCount: uniqueValues.length,
    summary,
    numericValues,
    values,
  };
}

function makeRecommendations({ numericColumns, categoricalColumns, dateColumns }) {
  const recommendations = [];
  const primaryCategory = findColumn(categoricalColumns, [
    "arm",
    "group",
    "treatment",
    "cohort",
    "site",
    "status",
    "response",
  ]);
  const primaryNumeric = findColumn(numericColumns, [
    "value",
    "score",
    "change",
    "count",
    "age",
    "biomarker",
    "result",
  ]);
  const secondaryNumeric = numericColumns.find((column) => column.name !== primaryNumeric?.name);
  const primaryDate = findColumn(dateColumns, ["date", "time", "visit", "month"]);

  if (primaryCategory) {
    recommendations.push({
      chartType: "Distribution",
      title: `Compare records by ${primaryCategory.name}`,
      fields: [primaryCategory.name],
      reason:
        "Categorical distributions help inspect arm balance, site concentration, response mix, and operational skew.",
      icon: PieChart,
    });
  }
  if (primaryNumeric) {
    recommendations.push({
      chartType: "Histogram",
      title: `Inspect ${primaryNumeric.name} distribution`,
      fields: [primaryNumeric.name],
      reason:
        "Numeric distributions reveal outliers, skew, impossible values, assay drift, and cohort separation signals.",
      icon: BarChart3,
    });
  }
  if (primaryNumeric && secondaryNumeric) {
    recommendations.push({
      chartType: "Scatter",
      title: `${primaryNumeric.name} versus ${secondaryNumeric.name}`,
      fields: [primaryNumeric.name, secondaryNumeric.name],
      reason:
        "Numeric pair plots are useful for biomarker relationships, baseline-adjusted trends, and early signal detection.",
      icon: LineChart,
    });
  }
  if (primaryDate && primaryNumeric) {
    recommendations.push({
      chartType: "Trend",
      title: `${primaryNumeric.name} over ${primaryDate.name}`,
      fields: [primaryDate.name, primaryNumeric.name],
      reason:
        "Longitudinal trends support visit-level review, lab drift checks, accrual monitoring, and temporal safety exploration.",
      icon: LineChart,
    });
  }

  return recommendations.slice(0, 3).length
    ? recommendations.slice(0, 3)
    : [
        {
          chartType: "Profile",
          title: "Start with a column completeness profile",
          fields: ["all columns"],
          reason:
            "The uploaded dataset has limited analyzable structure. Review missingness, unique counts, and field naming first.",
          icon: TableProperties,
        },
      ];
}

function makeQualityFindings(rows, columnProfiles) {
  const findings = [];
  const duplicateCount = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
  if (duplicateCount > 0) {
    findings.push({
      severity: "medium",
      title: "Duplicate records detected",
      detail: `${duplicateCount} fully duplicated row${duplicateCount === 1 ? "" : "s"} found. Confirm whether repeated records represent valid repeated measures or accidental duplication.`,
    });
  }

  columnProfiles
    .filter((column) => column.missingPercent >= 20)
    .slice(0, 4)
    .forEach((column) => {
      findings.push({
        severity: column.missingPercent >= 50 ? "high" : "medium",
        title: `High missingness in ${column.name}`,
        detail: `${column.missingPercent}% of records are missing this field. Review data capture, joins, and export logic before analysis.`,
      });
    });

  columnProfiles
    .filter((column) => column.type === "numeric" && hasNumericOutlier(column.numericValues))
    .slice(0, 4)
    .forEach((column) => {
      findings.push({
        severity: "medium",
        title: `Potential outliers in ${column.name}`,
        detail:
          "The numeric range suggests values far from the central distribution. Review units, assay limits, and data entry errors.",
      });
    });

  if (!findings.length) {
    findings.push({
      severity: "low",
      title: "No major browser-detectable issues found",
      detail:
        "No duplicate rows, high-missingness fields, or simple numeric outlier signals were detected. Continue with domain-specific validation.",
    });
  }
  return findings;
}

function makeCharts(rows, { numericColumns, categoricalColumns }) {
  const charts = [];
  const category = categoricalColumns[0];
  const numeric = numericColumns[0];
  const secondNumeric = numericColumns[1];

  if (category) {
    charts.push({
      type: "bar",
      title: `${category.name} Distribution`,
      subtitle: "Top categories by record count.",
      data: topCounts(category.values, 5),
    });
  }
  if (numeric) {
    charts.push({
      type: "histogram",
      title: `${numeric.name} Histogram`,
      subtitle: "Binned numeric distribution.",
      data: histogram(numeric.numericValues, 10),
    });
  }
  if (numeric && secondNumeric) {
    charts.push({
      type: "scatter",
      title: `${numeric.name} vs ${secondNumeric.name}`,
      subtitle: "Normalized point preview.",
      data: scatter(rows, numeric.name, secondNumeric.name),
    });
  }

  return charts.length ? charts : [
    {
      type: "bar",
      title: "Column Completeness",
      subtitle: "Populated fields by column.",
      data: [],
    },
  ];
}

function buildModelChartData(rows, spec) {
  if (!rows.length || !spec?.x) return [];
  if (spec.chartType === "histogram") {
    const values = rows
      .map((row) => Number(row[spec.y || spec.x]))
      .filter((value) => Number.isFinite(value));
    return histogram(values, 10).map((item) => ({ x: item.label, value: item.value }));
  }
  if (spec.chartType === "scatter") {
    if (!spec.y) return [];
    return rows
      .map((row) => ({
        x: Number(row[spec.x]),
        [spec.y]: Number(row[spec.y]),
        __series: spec.color ? formatCategoryValue(spec.color, row[spec.color]) : null,
      }))
      .filter((row) => Number.isFinite(row.x) && Number.isFinite(row[spec.y]))
      .slice(0, 150);
  }
  if (spec.aggregation === "none" && spec.y) {
    return rows
      .map((row) => ({
        x: formatCategoryValue(spec.x, row[spec.x]),
        [spec.y]: Number(row[spec.y]),
        __series: spec.color ? formatCategoryValue(spec.color, row[spec.color]) : null,
      }))
      .filter((row) => Number.isFinite(row[spec.y]))
      .slice(0, 80)
      .sort((a, b) => compareX(a.x, b.x));
  }
  const grouped = new Map();
  rows.forEach((row) => {
    const x = formatCategoryValue(spec.x, row[spec.x]);
    const series = spec.color ? formatCategoryValue(spec.color, row[spec.color]) : null;
    const groupKey = series ? `${x}\u0000${series}` : x;
    const value = spec.y ? Number(row[spec.y]) : null;
    if (!grouped.has(groupKey)) grouped.set(groupKey, { x, series, values: [] });
    if (spec.aggregation === "count" || !spec.y) {
      grouped.get(groupKey).values.push(1);
    } else if (Number.isFinite(value)) {
      grouped.get(groupKey).values.push(value);
    }
  });
  const pivoted = new Map();
  grouped.forEach(({ x, series, values }) => {
    const value = aggregate(values, spec.aggregation);
    if (!pivoted.has(x)) pivoted.set(x, { x });
    const item = pivoted.get(x);
    if (series) item[series] = value;
    else {
      item[spec.y || "value"] = value;
      item.value = value;
    }
  });
  return [...pivoted.values()]
    .sort((a, b) => compareX(a.x, b.x))
    .slice(0, 20);
}

function getSeriesKeys(data, spec) {
  if (!spec.color) return [];
  if (spec.chartType === "scatter") {
    return [...new Set(data.map((row) => row.__series).filter(Boolean))];
  }
  return [...new Set(data.flatMap((row) => Object.keys(row)))]
    .filter((key) => !["x", "value", "__series"].includes(key));
}

function formatFieldName(name) {
  return String(name || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCategoryValue(columnName, rawValue) {
  const value = normalizeCell(rawValue);
  if (!value) return "Missing";
  const column = String(columnName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalized = value.toLowerCase();

  if (/gender|sex/.test(column)) {
    if (["m", "male", "1"].includes(normalized)) return "Male";
    if (["f", "female", "2"].includes(normalized)) return "Female";
  }
  if (/smok/.test(column) && ["1", "2"].includes(normalized)) {
    return normalized === "1" ? "No" : "Yes";
  }
  if (/cancer|outcome|status|positive|response|event|dead|death|disease/.test(column)) {
    if (["0", "no", "n", "false", "negative"].includes(normalized)) return "No";
    if (["1", "yes", "y", "true", "positive"].includes(normalized)) return "Yes";
    if (normalized === "2") return "Yes";
  }
  return value;
}

function aggregate(values, aggregation) {
  if (!values.length) return 0;
  if (aggregation === "mean") {
    return round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
  if (aggregation === "median") {
    const sorted = [...values].sort((a, b) => a - b);
    return round(percentile(sorted, 0.5));
  }
  if (aggregation === "sum") {
    return round(values.reduce((sum, value) => sum + value, 0));
  }
  if (aggregation === "min") return round(Math.min(...values));
  if (aggregation === "max") return round(Math.max(...values));
  return values.length;
}

function compareX(a, b) {
  const aDate = Date.parse(a);
  const bDate = Date.parse(b);
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return aDate - bDate;
  const aNumber = Number(a);
  const bNumber = Number(b);
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
  return String(a).localeCompare(String(b));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function chartIcon(chartType) {
  if (["line", "area", "scatter"].includes(chartType)) return LineChart;
  if (chartType === "pie") return PieChart;
  return BarChart3;
}

function topCounts(values, limit) {
  const counts = new Map();
  values
    .filter((value) => value !== "")
    .forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function histogram(values, bins) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = max === min ? 1 : (max - min) / bins;
  const counts = Array.from({ length: bins }, (_, index) => ({
    label: `${round(min + index * width)}-${round(min + (index + 1) * width)}`,
    value: 0,
  }));
  values.forEach((value) => {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index].value += 1;
  });
  return counts;
}

function scatter(rows, xName, yName) {
  const points = rows
    .map((row) => ({ x: Number(row[xName]), y: Number(row[yName]) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .slice(0, 80);
  if (!points.length) return [];
  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));
  const yMin = Math.min(...points.map((point) => point.y));
  const yMax = Math.max(...points.map((point) => point.y));
  return points.map((point) => ({
    x: xMax === xMin ? 0.5 : (point.x - xMin) / (xMax - xMin),
    y: yMax === yMin ? 0.5 : (point.y - yMin) / (yMax - yMin),
  }));
}

function findColumn(columns, keywords) {
  return (
    columns.find((column) =>
      keywords.some((keyword) => column.name.toLowerCase().includes(keyword)),
    ) || columns[0]
  );
}

function hasNumericOutlier(values) {
  if (values.length < 8) return false;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return false;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return values.some((value) => value < low || value > high);
}

function percentile(sorted, p) {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function normalizeCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function shortLabel(value) {
  const label = String(value || "N/A");
  return label.length > 8 ? `${label.slice(0, 7)}...` : label;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toCsv(records) {
  if (!records.length) return "";
  const headers = Object.keys(records[0]);
  const lines = records.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(","),
  );
  return `${headers.join(",")}\n${lines.join("\n")}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function readApiError(response) {
  try {
    const payload = await response.json();
    return payload.detail || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
