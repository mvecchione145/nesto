from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import ORIGINALS_DIR, THUMBNAILS_DIR, init_dirs
from database import Base, engine
from routes.photos import router as photos_router

# --- init dirs & DB ---
init_dirs()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nesto Backend")

# CORS for dev: React on http://localhost:5173
origins = ["*"]
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

# Serve thumbnails as well
app.mount(
    "/media/thumbnails",
    StaticFiles(directory=str(THUMBNAILS_DIR)),
    name="thumbnails",
)

app.include_router(photos_router)
