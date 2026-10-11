from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Health check schema
class HealthResponse(BaseModel):
    status: str = "ok"
    message: str = "Clause Sentinel backend is running"

# Complaint Prediction Request
class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        description="Grassroots citizen complaint text (multilingual, code-mixed, or regional dialect)"
    )

    @field_validator("text")
    def validate_text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Complaint text must not be empty or whitespace only.")
        return v.strip()

# Complaint Prediction Response (exact contract specified in requirements)
class PredictResponse(BaseModel):
    complaint_id: int
    original_text: str
    language: str
    predicted_region: str
    predicted_category: str
    confidence: float
    regional_clues: List[str] = Field(default_factory=list)
    routing_status: str

# Full Complaint Response for Detail and Listing endpoints
class ComplaintDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_text: str
    detected_language: str
    predicted_region: str
    predicted_category: str
    confidence: float
    regional_clues: List[str]
    routing_status: str
    corrected_region: Optional[str] = None
    corrected_category: Optional[str] = None
    review_status: str
    reviewer_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

# Review / Correction Request Schema
class ReviewRequest(BaseModel):
    corrected_region: Optional[str] = Field(None, description="Human-corrected regional origin")
    corrected_category: Optional[str] = Field(None, description="Human-corrected complaint category")
    review_status: str = Field(default="reviewed", description="Status e.g. reviewed, rejected, pending")
    reviewer_notes: Optional[str] = Field(None, description="Reviewer justification or notes")

    @field_validator("review_status")
    def validate_status(cls, v: str) -> str:
        valid_statuses = {"reviewed", "rejected", "pending", "needs_review"}
        if v.lower() not in valid_statuses:
            raise ValueError(f"Invalid review_status. Allowed values: {', '.join(valid_statuses)}")
        return v.lower()

# Dashboard Statistics Schema
class DashboardStatsResponse(BaseModel):
    total_complaints: int
    complaints_by_predicted_region: Dict[str, int]
    complaints_by_category: Dict[str, int]
    complaints_needing_review: int
    reviewed_complaints: int
