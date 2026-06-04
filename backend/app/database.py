from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    from app.config import config
    DATABASE_URL = config.DATABASE_URL
    pool_size = getattr(config, "DATABASE_POOL_SIZE", 5)
    max_overflow = getattr(config, "DATABASE_MAX_OVERFLOW", 10)
    debug = getattr(config, "DEBUG", False)
else:
    pool_size = 5
    max_overflow = 10
    debug = False

# Принудительно подставляем драйвер psycopg2, заменяя протокол
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Создаём engine с явным указанием драйвера
if "postgresql" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,
        echo=debug
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
