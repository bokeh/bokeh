from __future__ import annotations

import pytest

from tools.release.config import Config


@pytest.fixture
def config() -> Config:
    return Config("4.0.0")
