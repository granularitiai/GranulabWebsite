# LabLoop

LabLoop is a lightweight discovery platform for surplus scientific equipment listed through GSA Auctions. It helps startups, universities, research teams, and STEM programs find relevant lab equipment faster.

## Stack

- Frontend: integrated into the Granulariti React/Vite site at `/products/labloop`
- Backend: FastAPI
- Database: SQLite
- External data: GSA Auctions API only
- Optional enrichment: OpenAI API, with rule-based fallback

## Environment

Required:

```text
GSA_API_KEY=
```

Optional:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
LABLOOP_DB_PATH=backend/labloop/labloop.db
```

## Run Backend

From the website root:

```powershell
.\.venv-cti\Scripts\python.exe -m pip install -r backend\labloop\requirements.txt
cd backend\labloop
..\..\.venv-cti\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8010
```

If you are in `backend/labloop`, the Python path is:

```powershell
..\..\.venv-cti\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8010
```

PowerShell example for a local session:

```powershell
$env:GSA_API_KEY = "your-key"
$env:OPENAI_API_KEY = "optional-openai-key"
..\..\.venv-cti\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8010
```

## Run Frontend

From the website root:

```powershell
npm.cmd run dev -- --port 5173
```

Open:

```text
http://localhost:5173/products/labloop
```

## Sync GSA Auctions

Start the backend with `GSA_API_KEY` set, then call:

```text
GET http://127.0.0.1:8010/api/ingest/gsa-auctions
```

The response includes retrieved listings, scientific listings found, added, updated, duplicates skipped, timestamps, and errors.

For UI testing without live GSA data:

```text
POST http://127.0.0.1:8010/api/dev/seed
```

## AI Categorization

If `OPENAI_API_KEY` is present, LabLoop asks OpenAI to classify and enrich GSA listings. It does not claim equipment is verified, clean, calibrated, functional, safe, or suitable unless explicitly stated in the listing.

If `OPENAI_API_KEY` is missing or the request fails, LabLoop uses rule-based categorization from scientific equipment keywords.

## Limitations

LabLoop does not sell equipment, verify equipment, process payments, manage shipping, verify ownership, check calibration, check contamination, provide warranties, or bid on behalf of users.

External auction listings are provided for discovery only. LabLoop does not own, verify, certify, transport, or guarantee this equipment. Users must verify condition, ownership, calibration status, bidding rules, pickup terms, safety requirements, and source terms directly with GSA Auctions.
