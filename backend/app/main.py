from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import init_db
from app.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite database tables exist
    init_db()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS Middleware
# Allows frontend development servers (Vite 5173, Next.js 3000, etc.) to communicate seamlessly
origins = settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=False if "*" in origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api
app.include_router(router, prefix=settings.API_PREFIX)

def get_landing_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clause Sentinel API — Backend Service</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 36px;
      max-width: 640px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #064e3b;
      color: #34d399;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    h1 { margin: 0 0 10px; font-size: 26px; color: #38bdf8; }
    p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; font-size: 15px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #334155;
      color: #f1f5f9;
      text-decoration: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn:hover { background: #0284c7; color: white; transform: translateY(-1px); }
    .btn.primary { background: #0ea5e9; color: white; }
    .btn.primary:hover { background: #0284c7; }
    .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; pt: 16px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● Backend Service Online</div>
    <h1>Clause Sentinel API</h1>
    <p>AI & NLP service for grassroots multilingual grievance routing and dialect verification across Maharashtra and regional administrative desks.</p>
    
    <div class="grid">
      <a class="btn primary" href="http://localhost:5173" target="_blank">
        <span>🚀 Open Frontend Application</span> <span>→</span>
      </a>
      <a class="btn" href="/docs">
        <span>📖 Interactive API Docs (Swagger)</span> <span>→</span>
      </a>
      <a class="btn" href="/redoc">
        <span>📑 ReDoc Documentation</span> <span>→</span>
      </a>
      <a class="btn" href="/api/health">
        <span>💓 Health Check Endpoint</span> <span>→</span>
      </a>
      <a class="btn" href="/api/complaints">
        <span>📋 Complaints Database</span> <span>→</span>
      </a>
      <a class="btn" href="/api/dashboard/stats">
        <span>📊 Aggregated Statistics</span> <span>→</span>
      </a>
    </div>

    <div class="footer">
      Clause Sentinel v1.0.0 • Connected to FastAPI & Google Gemini Engine
    </div>
  </div>
</body>
</html>"""

@app.get("/", tags=["Root"])
def root(request: Request):
    """Root entry point providing service landing page or JSON metadata."""
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(content=get_landing_html())
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": f"{settings.API_PREFIX}/health",
        "frontend_url": "http://localhost:5173"
    }

@app.get("/api", tags=["Root"])
def api_root(request: Request):
    """API entry point redirecting browser requests or providing endpoints list."""
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(content=get_landing_html())
    return {
        "endpoints": {
            "health": f"{settings.API_PREFIX}/health",
            "predict": f"{settings.API_PREFIX}/predict",
            "complaints": f"{settings.API_PREFIX}/complaints",
            "dashboard_stats": f"{settings.API_PREFIX}/dashboard/stats",
            "docs": "/docs"
        }
    }

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Clean, human-readable validation error messages for the frontend."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Validation error")
        errors.append(f"{field}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Unprocessable Entity",
            "message": "Invalid request payload.",
            "details": errors
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
