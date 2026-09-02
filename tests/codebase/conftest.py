from __future__ import annotations

# External imports
import pytest
from release.config import Config


@pytest.fixture
def config() -> Config:
    return Config("4.0.0")
