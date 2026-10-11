import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_text = Column(Text, nullable=False)
    detected_language = Column(String(32), nullable=False, default="unknown")
    predicted_region = Column(String(64), nullable=False, default="Uncertain")
    predicted_category = Column(String(64), nullable=False, default="Other")
    confidence = Column(Float, nullable=False, default=0.0)
    
    # Store clues as JSON string for maximum compatibility across SQLite versions
    _regional_clues = Column("regional_clues", Text, nullable=False, default="[]")
    
    routing_status = Column(String(32), nullable=False, default="needs_review")
    
    # Human review / verification fields (kept separate from model predictions)
    corrected_region = Column(String(64), nullable=True)
    corrected_category = Column(String(64), nullable=True)
    review_status = Column(String(32), nullable=False, default="unreviewed")
    reviewer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    @property
    def regional_clues(self) -> list:
        if not self._regional_clues:
            return []
        try:
            return json.loads(self._regional_clues)
        except Exception:
            return []

    @regional_clues.setter
    def regional_clues(self, clues: list):
        if clues is None:
            clues = []
        self._regional_clues = json.dumps(clues, ensure_ascii=False)
