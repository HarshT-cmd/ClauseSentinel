import json
import logging
from typing import Optional, Dict, Any, List
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """
    Integration with Google Gemini API for deep semantic reasoning,
    multilingual/code-mixed parsing, and dialect analysis of grassroots complaints.
    
    Acts as an enhanced AI layer with automatic graceful fallback to the
    local scikit-learn & rule-based pipeline when offline or if the API key is absent.
    """

    SYSTEM_INSTRUCTION = (
        "You are Clause Sentinel's expert NLP engine specializing in analyzing "
        "grassroots citizen grievances in Maharashtra and neighboring Indian regions. "
        "You understand Devanagari script, Romanized/transliterated Marathi and Hindi, "
        "regional dialects (Varhadi, Ahirani, Malvani), English, and code-mixed grassroots text.\n\n"
        "Analyze the citizen complaint and return a strictly formatted JSON object with:\n"
        "1. 'language': One of ['mr-Deva', 'mr-Latn', 'hi-Deva', 'hi-Latn', 'en', 'code-mixed', 'unknown'].\n"
        "2. 'predicted_category': Exactly one of ['Water Supply', 'Roads', 'Electricity', 'Sanitation', 'Healthcare', 'Education', 'Other'].\n"
        "3. 'predicted_region': CRITICAL ETHICAL RULE: A grievance topic (e.g. water, electricity, roads) is NOT proof of geographic origin. "
        "Only output a region if there are verifiable dialectal markers (Varhadi -> Vidarbha, Ahirani -> Khandesh, Malvani -> Konkan) "
        "or explicit administrative district/division mentions. If evidence is absent, output 'Uncertain'.\n"
        "Allowed regions: ['Vidarbha', 'Marathwada', 'Konkan', 'Western Maharashtra', 'Khandesh', 'North Maharashtra', 'Uncertain'].\n"
        "4. 'regional_clues': Array of specific evidence strings found in the text explaining why a region was identified. Empty array if Uncertain.\n"
        "5. 'confidence': Calibrated confidence score (float 0.0 to 1.0). If region is 'Uncertain', confidence MUST be 0.0.\n"
        "6. 'routing_status': 'needs_review' if region is 'Uncertain' or confidence < 0.65; else 'auto_routed'.\n"
    )

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

    def is_available(self) -> bool:
        """Checks if a Gemini API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    def analyze_complaint(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Submits complaint to Gemini generateContent endpoint.
        Returns parsed prediction dictionary or None on error/fallback.
        """
        if not self.is_available():
            return None

        # Clean API key in case of accidental surrounding quotes or spaces
        clean_key = self.api_key.strip().strip("'\"")
        
        # Try configured model, fallback to gemini-3.8-flash if needed
        model_name = self.model or "gemini-3.8-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"

        prompt = f"Complaint text: \"\"\"{text}\"\"\"\n\nProvide the JSON analysis."

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{self.SYSTEM_INSTRUCTION}\n\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        try:
            # 10s timeout allows deep semantic reasoning without stalling requests
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=payload
                )

                if response.status_code != 200:
                    logger.warning(
                        f"Gemini API returned status {response.status_code}: {response.text[:200]}. "
                        "Falling back to local NLP baseline."
                    )
                    return None

                res_json = response.json()
                candidates = res_json.get("candidates", [])
                if not candidates:
                    return None

                raw_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = json.loads(raw_content)

                # Validate and sanitize response fields
                category = parsed.get("predicted_category", "Other")
                if category not in settings.CATEGORIES:
                    category = "Other"

                region = parsed.get("predicted_region", "Uncertain")
                if region not in settings.RECOGNIZED_REGIONS:
                    region = "Uncertain"

                clues = parsed.get("regional_clues", [])
                if not isinstance(clues, list):
                    clues = []

                confidence = float(parsed.get("confidence", 0.0))
                if region == "Uncertain":
                    confidence = 0.0

                routing_status = parsed.get("routing_status", "needs_review")
                if region == "Uncertain" or confidence < settings.CONFIDENCE_THRESHOLD:
                    routing_status = "needs_review"

                return {
                    "language": parsed.get("language", "unknown"),
                    "predicted_region": region,
                    "predicted_category": category,
                    "confidence": round(confidence, 2),
                    "regional_clues": clues,
                    "routing_status": routing_status,
                    "engine": "gemini"
                }

        except Exception as e:
            logger.warning(f"Error calling Gemini API: {str(e)}. Falling back to local NLP baseline.")
            return None

gemini_service = GeminiService()
