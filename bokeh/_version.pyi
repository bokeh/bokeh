# Standard library imports
from typing import TypedDict

class Versions(TypedDict):
    version: str
    dirty: bool | None
    error: str | None
    date: str | None

def get_versions() -> Versions: ...
