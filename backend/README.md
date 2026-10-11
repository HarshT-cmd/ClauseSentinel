# Clause Sentinel — Backend Service

Clause Sentinel is an AI and NLP-assisted backend system designed to analyze unstructured grassroots citizen grievances in multilingual and code-mixed formats (Marathi, Hindi, English, transliterated Roman script, and regional dialects). It categorizes complaints by civic service area and estimates regional origin through verifiable dialectal and administrative cues with a transparent human-in-the-loop review workflow.

---

## 1. Architecture & Technology Stack

- **Python 3.11+ / 3.14**: Modern Python core runtime.
- **FastAPI**: High-performance asynchronous REST API framework with automatic OpenAPI/Swagger documentation.
- **Uvicorn**: ASGI web server.
- **Pydantic (v2)**: Strict type validation, sanitization, and request/response serialization.
- **SQLite & SQLAlchemy**: Lightweight persistent SQL storage with automatic table creation on startup.
- **scikit-learn**: Baseline ML classification pipeline (`TfidfVectorizer` + `LogisticRegression`) with calibrated probabilities (`predict_proba`).
- **CORS Middleware**: Pre-configured cross-origin resource sharing for frontend integration (Vite, Next.js, React).

---

## 2. Directory Structure

```text
ClauseSentinel/
├── .gitignore
├── README.md
└── backend/
    ├── .env.example
    ├── requirements.txt
    ├── README.md
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                     # FastAPI app, CORS, lifespan startup & error handlers
    │   ├── config.py                   # Configuration & environment variable settings
    │   ├── database.py                 # SQLAlchemy engine, session maker, get_db dependency
    │   ├── models.py                   # SQLAlchemy ORM models (Complaint)
    │   ├── schemas.py                  # Pydantic validation and serialization models
    │   ├── api/
    │   │   ├── __init__.py
    │   │   └── routes.py               # REST API endpoints (/api/health, /predict, /complaints, etc.)
    │   └── services/
    │       ├── __init__.py
    │       ├── classifier.py           # scikit-learn ML pipeline for civic categories & text normalization
    │       ├── language_detector.py    # Devanagari vs Latin script & language identification (mr, hi, en)
    │       ├── regional_detector.py    # Evidence-based regional detector with Uncertain fallback
    │       └── complaint_service.py    # Orchestration service for persistence, reviews, and stats
    └── tests/
        ├── __init__.py
        └── test_api.py                 # Isolated pytest test suite (in-memory SQLite)
```

---

## 3. Quickstart & Execution (Windows PowerShell)

Run the following commands from the project root:

```powershell
# 1. Create Python virtual environment
python -m venv .venv

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Run the FastAPI development server
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The server will be accessible at:
- **API Base URL**: `http://127.0.0.1:8000/api`
- **Swagger Interactive Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 4. Frontend Integration Contract

### Base API URL
```
http://127.0.0.1:8000/api
```

### Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & service readiness |
| `POST` | `/api/predict` | Analyze complaint text, detect language, predict category/region, and store |
| `GET` | `/api/complaints` | Retrieve stored complaints (with region, category, status filters) |
| `GET` | `/api/complaints/{id}` | Retrieve specific complaint by ID |
| `PATCH` | `/api/complaints/{id}/review` | Human review & correction of region/category predictions |
| `GET` | `/api/dashboard/stats` | Live aggregated statistics for frontend dashboards |

---

### Request & Response Examples

#### 1. Health Check
- **Request**: `GET /api/health`
- **Response** (`200 OK`):
```json
{
  "status": "ok",
  "message": "Clause Sentinel backend is running"
}
```

#### 2. Analyze Complaint
- **Request**: `POST /api/predict`
```json
{
  "text": "Amhala amchya gavath pani puravtha hot nahi"
}
```
- **Response** (`201 Created`):
```json
{
  "complaint_id": 1,
  "original_text": "Amhala amchya gavath pani puravtha hot nahi",
  "language": "mr-Latn",
  "predicted_region": "Uncertain",
  "predicted_category": "Water Supply",
  "confidence": 0.0,
  "regional_clues": [],
  "routing_status": "needs_review"
}
```

*Example with verified regional evidence:*
- **Request**: `POST /api/predict`
```json
{
  "text": "Vidarbhat Nagpur jilhyat vijecha puravtha thap zala ahe"
}
```
- **Response** (`201 Created`):
```json
{
  "complaint_id": 2,
  "original_text": "Vidarbhat Nagpur jilhyat vijecha puravtha thap zala ahe",
  "language": "mr-Latn",
  "predicted_region": "Vidarbha",
  "predicted_category": "Electricity",
  "confidence": 0.85,
  "regional_clues": [
    "Regional division mention: Vidarbha",
    "Administrative district cue: Vidarbha region"
  ],
  "routing_status": "auto_routed"
}
```

#### 3. List & Filter Complaints
- **Request**: `GET /api/complaints?region=Vidarbha&category=Electricity&limit=20`
- **Response** (`200 OK`):
```json
[
  {
    "id": 2,
    "original_text": "Vidarbhat Nagpur jilhyat vijecha puravtha thap zala ahe",
    "detected_language": "mr-Latn",
    "predicted_region": "Vidarbha",
    "predicted_category": "Electricity",
    "confidence": 0.85,
    "regional_clues": [
      "Regional division mention: Vidarbha",
      "Administrative district cue: Vidarbha region"
    ],
    "routing_status": "auto_routed",
    "corrected_region": null,
    "corrected_category": null,
    "review_status": "unreviewed",
    "reviewer_notes": null,
    "created_at": "2026-10-11T13:00:00Z",
    "reviewed_at": null
  }
]
```

#### 4. Review & Correct Prediction
- **Request**: `PATCH /api/complaints/1/review`
```json
{
  "corrected_region": "Pune",
  "review_status": "reviewed",
  "reviewer_notes": "Verified by regional officer via ward water logs"
}
```
- **Response** (`200 OK`):
```json
{
  "id": 1,
  "original_text": "Amhala amchya gavath pani puravtha hot nahi",
  "detected_language": "mr-Latn",
  "predicted_region": "Uncertain",
  "predicted_category": "Water Supply",
  "confidence": 0.0,
  "regional_clues": [],
  "routing_status": "reviewed",
  "corrected_region": "Pune",
  "corrected_category": null,
  "review_status": "reviewed",
  "reviewer_notes": "Verified by regional officer via ward water logs",
  "created_at": "2026-10-11T12:55:00Z",
  "reviewed_at": "2026-10-11T13:02:00Z"
}
```

#### 5. Dashboard Statistics
- **Request**: `GET /api/dashboard/stats`
- **Response** (`200 OK`):
```json
{
  "total_complaints": 2,
  "complaints_by_predicted_region": {
    "Uncertain": 1,
    "Vidarbha": 1
  },
  "complaints_by_category": {
    "Water Supply": 1,
    "Electricity": 1
  },
  "complaints_needing_review": 0,
  "reviewed_complaints": 1
}
```

---

## 5. NLP & Machine Learning Architecture

### A. Civic Category Classification
- **Model**: `scikit-learn` Pipeline with `TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)` and `LogisticRegression(class_weight="balanced")`.
- **Training Coverage**: Trained on a multilingual dataset spanning English, Devanagari Marathi (`mr-Deva`), Devanagari Hindi (`hi-Deva`), Transliterated Roman Marathi (`mr-Latn`), Transliterated Roman Hindi (`hi-Latn`), and Code-mixed grassroots formats.
- **Inference & Calibration**: Real inference producing posterior probability distributions via `predict_proba()`.
- **Categories Supported**: `Water Supply`, `Roads`, `Electricity`, `Sanitation`, `Healthcare`, `Education`, `Other`.

### B. Ethical Regional Origin Estimation & Human-in-the-Loop Routing
- **Ethical Safeguard**: Grievance topics (water, roads, power) are common statewide and **cannot** be used to infer an author's regional or community origin without spurious hallucination.
- **Evidence-Based Clues**: Origin is only estimated when genuine administrative district cues or verified dialectal markers (e.g., Varhadi/Vidarbha, Ahirani/Khandesh, Malvani/Konkan, Marathwada, Western Maharashtra) are present.
- **Uncertain Fallback**: In the absence of conclusive linguistic or administrative evidence, the model assigns `predicted_region: "Uncertain"` and `confidence: 0.0`, routing the complaint into `needs_review` status for human verification.
- **Model-Human Separation**: Original model predictions (`predicted_region`, `predicted_category`) are permanently retained and kept separate from human verified fields (`corrected_region`, `corrected_category`).

### C. Language & Script Detection
- Analyzes Unicode ranges for Devanagari script (`[\u0900-\u097F]`), identifying Marathi vs Hindi via specific grammatical and lexical morphemes (`ळ`, `आहे`, `नाही` vs `है`, `नहीं`).
- Analyzes Romanized vernacular text (`mr-Latn`, `hi-Latn`, `en`, `code-mixed`) using token frequency distributions.

---

## 6. Running Tests

The test suite runs against an isolated in-memory SQLite database (`sqlite:///:memory:`) using dependency overrides, ensuring test runs never contaminate demo or production database records:

```powershell
# Run from repository root
$env:PYTHONPATH="backend"
.\.venv\Scripts\pytest backend/tests/ -v
```
