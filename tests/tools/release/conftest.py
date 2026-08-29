from __future__ import annotations

# Standard library imports
import sys
from types import ModuleType

# External imports
import pytest

# The developer test environment doesn't necessarily include the release-only
# boto3 dependency. Individual tests replace client() before exercising it.
try:
    import boto3
except ImportError:
    boto3 = ModuleType("boto3")
    setattr(boto3, "client", None)
    sys.modules["boto3"] = boto3

# Bokeh imports
from tools.release.config import Config


@pytest.fixture
def config() -> Config:
    return Config("4.0.0")
