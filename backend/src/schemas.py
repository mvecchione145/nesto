from datetime import datetime

from pydantic import BaseModel


class PhotoBase(BaseModel):
    id: int
    original_filename: str
    url: str
    thumbnail_url: str | None = None
    created_at: datetime
    album: str | None = None

    class Config:
        orm_mode = True
