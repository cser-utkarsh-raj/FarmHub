from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.engine import Engine
from backend.app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True
)

# Enable foreign keys and WAL mode for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema_compatibility():
    """Apply the small additive schema change needed by synthetic-row isolation.

    Existing rows are conservatively marked synthetic when the column is first
    introduced because their provenance is unknown. Verified ingestion explicitly
    writes is_synthetic=False.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    if "mandi_records" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("mandi_records")}
    if "is_synthetic" in columns:
        return

    if engine.dialect.name == "postgresql":
        ddl = (
            "ALTER TABLE mandi_records "
            "ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT TRUE"
        )
    else:
        ddl = (
            "ALTER TABLE mandi_records "
            "ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT 1"
        )

    with engine.begin() as connection:
        connection.execute(text(ddl))
