from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import config
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:pass@localhost/dbname")

if "postgresql" in config.DATABASE_URL:
    engine = create_engine(
        config.DATABASE_URL,
        pool_size=config.DATABASE_POOL_SIZE,
        max_overflow=config.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=config.DEBUG
    )
else:
    engine = create_engine(
        config.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
