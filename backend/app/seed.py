"""
Seed script to populate Clause Sentinel database with realistic grassroots complaints
across multiple regions, categories, languages, and review states for demonstration.
Run via:
    python -m app.seed
"""

from app.database import SessionLocal, init_db
from app.models import Complaint
from app.services.complaint_service import complaint_service
from app.schemas import PredictRequest, ReviewRequest

DEMO_COMPLAINTS = [
    # 1. Water Supply - Romanized Marathi (Uncertain origin)
    "Amhala amchya gavath pani puravtha hot nahi 4 divas zale tanker pathva",
    # 2. Roads - Vidarbha / Nagpur (Verifiable regional origin)
    "Vidarbhat Nagpur road var khup mothe khadde padlet apghat hot ahet",
    # 3. Electricity - Devanagari Marathi (Uncertain origin)
    "गावात वीज पुरवठा खंडित झाला असून ट्रान्सफॉर्मर जळाला आहे वीज वितरण लक्ष देत नाही",
    # 4. Sanitation - Khandesh / Ahirani dialect (Verifiable regional origin)
    "Khandesh madhe Ahirani belt ma nali saaf nahi gandagi vadhli ahe",
    # 5. Healthcare - Code-mixed (Uncertain origin)
    "Hospital madhe doctor nahit primary health center closed emergency patient issue",
    # 6. Education - Devanagari Hindi (Uncertain origin)
    "गाँव के प्राथमिक विद्यालय की छत टपक रही है और शिक्षक नहीं आते",
    # 7. Roads - Marathwada / Dharashiv (Verifiable regional origin)
    "Marathwada Dharashiv rastyachi durnavastha zali ahe damarikaran kara",
    # 8. Electricity - Romanized Hindi (Uncertain origin)
    "Humare gaon me 3 din se bijli nahi aa rahi transformer blast ho gaya",
    # 9. Water Supply - Konkan (Verifiable regional origin)
    "Konkan Ratnagiri coastal area madhe pinaychya panyachi pipe line footli",
    # 10. Sanitation - English (Uncertain origin)
    "Garbage has not been collected for a week causing foul smell near market"
]

def seed_demo_data():
    init_db()
    db = SessionLocal()
    try:
        existing_count = db.query(Complaint).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} records. Skipping seed.")
            return

        print("Seeding database with demo grassroots complaints...")
        created_complaints = []
        for text in DEMO_COMPLAINTS:
            complaint = complaint_service.create_and_predict(PredictRequest(text=text), db)
            created_complaints.append(complaint)
            print(f"Created Complaint ID {complaint.id}: [{complaint.predicted_category}] - Region: {complaint.predicted_region} - Lang: {complaint.detected_language}")

        # Review two complaints for dashboard demonstration
        if len(created_complaints) >= 3:
            # Review Complaint 1: Human confirms Pune
            complaint_service.review_complaint(
                created_complaints[0].id,
                ReviewRequest(
                    corrected_region="Pune",
                    review_status="reviewed",
                    reviewer_notes="Verified by ground officer through water department log"
                ),
                db
            )
            # Review Complaint 5: Human confirms Nashik
            complaint_service.review_complaint(
                created_complaints[4].id,
                ReviewRequest(
                    corrected_region="Nashik",
                    review_status="reviewed",
                    reviewer_notes="Verified by PHC district health supervisor"
                ),
                db
            )
            print("Successfully reviewed 2 complaints for human-in-the-loop demonstration.")

        print(f"Successfully seeded {len(created_complaints)} demo complaints.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
