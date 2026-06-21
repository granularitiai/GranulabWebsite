import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  FileJson,
  FileText,
  RotateCcw,
  UploadCloud,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_PROTOCOL_API_BASE_URL || "http://127.0.0.1:8000";

export default function ClinicalTrialIntelligenceAssistant() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportError, setExportError] = useState(null);

  async function handleAnalyzeProtocol(file) {
    setIsLoading(true);
    setError(null);
    setExportError(null);
    try {
      const data = await analyzeFile("/analyze/protocol", file);
      setResult([data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Protocol analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnalyzeExport(file) {
    setIsLoading(true);
    setError(null);
    setExportError(null);
    try {
      const data = await analyzeFile("/analyze/clinicaltrials-export", file);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ClinicalTrials.gov export analysis failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadJson() {
    if (!result) return;
    const payload = result.length === 1 ? result[0] : result;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, "protocol-intelligence.json");
  }

  async function handleDownloadCsv() {
    if (!result) return;
    setExportError(null);
    try {
      const payload = result.length === 1 ? result[0] : result;
      const response = await fetch(`${API_BASE_URL}/export/csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      downloadBlob(await response.blob(), "protocol-intelligence.csv");
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "CSV export failed.");
    }
  }

  return (
    <section className="product-light-surface bg-biotech-mist text-biotech-ink">
      <div className="border-b border-biotech-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold text-biotech-ink">Granulariti Product</p>
            <h1 className="text-2xl font-semibold text-biotech-ink">
              Clinical Trial Intelligence Assistant
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-biotech-slate">
              Convert clinical trial protocols and ClinicalTrials.gov exports into
              structured, reusable trial intelligence.
            </p>
          </div>
          <div className="w-fit rounded-md border border-biotech-line px-3 py-1 text-xs font-semibold text-biotech-slate">
            Research and operational intelligence
          </div>
        </div>
      </div>

      {result ? (
        <ResultsPage
          data={result}
          onReset={() => {
            setResult(null);
            setError(null);
            setExportError(null);
          }}
          onDownloadJson={handleDownloadJson}
          onDownloadCsv={handleDownloadCsv}
          exportError={exportError}
        />
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-6 lg:px-8">
            <section className="grid gap-6 lg:grid-cols-2">
              <UploadPanel
                title="Upload Clinical Trial Protocol"
                acceptedLabel=".pdf, .docx"
                acceptedExtensions={[".pdf", ".docx"]}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                kind="protocol"
                onAnalyze={handleAnalyzeProtocol}
                isLoading={isLoading}
              />
              <UploadPanel
                title="Upload ClinicalTrials.gov Export"
                acceptedLabel=".csv, .json"
                acceptedExtensions={[".csv", ".json"]}
                accept=".csv,.json,application/json,text/csv"
                kind="export"
                onAnalyze={handleAnalyzeExport}
                isLoading={isLoading}
              />
            </section>

            {(isLoading || error) && (
              <section className="mx-auto w-full max-w-3xl">
                {isLoading && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Validating the source and generating structured trial intelligence.
                  </div>
                )}
                {error && (
                  <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                    <span>{error}</span>
                  </div>
                )}
              </section>
            )}

            <section className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                Granulariti Protocol Intelligence
              </div>
              <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-biotech-ink sm:text-5xl">
                Turn clinical trial protocols into structured intelligence in
                seconds.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-biotech-slate">
                Transform protocol documents into reusable trial design,
                eligibility, endpoint, safety, schedule, and operational risk
                intelligence.
              </p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  "Protocol-only extraction",
                  "Strict structured output",
                  "Confidence scoring",
                  "JSON and CSV export",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-center gap-2 rounded-md border border-biotech-line bg-white px-3 py-2 text-sm text-biotech-slate"
                  >
                    <CheckCircle2 className="text-biotech-teal" size={17} />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-6 lg:px-8">
            <EmptyState />
          </div>
        </>
      )}
    </section>
  );
}

function UploadPanel({
  title,
  acceptedLabel,
  acceptedExtensions,
  accept,
  kind,
  onAnalyze,
  isLoading,
}) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  function handleFile(file) {
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!acceptedExtensions.includes(extension)) {
      setSelectedFile(null);
      setLocalError(`Only ${acceptedLabel} files are supported for this upload.`);
      return;
    }
    setLocalError(null);
    setSelectedFile(file);
  }

  return (
    <div className="rounded-lg border border-biotech-line bg-white p-5 shadow-clinical">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-md bg-teal-50 p-2 text-biotech-teal">
          {kind === "protocol" ? <UploadCloud size={22} /> : <Database size={22} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-biotech-ink">{title}</h2>
          <p className="text-sm text-biotech-slate">Accepted files: {acceptedLabel}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files[0]);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="flex min-h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-biotech-mist px-6 py-8 text-center transition hover:border-biotech-teal hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-biotech-teal"
      >
        <FileText className="mb-3 text-biotech-blue" size={34} />
        <span className="text-sm font-semibold text-biotech-ink">
          Select or drop a file
        </span>
        <span className="mt-1 text-sm text-biotech-slate">{acceptedLabel} only</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {selectedFile && (
        <div className="mt-4 grid gap-3 rounded-lg border-2 border-biotech-blue bg-white p-4 shadow-clinical sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-biotech-blue">
              File ready
            </p>
            <p className="truncate text-sm font-medium text-biotech-ink">
              {selectedFile.name}
            </p>
            <p className="text-xs text-biotech-slate">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onAnalyze(selectedFile)}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-biotech-ink px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "#1677a8", color: "#ffffff" }}
          >
            {isLoading
              ? "Analyzing..."
              : kind === "protocol"
                ? "Analyze Protocol"
                : "Analyze Export"}
          </button>
        </div>
      )}

      {localError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {localError}
        </p>
      )}
    </div>
  );
}

function ResultsPage({
  data,
  onReset,
  onDownloadJson,
  onDownloadCsv,
  exportError,
}) {
  const [tab, setTab] = useState("overview");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = data[selectedIndex] || data[0];
  const avgConfidence = useMemo(() => {
    const values = Object.values(selected.confidence || {}).map(
      (item) => item.confidence,
    );
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : selected.document_validation?.source_confidence;
  }, [selected]);

  const sourceLabel =
    selected.source_type === "protocol_document"
      ? "Clinical trial protocol"
      : "ClinicalTrials.gov export";

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-biotech-teal">
            Clinical Trial Protocol Intelligence Assistant
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-biotech-ink">
            {selected.protocol_identifiers?.protocol_title ||
              "Structured Trial Intelligence"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-md border border-biotech-line bg-white px-2.5 py-1 text-xs font-medium text-biotech-slate">
              Source: {sourceLabel}
            </span>
            <ConfidenceBadge
              value={selected.document_validation?.source_confidence}
              label="Source validation"
            />
            <ConfidenceBadge value={avgConfidence} label="Extraction" />
          </div>
          {data.length > 1 && (
            <label className="mt-4 block max-w-xl text-sm font-semibold text-biotech-ink">
              Export record
              <select
                className="mt-2 w-full rounded-md border border-biotech-line bg-white px-3 py-2 text-sm font-normal text-biotech-ink"
                value={selectedIndex}
                onChange={(event) => setSelectedIndex(Number(event.target.value))}
              >
                {data.map((record, index) => (
                  <option
                    key={`${record.protocol_identifiers?.nct_id || "record"}-${index}`}
                    value={index}
                  >
                    {record.protocol_identifiers?.nct_id || `Record ${index + 1}`} -{" "}
                    {record.protocol_identifiers?.protocol_title || "Untitled study"}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ProductButton onClick={onReset} variant="light">
            <RotateCcw size={16} /> New Upload
          </ProductButton>
          <ProductButton onClick={onDownloadJson}>
            <FileJson size={16} /> Download JSON
          </ProductButton>
          <ProductButton onClick={onDownloadCsv} variant="blue">
            <Download size={16} /> Download CSV
          </ProductButton>
        </div>
      </div>

      {((selected.document_validation?.warnings || []).length > 0 ||
        exportError) && (
        <div className="mb-5 space-y-2">
          {(selected.document_validation?.warnings || []).map((warning) => (
            <div
              key={warning}
              className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <span>{warning}</span>
            </div>
          ))}
          {exportError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {exportError}
            </div>
          )}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-biotech-line bg-white p-2 shadow-clinical">
        {[
          ["overview", "Overview"],
          ["design", "Design"],
          ["operations", "Operations"],
          ["json", "Raw JSON"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`rounded-md border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? "border-biotech-blue bg-transparent text-biotech-ink"
                : "border-transparent bg-transparent text-biotech-ink hover:bg-biotech-mist"
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab data={selected} />}
      {tab === "design" && <DesignTab data={selected} />}
      {tab === "operations" && <OperationsTab data={selected} />}
      {tab === "json" && (
        <SectionCard title="Raw JSON">
          <JsonViewer data={selected} />
        </SectionCard>
      )}
    </div>
  );
}

function OverviewTab({ data }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Executive Summary">
        <p className="text-sm leading-6 text-biotech-slate">
          {data.study_overview?.brief_summary ||
            "No executive summary found in the protocol text."}
        </p>
        <KeyValueGrid
          items={{
            Sponsor: data.protocol_identifiers?.sponsor,
            "NCT ID": data.protocol_identifiers?.nct_id,
            Phase: data.study_overview?.phase,
            Status: data.study_overview?.overall_status,
            Condition: data.study_overview?.condition,
            "Therapeutic Area": data.study_overview?.therapeutic_area,
            "Study Type": data.study_overview?.study_type,
          }}
        />
      </SectionCard>
      <SectionCard title="Missing Information">
        <SimpleList
          items={data.missing_information || []}
          empty="No missing information was identified."
        />
      </SectionCard>
      <SectionCard title="Objectives">
        <GroupedObjects
          groups={[
            ["Primary", data.objectives?.primary_objectives || []],
            ["Secondary", data.objectives?.secondary_objectives || []],
            ["Exploratory", data.objectives?.exploratory_objectives || []],
          ]}
          render={(item) => item.text}
        />
      </SectionCard>
      <SectionCard title="Endpoints">
        <GroupedObjects
          groups={[
            ["Primary", data.endpoints?.primary_endpoints || []],
            ["Secondary", data.endpoints?.secondary_endpoints || []],
            ["Exploratory", data.endpoints?.exploratory_endpoints || []],
          ]}
          render={(item) =>
            [item.name, item.description, item.time_frame].filter(Boolean).join(" | ")
          }
        />
      </SectionCard>
    </div>
  );
}

function DesignTab({ data }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Trial Design">
        <KeyValueGrid
          items={{
            Allocation: data.study_design?.allocation,
            "Intervention Model": data.study_design?.intervention_model,
            Masking: data.study_design?.masking,
            "Primary Purpose": data.study_design?.primary_purpose,
            Enrollment: data.study_design?.enrollment,
            "Number of Arms": data.study_design?.number_of_arms,
            Duration: data.study_design?.duration,
          }}
        />
      </SectionCard>
      <SectionCard title="Eligibility Criteria">
        <KeyValueGrid
          items={{
            Sex: data.eligibility?.sex,
            "Minimum Age": data.eligibility?.minimum_age,
            "Maximum Age": data.eligibility?.maximum_age,
            "Healthy Volunteers": data.eligibility?.healthy_volunteers,
          }}
        />
        <h3 className="mt-5 text-sm font-semibold text-biotech-ink">
          Inclusion Criteria
        </h3>
        <SimpleList
          items={data.eligibility?.inclusion_criteria || []}
          empty="No inclusion criteria found."
        />
        <h3 className="mt-5 text-sm font-semibold text-biotech-ink">
          Exclusion Criteria
        </h3>
        <SimpleList
          items={data.eligibility?.exclusion_criteria || []}
          empty="No exclusion criteria found."
        />
      </SectionCard>
      <SectionCard title="Arms & Interventions">
        <SimpleList
          items={[
            ...(data.arms || []).map(
              (arm) => `${arm.name || "Unnamed arm"}: ${arm.description || "No description"}`,
            ),
            ...(data.interventions || []).map(
              (intervention) =>
                `${intervention.name || "Unnamed intervention"}: ${
                  intervention.description || "No description"
                }`,
            ),
          ]}
          empty="No arms or interventions found."
        />
      </SectionCard>
      <SectionCard title="Schedule of Activities">
        <SimpleList
          items={(data.visit_schedule || []).map((visit) =>
            [
              visit.visit,
              visit.timing,
              visit.window,
              (visit.activities || []).join(", "),
            ]
              .filter(Boolean)
              .join(" | "),
          )}
          empty="No schedule of activities found."
        />
      </SectionCard>
      <SectionCard title="Locations">
        <SimpleList
          items={(data.locations || []).map((location) =>
            [
              location.facility,
              location.city,
              location.state,
              location.country,
              location.raw,
            ]
              .filter(Boolean)
              .join(" | "),
          )}
          empty="No locations found."
        />
      </SectionCard>
    </div>
  );
}

function OperationsTab({ data }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Safety Monitoring">
        <KeyValueGrid
          items={{
            "Adverse Event Monitoring":
              data.safety_monitoring?.adverse_event_monitoring,
            "Serious Adverse Event Reporting":
              data.safety_monitoring?.serious_adverse_event_reporting,
            "Dose Modification Rules":
              data.safety_monitoring?.dose_modification_rules,
            "Stopping Rules": data.safety_monitoring?.stopping_rules,
          }}
        />
      </SectionCard>
      <SectionCard title="Statistical Considerations">
        <KeyValueGrid
          items={{
            "Sample Size Rationale":
              data.statistical_considerations?.sample_size_rationale,
            "Analysis Population":
              data.statistical_considerations?.analysis_population,
            "Primary Analysis Method":
              data.statistical_considerations?.primary_analysis_method,
            "Interim Analysis": data.statistical_considerations?.interim_analysis,
          }}
        />
      </SectionCard>
      <SectionCard title="Operational Risk Flags">
        <SimpleList
          items={(data.operational_risk_flags || []).map(
            (flag) =>
              `${flag.severity.toUpperCase()}: ${flag.risk} - ${flag.rationale}`,
          )}
          empty="No operational risk flags identified."
        />
      </SectionCard>
      <SectionCard title="Confidence Scores">
        <div className="grid gap-3">
          {Object.entries(data.confidence || {}).length === 0 && (
            <p className="text-sm text-biotech-slate">
              No field-level confidence scores returned.
            </p>
          )}
          {Object.entries(data.confidence || {}).map(([field, confidence]) => (
            <div key={field} className="rounded-md border border-biotech-line p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-biotech-ink">
                  {field}
                </span>
                <ConfidenceBadge value={confidence.confidence} />
              </div>
              {confidence.rationale && (
                <p className="mt-2 text-sm text-biotech-slate">
                  {confidence.rationale}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-lg border border-biotech-line bg-white p-5 shadow-clinical">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-biotech-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function KeyValueGrid({ items }) {
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {Object.entries(items).map(([key, value]) => (
        <div
          key={key}
          className="rounded-md border border-biotech-line bg-biotech-mist px-3 py-2"
        >
          <dt className="text-xs font-semibold uppercase text-biotech-slate">
            {key}
          </dt>
          <dd className="mt-1 text-sm text-biotech-ink">{value ?? "Not found"}</dd>
        </div>
      ))}
    </dl>
  );
}

function SimpleList({ items, empty }) {
  if (!items.length) return <p className="text-sm text-biotech-slate">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-md border border-biotech-line bg-biotech-mist px-3 py-2 text-sm leading-6 text-biotech-slate"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function GroupedObjects({ groups, render }) {
  return (
    <div className="space-y-4">
      {groups.map(([label, items]) => (
        <div key={label}>
          <h3 className="text-sm font-semibold text-biotech-ink">{label}</h3>
          <SimpleList
            items={items.map(render).filter(Boolean)}
            empty={`No ${label.toLowerCase()} items found.`}
          />
        </div>
      ))}
    </div>
  );
}

function ConfidenceBadge({ value, label = "Confidence" }) {
  const normalized = typeof value === "number" ? value : 0;
  const color =
    normalized >= 0.75
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : normalized >= 0.45
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium ${color}`}
    >
      {label}: {(normalized * 100).toFixed(0)}%
    </span>
  );
}

function JsonViewer({ data }) {
  return (
    <pre className="max-h-[560px] overflow-auto rounded-lg border border-biotech-line bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-biotech-line bg-white p-8 text-center shadow-clinical">
      <ClipboardList className="mx-auto mb-3 text-biotech-blue" size={32} />
      <h2 className="text-base font-semibold text-biotech-ink">
        No protocol intelligence generated yet
      </h2>
      <p className="mt-2 text-sm text-biotech-slate">
        Upload a PDF or DOCX clinical trial protocol, or a ClinicalTrials.gov CSV
        or JSON export, to populate the intelligence dashboard.
      </p>
      <p className="mx-auto mt-4 max-w-3xl text-xs leading-5 text-biotech-slate">
        This tool is for research and operational intelligence only. Outputs
        should be reviewed by qualified humans before clinical, regulatory, or
        patient-impacting decisions.
      </p>
    </div>
  );
}

function ProductButton({ children, onClick, variant = "dark" }) {
  const classes = {
    light:
      "border border-biotech-line bg-white text-biotech-ink hover:bg-biotech-mist",
    dark: "bg-biotech-ink text-white hover:bg-biotech-navy",
    blue: "bg-biotech-blue text-white hover:bg-biotech-ink",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${classes[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

async function analyzeFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json();
}

async function readApiError(response) {
  try {
    const payload = await response.json();
    return payload.detail || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
