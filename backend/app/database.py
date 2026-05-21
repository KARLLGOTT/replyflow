from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Берём базу данных из переменной окружения (которую создал Render)
# Если переменной нет — используем старый config (на случай локальной разработки)
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # fallback для локальной разработки (чтобы код не сломался)
    from app.config import config
    DATABASE_URL = config.DATABASE_URL
    pool_size = getattr(config, "DATABASE_POOL_SIZE", 5)
    max_overflow = getattr(config, "DATABASE_MAX_OVERFLOW", 10)
    debug = getattr(config, "DEBUG", False)
else:
    # значения по умолчанию для Render
    pool_size = 5
    max_overflow = 10
    debug = False

# Создаём engine
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
