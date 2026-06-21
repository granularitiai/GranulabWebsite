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

## Clinical Trial Intelligence Backend

That backend currently lives outside this website repo:

```text
C:\Users\camer\Documents\Granulariti_proj\clinical_trial_doc_up\clinical-trial-protocol-intelligence\backend
```

Deploy it as a separate Render web service with:

```text
Build command: pip install -r requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health check path: use the backend's existing health endpoint, if available
```

Then set `VITE_PROTOCOL_API_BASE_URL` in Vercel to the Render URL for that service.
