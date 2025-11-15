from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DB_URL

# SQLite needs a special connect_args to allow check_same_thread=False. For Postgres
# and other DBs this is not required — create the engine accordingly.
if DB_URL.startswith("sqlite"):
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DB_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    from fastapi import Depends

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
