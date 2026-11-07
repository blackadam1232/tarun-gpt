import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' package is always found
DIR = Path(__file__).resolve().parent
if str(DIR) not in sys.path:
    sys.path.insert(0, str(DIR))

from app.main import app  # noqa: F401

handler = app


