from datetime import datetime

from pydantic import BaseModel


class PhotoBase(BaseModel):
    id: int
    original_filename: str
    url: str
    created_at: datetime
    album: str | None = None

    class Config:
        orm_mode = True
