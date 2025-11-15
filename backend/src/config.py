import os
from pathlib import Path

BASE_DIR = Path(os.getenv("BASE_DIR", Path(__file__).resolve().parent.as_posix()))

# Prefer an environment-provided DATABASE_URL for Postgres in production/development.
# Example: export DATABASE_URL="postgresql://user:password@localhost:5432/nesto_db"
# If DATABASE_URL is not set, default to a local Postgres URL. Change credentials as needed.
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/nesto_db",
)

MEDIA_ROOT = BASE_DIR / "media"
ORIGINALS_DIR = MEDIA_ROOT / "originals"


# make sure dirs exist at startup (we'll call this early)
def init_dirs():
    MEDIA_ROOT.mkdir(exist_ok=True)
    ORIGINALS_DIR.mkdir(exist_ok=True)
