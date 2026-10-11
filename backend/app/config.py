import os
from typing import List

# Automatically load .env from backend/ or project root
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except ImportError:
    # Lightweight fallback parser if python-dotenv is not installed yet
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k.strip() not in os.environ:
                        os.environ[k.strip()] = v.strip()

class Settings:

    PROJECT_NAME: str = "Clause Sentinel API"
    PROJECT_DESCRIPTION: str = (
        "Backend service for categorizing unstructured grassroots citizen communications "
        "by regional origin, language, and civic service category."
    )
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Server settings
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./clause_sentinel.db")

    # CORS settings
    # Default includes typical Vite (5173), Next.js / React (3000, 3001), and wildcard for hackathon dev
    _raw_cors = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:8080"
    )
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]

    # Confidence Threshold for Auto-routing vs Manual Review
    # Below this threshold or if regional origin is Uncertain, routing_status is set to 'needs_review'
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))

    # Google Gemini API Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # Valid Civic Categories
    CATEGORIES: List[str] = [
        "Water Supply",
        "Roads",
        "Electricity",
        "Sanitation",
        "Healthcare",
        "Education",
        "Other"
    ]

    # Recognized Regional Geographies (for Maharashtra grassroots context)
    RECOGNIZED_REGIONS: List[str] = [
        "Vidarbha",
        "Marathwada",
        "Konkan",
        "Western Maharashtra",
        "Khandesh",
        "North Maharashtra",
        "Uncertain"
    ]

# Try loading .env file if it exists
try:
    from dotenv import load_dotenv
    # Look for .env in current directory or backend directory
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except ImportError:
    pass

settings = Settings()

