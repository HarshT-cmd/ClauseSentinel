# ⚖️ Clause Sentinel
### AI-Powered Regional Origin Detection for Grassroots Communications

Clause Sentinel is an AI-assisted platform designed to analyze unstructured citizen grievances and help organizations categorize, organize, and route submissions to the appropriate regional authorities.

It addresses a major challenge faced by civic platforms and NGOs: identifying useful information from large volumes of complaints written in regional languages, informal dialects, transliterated text, and mixed vocabularies.

## 🚨 Problem Statement

National civic platforms and NGOs collect millions of citizen grievances, feedback reports, and survey responses. These messages often lack geographic and demographic metadata, making it difficult to identify their origin and route them to the correct local office.

Clause Sentinel aims to analyze the written content of these submissions, identify complaint categories and potential regional clues, and help human reviewers organize and route them efficiently.

## 💡 Our Solution

Clause Sentinel combines a web-based dashboard with a Python backend and AI-assisted text analysis to help users:

- Submit citizen complaints for analysis.
- Categorize grievances into meaningful service categories.
- Analyze language variations, informal typing, and regional vocabulary.
- Estimate regional origin when sufficient evidence is available.
- Store and retrieve complaints for further review.
- Track complaint categories and review status through dashboard statistics.
- Allow human reviewers to correct predictions and improve data quality.

**Important:** Predicted geographic origin is an estimate, not verified identity. When evidence is insufficient, the system should mark the origin as uncertain and request human review.

## ✨ Key Features

- **Complaint Analysis:** Analyze unstructured citizen submissions.
- **AI Integration:** Use Google's Gemini API for AI-assisted text analysis when configured.
- **Regional Clue Detection:** Examine linguistic and vocabulary clues that may help identify possible regional origin.
- **Complaint Categorization:** Group complaints into categories such as water supply, roads, electricity, sanitation, healthcare, and education.
- **Complaint Management:** Store, retrieve, filter, and review complaint records.
- **Human-in-the-Loop Review:** Support manual corrections and verification of AI-generated predictions.
- **Dashboard Statistics:** Summarize complaint volumes, categories, regions, and pending reviews.
- **REST API:** Provide endpoints for communication between the frontend and backend.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Backend language | Python |
| API framework | FastAPI |
| ASGI server | Uvicorn |
| Data validation | Pydantic |
| Database | SQLite |
| Database access | SQLAlchemy, if used by the implementation |
| AI integration | Google Gemini API |
| NLP and classification | Python-based language detection and classification services |
| Frontend | See the frontend dependencies and source files in this repository |
| Version control | Git and GitHub |

## 🏗️ Architecture

```text
Citizen / Organization
         |
         v
Frontend Web Application
         |
         | HTTP / JSON
         v
FastAPI Backend
         |
         +--------------------+
         |                    |
         v                    v
  NLP / AI Services     Complaint Service
         |                    |
         v                    v
  Text Analysis         SQLite Database
         |                    |
         +---------+----------+
                   |
                   v
       Predictions and Statistics
                   |
                   v
          Frontend Dashboard
```

## 📁 Project Structure

```text
ClauseSentinel/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── services/
│   │   │   ├── classifier.py
│   │   │   ├── complaint_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── language_detector.py
│   │   │   └── regional_detector.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── tests/
│   │   └── test_api.py
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── .gitignore
└── README.md
```

The frontend files are maintained in the same repository. The exact structure may vary as development progresses.

## ⚙️ Prerequisites

Install the following before running the project:

- Python 3.11 or later
- Git
- Node.js and npm, if required by the frontend framework
- A Google Gemini API key for AI-powered analysis

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/HarshT-cmd/ClauseSentinel.git
cd ClauseSentinel
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a local `.env` file inside the `backend/` directory using `.env.example` as a reference.

Example:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Replace the example value with your own valid key if Gemini integration is enabled. Confirm that the selected model is available to your API key.

Never commit `.env` or expose API keys in frontend code.

### 5. Start the backend

Run this command from the `backend/` directory:

```bash
uvicorn app.main:app --reload
```

The API should be available at:

- API base URL: `http://127.0.0.1:8000`
- Interactive Swagger documentation: `http://127.0.0.1:8000/docs`
- ReDoc documentation: `http://127.0.0.1:8000/redoc`

These addresses assume the server is running locally with the default configuration.

### 6. Start the frontend

Open a separate terminal and navigate to the frontend directory containing its `package.json`.

Install dependencies:

```bash
npm install
```

Start the development server using the script defined in `package.json`, commonly:

```bash
npm run dev
```

Configure the frontend API base URL to point to the running backend. The exact environment variable name and command depend on the frontend framework and its existing implementation.

## 🔌 API Endpoints

The backend is designed to provide the following endpoints. Check the live Swagger documentation at `/docs` for the exact routes, request schemas, and supported query parameters.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| POST | `/api/predict` | Analyze a citizen complaint |
| GET | `/api/complaints` | Retrieve and filter complaints |
| GET | `/api/complaints/{complaint_id}` | Retrieve a complaint by ID |
| PATCH | `/api/complaints/{complaint_id}/review` | Submit a review or correction |
| GET | `/api/dashboard/stats` | Retrieve dashboard statistics |

### Example: Analyze a Complaint

**Request**

```http
POST /api/predict
Content-Type: application/json
```

```json
{
  "text": "Amhala amchya gavath pani puravtha hot nahi"
}
```

**Illustrative response**

```json
{
  "complaint_id": 1,
  "original_text": "Amhala amchya gavath pani puravtha hot nahi",
  "language": "unknown",
  "predicted_region": "Uncertain",
  "predicted_category": "Water Supply",
  "confidence": 0.0,
  "regional_clues": [],
  "routing_status": "needs_review"
}
```

The values above demonstrate the intended response shape only. Actual output depends on the backend implementation, AI response, and available evidence.

## 🧠 AI and Regional Detection

Clause Sentinel separates complaint categorization from regional-origin estimation.

The system may use language identification, vocabulary patterns, regional clues, and AI-assisted analysis to help estimate origin.

However:

- Language alone does not establish a person's geographic origin.
- Regional dialects can overlap across districts and communities.
- AI-generated confidence scores should not be treated as calibrated probabilities unless validated.
- Uncertain predictions should be referred for human review.
- Human-verified corrections should remain distinguishable from model predictions.

Reliable region-level classification requires representative, labeled data from the target communities and evaluation on held-out examples.

## 🧪 Testing

From the `backend/` directory, run:

```bash
python -m pytest
```

If pytest is installed and the project tests are configured, this executes the automated backend tests.

Recommended test scenarios include:

- Valid complaint submission
- Empty or invalid input
- Complaint retrieval and filtering
- Database persistence
- Dashboard statistics
- Human review and correction
- Invalid complaint IDs
- Gemini errors and missing API credentials
- Uncertain regional predictions

## 👥 Team Collaboration

The project uses Git and GitHub for collaborative development.

- `main` — combined, integrated application
- `backend` — backend APIs, NLP services, database logic, and AI integration
- `frontend` — frontend UI and dashboard

Typical workflow:

```bash
git switch backend
git pull --rebase origin backend

# Make and test your changes

git add <your-changed-files>
git commit -m "Describe your changes"
git pull --rebase origin backend
git push origin backend
```

Use `frontend` instead of `backend` when working on the frontend branch.

Merge and test the branches before treating the integrated application as ready for demonstration. Avoid editing the same files simultaneously, and resolve Git conflicts rather than overwriting teammates' work.

## 🔐 Security and Privacy

- Keep API keys in local environment variables.
- Never commit `.env` files or private credentials.
- Do not expose Gemini API keys in frontend JavaScript.
- Validate and sanitize user input.
- Avoid logging sensitive complaint contents unnecessarily.
- Restrict CORS to trusted frontend origins outside local development.
- Treat AI predictions as suggestions rather than verified facts.
- Review data retention and access requirements before storing real citizen grievances.

## 🎯 Expected Impact

Clause Sentinel aims to help civic organizations and NGOs process unstructured grassroots communications more efficiently, reduce manual categorization effort, and direct complaints toward appropriate local experts.

Its human-review workflow helps ensure that communities whose dialects or vocabulary are underrepresented in training data are not silently misclassified.

## 🔮 Future Improvements

- Expand labeled datasets covering regional dialects and transliterated languages.
- Evaluate regional-origin accuracy across different communities.
- Add batch processing for large complaint datasets.
- Improve multilingual and code-mixed text processing.
- Add reviewer feedback and model evaluation workflows.
- Introduce authentication, authorization, and audit logs.
- Deploy the frontend and backend to production hosting.

## 👨‍💻 Repository

GitHub: https://github.com/HarshT-cmd/ClauseSentinel

---

**Clause Sentinel — Giving every grassroots voice a clearer path to resolution.**
