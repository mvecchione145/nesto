import datetime as dt

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    stored_filename = Column(String, unique=True, index=True)
    original_filename = Column(String)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.now(dt.timezone.utc))
    taken_at = Column(DateTime, nullable=True)  # later: fill from EXIF
    album = Column(String, nullable=True)  # simple string for now
    thumbnail_filename = Column(String, nullable=True)
