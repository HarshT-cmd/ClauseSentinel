import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup in-memory isolated test database
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Import app modules
from app.database import Base, get_db
from app.main import app

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db

# Ensure unit tests run completely offline against local scikit-learn models
from app.services.gemini_service import gemini_service
gemini_service.is_available = lambda: False

@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create fresh tables for each test and drop them afterwards to prevent contamination."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

# 1. Health check test
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["message"] == "Clause Sentinel backend is running"

# 2. Valid complaint submission (uncertain region example from specification)
def test_valid_complaint_submission_uncertain_region(client):
    payload = {"text": "Amhala amchya gavath pani puravtha hot nahi"}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()
    
    assert data["complaint_id"] == 1
    assert data["original_text"] == "Amhala amchya gavath pani puravtha hot nahi"
    assert data["language"] == "mr-Latn"
    assert data["predicted_region"] == "Uncertain"
    assert data["predicted_category"] == "Water Supply"
    assert data["confidence"] == 0.0
    assert data["regional_clues"] == []
    assert data["routing_status"] == "needs_review"

# 3. Complaint with verifiable regional clues
def test_complaint_with_regional_evidence(client):
    payload = {"text": "Vidarbhat Nagpur jilhyat vijecha puravtha thap zala ahe transformer jala"}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["predicted_category"] == "Electricity"
    assert data["predicted_region"] == "Vidarbha"
    assert data["confidence"] >= 0.75
    assert len(data["regional_clues"]) >= 1
    assert data["routing_status"] == "auto_routed"

# 4. Empty and whitespace-only input validation
def test_empty_complaint_validation(client):
    # Empty string
    response = client.post("/api/predict", json={"text": ""})
    assert response.status_code == 422
    data = response.json()
    assert "details" in data

    # Whitespace only
    response_ws = client.post("/api/predict", json={"text": "    "})
    assert response_ws.status_code == 422

# 5. Invalid complaint ID
def test_invalid_complaint_id(client):
    response = client.get("/api/complaints/999999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "999999 not found" in data["detail"]

# 6. Listing and filtering complaints
def test_list_and_filter_complaints(client):
    # Seed two complaints
    client.post("/api/predict", json={"text": "Amhala amchya gavath pani puravtha hot nahi"})
    client.post("/api/predict", json={"text": "Vidarbhat rastyavr khup mothe khadde padlet apghat hotat"})

    # List all
    all_resp = client.get("/api/complaints")
    assert all_resp.status_code == 200
    all_data = all_resp.json()
    assert len(all_data) == 2

    # Filter by region
    vidarbha_resp = client.get("/api/complaints?region=Vidarbha")
    assert vidarbha_resp.status_code == 200
    assert len(vidarbha_resp.json()) == 1
    assert vidarbha_resp.json()[0]["predicted_region"] == "Vidarbha"

    # Filter by category
    water_resp = client.get("/api/complaints?category=Water Supply")
    assert water_resp.status_code == 200
    assert len(water_resp.json()) == 1
    assert water_resp.json()[0]["predicted_category"] == "Water Supply"

    # Filter by status
    review_resp = client.get("/api/complaints?status=needs_review")
    assert review_resp.status_code == 200
    assert len(review_resp.json()) == 1

# 7. Human review and correction workflow
def test_human_correction_workflow(client):
    # Submit complaint
    create_resp = client.post("/api/predict", json={"text": "Gavath gutter overflow hot ahe"})
    assert create_resp.status_code == 201
    complaint_id = create_resp.json()["complaint_id"]

    # Review and correct region to Pune
    review_payload = {
        "corrected_region": "Pune",
        "review_status": "reviewed",
        "reviewer_notes": "Verified by ground inspector via ward report"
    }
    patch_resp = client.patch(f"/api/complaints/{complaint_id}/review", json=review_payload)
    assert patch_resp.status_code == 200
    updated = patch_resp.json()

    # Verify original prediction is preserved separate from human correction
    assert updated["predicted_region"] == "Uncertain"
    assert updated["corrected_region"] == "Pune"
    assert updated["review_status"] == "reviewed"
    assert updated["routing_status"] == "reviewed"
    assert updated["reviewer_notes"] == "Verified by ground inspector via ward report"
    assert updated["reviewed_at"] is not None

# 8. Dashboard statistics
def test_dashboard_statistics(client):
    # Submit 3 complaints
    client.post("/api/predict", json={"text": "Amhala amchya gavath pani puravtha hot nahi"}) # Water, Uncertain
    client.post("/api/predict", json={"text": "Vidarbhat rastyavr khadde ahet"}) # Roads, Vidarbha
    c3 = client.post("/api/predict", json={"text": "Light transformer blast zala"}) # Electricity, Uncertain
    c3_id = c3.json()["complaint_id"]

    # Mark c3 as reviewed
    client.patch(f"/api/complaints/{c3_id}/review", json={"corrected_region": "Latur", "review_status": "reviewed"})

    stats_resp = client.get("/api/dashboard/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()

    assert stats["total_complaints"] == 3
    assert stats["complaints_by_predicted_region"]["Uncertain"] == 2
    assert stats["complaints_by_predicted_region"]["Vidarbha"] == 1
    assert stats["complaints_by_category"]["Water Supply"] == 1
    assert stats["complaints_by_category"]["Roads"] == 1
    assert stats["complaints_by_category"]["Electricity"] == 1
    assert stats["complaints_needing_review"] == 1 # c1 needs review, c3 was reviewed, c2 was auto_routed
    assert stats["reviewed_complaints"] == 1

# 9. Code-mixed grassroots complaint handling
def test_code_mixed_input(client):
    payload = {"text": "Hospital madhe doctor nahit emergency ambulance help please"}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["predicted_category"] == "Healthcare"
    assert data["language"] in ("code-mixed", "mr-Latn", "en")
    assert data["predicted_region"] == "Uncertain"
    assert data["routing_status"] == "needs_review"
