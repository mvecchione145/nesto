import io
import uuid
from pathlib import Path
from typing import List

from fastapi import Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from fastapi.routing import APIRouter
from PIL import Image, ImageOps
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import ORIGINALS_DIR, THUMBNAILS_DIR
from database import get_db
from models import Photo as PhotoModel
from schemas import PhotoBase

router = APIRouter()


def to_photo_schema(photo: PhotoModel) -> PhotoBase:
    url = f"/media/originals/{photo.stored_filename}"
    thumb = (
        f"/media/thumbnails/{photo.thumbnail_filename}"
        if getattr(photo, "thumbnail_filename", None)
        else None
    )
    return PhotoBase(
        id=photo.id,
        original_filename=photo.original_filename,
        url=url,
        thumbnail_url=thumb,
        created_at=photo.created_at,
        album=photo.album,
    )


@router.get("/api/photos", response_model=List[PhotoBase])
def list_photos(
    db: Session = Depends(get_db),
    album: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    stmt = (
        select(PhotoModel)
        .order_by(PhotoModel.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if album:
        stmt = stmt.where(PhotoModel.album == album)
    photos = db.execute(stmt).scalars().all()
    return [to_photo_schema(p) for p in photos]


@router.get("/api/albums", response_model=List[str])
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


@router.post("/api/photos", response_model=PhotoBase)
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

    # attempt to create a thumbnail (best-effort)
    thumb_name = None
    try:
        img = Image.open(io.BytesIO(content))
        # apply EXIF orientation (rotate/flip) when present so thumbnails match
        # the original image orientation
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            # if something goes wrong reading EXIF, proceed without transposing
            pass
        # ensure RGB mode for JPEG output
        img = img.convert("RGB")

        # create a thumbnail preserving aspect ratio
        max_size = (640, 480)
        img.thumbnail(max_size, Image.LANCZOS)

        # save as JPEG to thumbnails dir -- always use .jpg suffix
        base = Path(stored_name).stem
        thumb_name = f"thumb_{base}.jpg"
        thumb_path = THUMBNAILS_DIR / thumb_name

        # ensure thumbnails dir exists (defensive)
        thumb_path.parent.mkdir(parents=True, exist_ok=True)

        # write thumbnail as JPEG
        img.save(str(thumb_path), format="JPEG", quality=85)
    except Exception as e:
        # log full error to help debugging
        import traceback

        print("Error creating thumbnail:")
        traceback.print_exc()
        # not an image or processing failed; skip thumbnail
        thumb_name = None

    photo = PhotoModel(
        stored_filename=stored_name,
        original_filename=file.filename,
        content_type=file.content_type,
        size_bytes=size_bytes,
        album=album,
        thumbnail_filename=thumb_name,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return to_photo_schema(photo)


@router.get("/api/photos/{photo_id}", response_model=PhotoBase)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    # use Session.get for a single-instance lookup
    photo = db.get(PhotoModel, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return to_photo_schema(photo)


# Optional: direct download by id (if you want /api/photos/{id}/download)
@router.get("/api/photos/{photo_id}/download")
def download_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.get(PhotoModel, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    file_path = ORIGINALS_DIR / photo.stored_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(
        path=str(file_path),
        media_type=photo.content_type or "routerlication/octet-stream",
        filename=photo.original_filename,
    )


@router.delete("/api/photos/{photo_id}", status_code=204)
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

    # remove thumbnail too
    try:
        if photo.thumbnail_filename:
            t = THUMBNAILS_DIR / photo.thumbnail_filename
            if t.exists():
                t.unlink()
    except Exception:
        pass

    return Response(status_code=204)
