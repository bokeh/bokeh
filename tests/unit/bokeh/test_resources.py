# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import re

# External imports
import pytest
from packaging.version import Version

# Bokeh imports
import bokeh.resources as resources

VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)$")
ALL_VERSIONS = resources.get_all_sri_versions()
STANDARD_VERSIONS = sorted(version for version in ALL_VERSIONS if Version(version) >= Version("0.4.1"))
WEIRD_VERSIONS = sorted(ALL_VERSIONS - set(STANDARD_VERSIONS))


def test_public_resource_configuration() -> None:
    configured = resources.Resources(mode=resources.INLINE)

    assert configured.mode == "inline"
    assert configured.__class__.__module__ == "bokeh.resources"
    assert resources.CDN == "cdn"
    assert resources.INLINE == "inline"


def test_get_all_sri_versions_valid_format() -> None:
    assert all(VERSION_PAT.match(version) for version in resources.get_all_sri_versions())


@pytest.mark.parametrize("version", STANDARD_VERSIONS)
def test_get_sri_hashes_for_standard_versions(version: str) -> None:
    hashes = resources.get_sri_hashes_for_version(version)
    assert f"bokeh-{version}.js" in hashes
    assert f"bokeh-{version}.min.js" in hashes
    if Version(version) >= Version("1"):
        assert f"bokeh-widgets-{version}.js" in hashes
        assert f"bokeh-widgets-{version}.min.js" in hashes


@pytest.mark.parametrize("version", WEIRD_VERSIONS)
def test_get_sri_hashes_for_weird_versions(version: str) -> None:
    hashes = resources.get_sri_hashes_for_version(version)
    if Version(version) <= Version("0.2.0"):
        return
    version = version.rstrip(".0")
    assert f"bokeh-{version}.js" in hashes
    assert f"bokeh-{version}.min.js" in hashes


def test_get_sri_hashes_for_version_rejects_unknown_version() -> None:
    with pytest.raises(ValueError):
        resources.get_sri_hashes_for_version("junk")


def test_session_coordinates_normalizes_default_url() -> None:
    coordinates = resources.SessionCoordinates(url="default", session_id="session")
    assert coordinates.url == resources.DEFAULT_SERVER_HTTP_URL.rstrip("/")
    assert coordinates.session_id == "session"


def test_session_coordinates_rejects_websocket_url() -> None:
    with pytest.raises(ValueError, match="http or https"):
        resources.SessionCoordinates(url="ws://example.test")


def test_session_coordinates_lazily_generates_session_id() -> None:
    coordinates = resources.SessionCoordinates()
    assert coordinates.session_id_allowing_none is None
    assert coordinates.session_id
    assert coordinates.session_id_allowing_none == coordinates.session_id
