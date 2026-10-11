from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models import Complaint
from app.schemas import PredictRequest, ReviewRequest
from app.services.language_detector import language_detector
from app.services.classifier import complaint_classifier
from app.services.regional_detector import regional_detector
from app.config import settings

from app.services.gemini_service import gemini_service

class ComplaintService:
    @staticmethod
    def create_and_predict(request: PredictRequest, db: Session) -> Complaint:
        text = request.text.strip()
        if not text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Complaint text cannot be empty."
            )

        # 1. Attempt Gemini AI enhanced analysis if API key is provided
        gemini_result = None
        if gemini_service.is_available():
            gemini_result = gemini_service.analyze_complaint(text)

        if gemini_result:
            language = gemini_result["language"]
            category = gemini_result["predicted_category"]
            region = gemini_result["predicted_region"]
            confidence = gemini_result["confidence"]
            clues = gemini_result["regional_clues"]
            routing_status = gemini_result["routing_status"]
        else:
            # 2. Local fallback pipeline: rule + scikit-learn ML classifier
            language, _ = language_detector.detect_language(text)
            category, cat_confidence = complaint_classifier.predict_category(text)
            region, reg_confidence, clues = regional_detector.detect_region(text)

            if region == "Uncertain":
                confidence = 0.0
                routing_status = "needs_review"
            else:
                confidence = reg_confidence
                if confidence >= settings.CONFIDENCE_THRESHOLD:
                    routing_status = "auto_routed"
                else:
                    routing_status = "needs_review"


        # 4. Persist to database
        complaint = Complaint(
            original_text=text,
            detected_language=language,
            predicted_region=region,
            predicted_category=category,
            confidence=confidence,
            regional_clues=clues,
            routing_status=routing_status,
            review_status="unreviewed"
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return complaint

    @staticmethod
    def get_complaints(
        db: Session,
        region: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Complaint]:
        query = db.query(Complaint)

        if region:
            region_clean = region.strip()
            # Match either predicted_region or human-corrected_region
            query = query.filter(
                (Complaint.predicted_region.ilike(f"%{region_clean}%")) |
                (Complaint.corrected_region.ilike(f"%{region_clean}%"))
            )

        if category:
            cat_clean = category.strip()
            query = query.filter(
                (Complaint.predicted_category.ilike(f"%{cat_clean}%")) |
                (Complaint.corrected_category.ilike(f"%{cat_clean}%"))
            )

        if status_filter:
            st_clean = status_filter.strip().lower()
            query = query.filter(
                (Complaint.routing_status.ilike(st_clean)) |
                (Complaint.review_status.ilike(st_clean))
            )

        return query.order_by(Complaint.id.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_complaint_by_id(complaint_id: int, db: Session) -> Complaint:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Complaint with ID {complaint_id} not found."
            )
        return complaint

    @staticmethod
    def review_complaint(complaint_id: int, review_data: ReviewRequest, db: Session) -> Complaint:
        complaint = ComplaintService.get_complaint_by_id(complaint_id, db)

        # Update human verification fields separately from model predictions
        if review_data.corrected_region is not None:
            complaint.corrected_region = review_data.corrected_region.strip()

        if review_data.corrected_category is not None:
            complaint.corrected_category = review_data.corrected_category.strip()

        if review_data.reviewer_notes is not None:
            complaint.reviewer_notes = review_data.reviewer_notes.strip()

        complaint.review_status = review_data.review_status
        if review_data.review_status == "reviewed":
            complaint.routing_status = "reviewed"

        complaint.reviewed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(complaint)
        return complaint

    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict:
        total_complaints = db.query(func.count(Complaint.id)).scalar() or 0

        # Complaints by predicted region
        region_counts_raw = (
            db.query(Complaint.predicted_region, func.count(Complaint.id))
            .group_by(Complaint.predicted_region)
            .all()
        )
        complaints_by_region = {region: count for region, count in region_counts_raw}

        # Complaints by category
        cat_counts_raw = (
            db.query(Complaint.predicted_category, func.count(Complaint.id))
            .group_by(Complaint.predicted_category)
            .all()
        )
        complaints_by_category = {cat: count for cat, count in cat_counts_raw}

        # Complaints needing review (routing_status == 'needs_review' and not yet reviewed)
        needing_review = (
            db.query(func.count(Complaint.id))
            .filter(
                (Complaint.routing_status == "needs_review") &
                (Complaint.review_status != "reviewed")
            )
            .scalar() or 0
        )

        # Reviewed complaints
        reviewed_count = (
            db.query(func.count(Complaint.id))
            .filter(Complaint.review_status == "reviewed")
            .scalar() or 0
        )

        return {
            "total_complaints": total_complaints,
            "complaints_by_predicted_region": complaints_by_region,
            "complaints_by_category": complaints_by_category,
            "complaints_needing_review": needing_review,
            "reviewed_complaints": reviewed_count
        }

complaint_service = ComplaintService()
