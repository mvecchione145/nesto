import uuid
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select

from config import ORIGINALS_DIR, init_dirs
from database import Base, engine, get_db
from models import Photo as PhotoModel
from schemas import PhotoBase
from fastapi import Response

# --- init dirs & DB ---
init_dirs()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nesto Backend")

# CORS for dev: React on http://localhost:5173
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # when served by nginx in docker-compose we map to host:8080
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve original images as static files
app.mount(
    "/media/originals",
    StaticFiles(directory=str(ORIGINALS_DIR)),
    name="originals",
)


def to_photo_schema(photo: PhotoModel) -> PhotoBase:
    url = f"/media/originals/{photo.stored_filename}"
    return PhotoBase(
        id=photo.id,
        original_filename=photo.original_filename,
        url=url,
        created_at=photo.created_at,
        album=photo.album,
    )


@app.get("/api/photos", response_model=List[PhotoBase])
def list_photos(
    db: Session = Depends(get_db),
    album: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    stmt = select(PhotoModel).order_by(PhotoModel.created_at.desc()).offset(skip).limit(limit)
    if album:
        stmt = stmt.where(PhotoModel.album == album)
    photos = db.execute(stmt).scalars().all()
    return [to_photo_schema(p) for p in photos]


@app.get("/api/albums", response_model=List[str])
def get_albums(db: Session = Depends(get_db)):
    """Return a list of distinct, non-empty album names (alphabetically ordered)."""
    rows = (
        db.query(PhotoModel.album)
        .filter(PhotoModel.album.isnot(None), PhotoModel.album != "")
        .distinct()
        .order_by(PhotoModel.album)
        .all()
    )
    # rows is a list of single-item tuples like [("vacation",), ("work",)]
    return [r[0] for r in rows]


@app.post("/api/photos", response_model=PhotoBase)
async def upload_photo(
    file: UploadFile = File(...),
    album: str | None = Form(None),
    db: Session = Depends(get_db),
):
    # generate a unique filename to avoid collisions
    ext = Path(file.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    target_path = ORIGINALS_DIR / stored_name

    content = await file.read()
    size_bytes = len(content)
    target_path.write_bytes(content)

    photo = PhotoModel(
        stored_filename=stored_name,
        original_filename=file.filename,
        content_type=file.content_type,
        size_bytes=size_bytes,
        album=album,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return to_photo_schema(photo)


@app.get("/api/photos/{photo_id}", response_model=PhotoBase)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    # use Session.get for a single-instance lookup
    photo = db.get(PhotoModel, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return to_photo_schema(photo)


# Optional: direct download by id (if you want /api/photos/{id}/download)
@app.get("/api/photos/{photo_id}/download")
def download_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.get(PhotoModel, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    file_path = ORIGINALS_DIR / photo.stored_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(
        path=str(file_path),
        media_type=photo.content_type or "application/octet-stream",
        filename=photo.original_filename,
    )


@app.delete("/api/photos/{photo_id}", status_code=204)
def delete_photo(photo_id: int, db: Session = Depends(get_db)):
    """Delete a photo record and its file from disk."""
    photo = db.get(PhotoModel, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = ORIGINALS_DIR / photo.stored_filename

    # delete DB record first
    db.delete(photo)
    db.commit()

    # then remove file if present; ignore errors
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass

    return Response(status_code=204)
