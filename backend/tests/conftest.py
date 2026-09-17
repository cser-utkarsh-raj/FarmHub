import pytest
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.seed.seed_data import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)
