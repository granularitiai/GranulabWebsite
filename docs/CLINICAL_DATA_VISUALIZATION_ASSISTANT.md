# Clinical Data Visualization Assistant

## Website Integration

The Clinical Data Visualization Assistant is integrated as a native React product page inside the Granulariti website.

Route:

```text
/products/clinical-data-visualization
```

Navigation:

```text
src/data/site.js
```

The product appears in the shared Products dropdown rendered by:

```text
src/components/Navbar.jsx
```

The route is registered in:

```text
src/main.jsx
```

The page component lives at:

```text
src/pages/products/ClinicalDataVisualizationAssistant.jsx
```

## Deployment Model

This product ships with the existing React/Vite frontend on Vercel and uses the existing Protocol Intelligence Render backend for GPT-backed dataset analysis.

Current behavior:

- CSV and JSON files are parsed in the browser.
- Dataset profiling is performed client-side.
- Uploading a dataset does not generate charts automatically.
- The user asks a visualization question in natural language after the local profile is ready.
- The browser sends the question, column profiles, and representative sample rows to `POST /analyze/clinical-data-visualization`.
- The backend calls OpenAI using `OPENAI_VISUALIZATION_MODEL`, defaulting to `gpt-5.5`.
- GPT returns one chart plan with the X/Y variables, optional grouping, aggregation, time grain, and cumulative setting required to answer the question.
- The browser applies the plan to the full uploaded dataset; GPT does not calculate values from the sample rows.
- The requested chart is rendered in React with Recharts. Cumulative time questions support day, week, month, quarter, and year groupings.
- Export controls download JSON/CSV artifacts from the browser.

Required backend environment variables:

```text
OPENAI_API_KEY=<set securely in Render>
OPENAI_VISUALIZATION_MODEL=gpt-5.5
```

If the OpenAI project does not have access to `gpt-5.5`, change only `OPENAI_VISUALIZATION_MODEL` to an enabled model and redeploy the backend.

## Privacy and Use

The assistant is designed for exploratory use only. Users should not upload protected health information, patient-identifying data, or regulated production datasets. Outputs require qualified human review before clinical, regulatory, diagnostic, safety, or operational decisions.

## Future Backend Extension

If persistent project storage is needed later, add a database-backed service layer. Keep the route and navigation in the existing Granulariti website shell so the product continues to share the main branding, header, footer, and responsive layout.
