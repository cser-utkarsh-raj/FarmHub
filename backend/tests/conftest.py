import pytest
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.seed.seed_data import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    settings.RATE_LIMIT_PER_MINUTE = 10_000
    settings.MANDI_INGESTION_KEY = "test-mandi-ingestion-key"
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        from datetime import date, timedelta
        from backend.app.models.market_price import MandiRecord
        base_date = date.today() - timedelta(days=40)
        for i in range(35):
            rec_date = base_date + timedelta(days=i)
            db.add(MandiRecord(
                commodity="Maize",
                variety="Yellow",
                market="Gulabbagh (Purnia)",
                district="Purnia",
                state="Bihar",
                min_price=2000.0 + i,
                max_price=2200.0 + i,
                modal_price=2100.0 + i,
                record_date=rec_date,
                is_synthetic=False
            ))
            db.add(MandiRecord(
                commodity="Wheat",
                variety="Dara",
                market="Patna (Gulzarbagh)",
                district="Patna",
                state="Bihar",
                min_price=2200.0 + i,
                max_price=2400.0 + i,
                modal_price=2300.0 + i,
                record_date=rec_date,
                is_synthetic=False
            ))
        db.commit()
    finally:
        db.close()
    yield
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)
