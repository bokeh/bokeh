# Standard library imports
from typing import TypedDict

Versions = TypedDict("Versions", {
  "version": str,
  "full-revisionid": str | None,
  "dirty": bool | None,
  "error": str | None,
  "date": str | None,
})

def get_versions() -> Versions: ...
