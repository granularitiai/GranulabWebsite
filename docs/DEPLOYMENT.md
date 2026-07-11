# Granulariti Deployment

## Frontend

The React/Vite frontend is deployed on Vercel:

```text
https://granularitiwebsite.vercel.app
```

After the backends are deployed, set these Vercel environment variables:

```text
VITE_LABLOOP_API_BASE_URL=https://granulariti-labloop-api.onrender.com
VITE_PROTOCOL_API_BASE_URL=https://your-clinical-trial-api.onrender.com
```

Redeploy the Vercel frontend after changing environment variables.

Current frontend product routes:

```text
/products/clinical-trial-intelligence-assistant
/products/labloop
/products/clinical-data-visualization
```

The Clinical Data Visualization Assistant is deployed with the Vercel frontend as a native React route. It parses CSV/JSON files in the browser, sends column profiles and capped sample rows to the Protocol Intelligence backend, and renders GPT-selected chart specs with Recharts.

## LabLoop Backend on Render

This repo includes a Render Blueprint at `render.yaml`.

Service:

```text
granulariti-labloop-api
```

Runtime settings:

```text
Root directory: backend/labloop
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health check path: /api/health
```

Required Render environment variables:

```text
GSA_API_KEY=<set in Render dashboard>
OPENAI_API_KEY=<set in Render dashboard>
OPENAI_MODEL=gpt-4o-mini
LABLOOP_DB_PATH=/tmp/labloop.db
CORS_ORIGINS=https://granularitiwebsite.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

`GSA_API_KEY` and `OPENAI_API_KEY` are marked `sync: false` in `render.yaml`, so Render should prompt you to set them securely in the dashboard.

Current note: the Blueprint uses Render's free web service plan and stores SQLite at `/tmp/labloop.db`. That is acceptable for a prototype because LabLoop can re-sync GSA listings, but `/tmp` is not durable production storage. Move LabLoop to Postgres before relying on saved user needs or long-lived listing state.

## Protocol and Visualization Intelligence Backend

This repo includes the Protocol Intelligence backend in:

```text
backend/protocol-intelligence
```

Service:

```text
granulariti-protocol-intelligence-api
```

Runtime settings:

```text
Root directory: backend/protocol-intelligence
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health check path: /health
```

Required Render environment variables:

```text
OPENAI_API_KEY=<set in Render dashboard>
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISUALIZATION_MODEL=gpt-5.5
OPENAI_TIMEOUT_SECONDS=180
CORS_ORIGINS=https://granularitiwebsite.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Endpoints served by this backend:

```text
GET /health
GET /diagnostics/openai
POST /analyze/protocol
POST /analyze/clinicaltrials-export
POST /analyze/clinical-data-visualization
POST /export/csv
```

Then set `VITE_PROTOCOL_API_BASE_URL` in Vercel to the Render URL for this service.

If the OpenAI project does not have access to `gpt-5.5`, set `OPENAI_VISUALIZATION_MODEL` to an enabled model in Render and redeploy the service.
