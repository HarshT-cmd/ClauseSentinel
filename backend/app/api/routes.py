from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    HealthResponse,
    PredictRequest,
    PredictResponse,
    ComplaintDetailResponse,
    ReviewRequest,
    DashboardStatsResponse
)
from app.services.complaint_service import complaint_service

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["Health"]
)
def get_health():
    """Check backend operational health."""
    return HealthResponse(
        status="ok",
        message="Clause Sentinel backend is running"
    )

@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze Citizen Complaint",
    tags=["Prediction"]
)
def predict_complaint(
    request: PredictRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts raw grassroots citizen complaint text, detects language/script,
    predicts civic complaint category via scikit-learn ML pipeline,
    estimates regional origin only when reliable dialect/geography clues exist,
    and returns review routing status.
    """
    complaint = complaint_service.create_and_predict(request, db)
    return PredictResponse(
        complaint_id=complaint.id,
        original_text=complaint.original_text,
        language=complaint.detected_language,
        predicted_region=complaint.predicted_region,
        predicted_category=complaint.predicted_category,
        confidence=complaint.confidence,
        regional_clues=complaint.regional_clues,
        routing_status=complaint.routing_status
    )

@router.get(
    "/complaints",
    response_model=List[ComplaintDetailResponse],
    summary="List Stored Complaints",
    tags=["Complaints"]
)
def list_complaints(
    region: Optional[str] = Query(None, description="Filter by predicted or corrected region"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by routing_status or review_status"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset"),
    db: Session = Depends(get_db)
):
    """
    Retrieve stored complaints with optional filtering by region,
    category, and review/routing status.
    """
    complaints = complaint_service.get_complaints(
        db=db,
        region=region,
        category=category,
        status_filter=status,
        limit=limit,
        offset=offset
    )
    return complaints

@router.get(
    "/complaints/{complaint_id}",
    response_model=ComplaintDetailResponse,
    summary="Get Complaint by ID",
    tags=["Complaints"]
)
def get_complaint(
    complaint_id: int = Path(..., ge=1, description="Unique complaint ID"),
    db: Session = Depends(get_db)
):
    """Retrieve full details of a specific complaint by ID."""
    return complaint_service.get_complaint_by_id(complaint_id, db)

@router.patch(
    "/complaints/{complaint_id}/review",
    response_model=ComplaintDetailResponse,
    summary="Review / Correct Complaint Prediction",
    tags=["Complaints"]
)
def review_complaint(
    complaint_id: int = Path(..., ge=1, description="Unique complaint ID"),
    review_data: ReviewRequest = ...,
    db: Session = Depends(get_db)
):
    """
    Allow human reviewer to verify/correct the predicted region or category,
    marking the complaint as reviewed and maintaining model-human separation.
    """
    return complaint_service.review_complaint(complaint_id, review_data, db)

@router.get(
    "/dashboard/stats",
    response_model=DashboardStatsResponse,
    summary="Get Dashboard Statistics",
    tags=["Dashboard"]
)
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """
    Calculates live dashboard statistics directly from stored database records:
    total complaints, complaints by region, complaints by category,
    and complaints requiring review.
    """
    return complaint_service.get_dashboard_stats(db)
