# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import re
from pathlib import Path
from typing import Any

# External imports
import pytest
from packaging.version import Version

# Bokeh imports
import bokeh.resources as resources
from bokeh.embed.resources import ResourceRequirements
from bokeh.settings import PrioritizedSetting

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


def test_cdn_version_defaults_to_payload_version(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
) -> None:
    monkeypatch.delenv("BOKEH_CDN_VERSION", raising=False)

    resolved = resources.Resources(mode=resources.CDN).resolve(
        ResourceRequirements(("bokeh/core", "bokeh/widgets")), bokeh_version="4.0.1+local",
    )

    assert [asset.url for asset in resolved.assets] == [
        "https://cdn.bokeh.org/bokeh/release/bokeh-4.0.1.min.js",
        "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-4.0.1.min.js",
    ]
    assert resolved.bokeh_version == "4.0.1+local"
    assert resolved.policy.override_version is None


def test_cdn_version_environment_override(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
) -> None:
    monkeypatch.setenv("BOKEH_CDN_VERSION", "3.8.0+local")

    resolved = resources.Resources(mode=resources.CDN).resolve(
        ResourceRequirements(("bokeh/core", "bokeh/widgets")), bokeh_version="4.0.1+local",
    )

    assert [asset.url for asset in resolved.assets] == [
        "https://cdn.bokeh.org/bokeh/release/bokeh-3.8.0.min.js",
        "https://cdn.bokeh.org/bokeh/release/bokeh-widgets-3.8.0.min.js",
    ]
    assert resolved.bokeh_version == "4.0.1+local"
    assert resolved.policy.override_version == "3.8.0+local"


def test_cdn_version_programmatic_override_takes_precedence(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
) -> None:
    cdn_version_setting.set_value("4.0.0rc1+local")
    monkeypatch.setenv("BOKEH_CDN_VERSION", "3.8.0")

    resolved = resources.Resources(mode=resources.CDN, minified=False).resolve(
        ResourceRequirements(), bokeh_version="4.0.1",
    )

    assert resolved.assets[0].url == "https://cdn.bokeh.org/bokeh/dev/bokeh-4.0.0rc1.js"


def test_cdn_version_override_is_captured_by_resource_policy(
    cdn_version_setting: PrioritizedSetting[str | None],
) -> None:
    cdn_version_setting.set_value("4.0.0")
    policy = resources.Resources(mode=resources.CDN)

    cdn_version_setting.set_value("4.0.1")
    resolved = policy.resolve(ResourceRequirements(), bokeh_version="4.0.2")

    assert policy.override_version == "4.0.0"
    assert policy.to_dict()["override_version"] == "4.0.0"
    assert resolved.assets[0].url == "https://cdn.bokeh.org/bokeh/release/bokeh-4.0.0.min.js"
    assert resolved.policy is policy
    assert resources.Resources(mode=resources.CDN).override_version == "4.0.1"


def test_explicit_resource_override_version_takes_precedence_over_setting(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(resources.settings.cdn_version, "_user_value", "3.8.0")

    policy = resources.Resources(mode=resources.CDN, override_version="4.0.0")
    resolved = policy.resolve(ResourceRequirements(), bokeh_version="4.0.1")

    assert policy.override_version == "4.0.0"
    assert resolved.assets[0].url == "https://cdn.bokeh.org/bokeh/release/bokeh-4.0.0.min.js"
    assert resolved.bokeh_version == "4.0.1"


@pytest.mark.parametrize("version", ["", 1, False, "4.0.0rc"])
def test_resource_override_version_rejects_invalid_values(version: Any) -> None:
    with pytest.raises(resources.ResourceConflictError, match="invalid Bokeh resource override version"):
        resources.Resources(override_version=version)


def test_resource_override_version_is_preserved() -> None:
    policy = resources.Resources(override_version="4.0.0rc1+local")

    assert policy.override_version == "4.0.0rc1+local"
    assert policy.to_dict()["override_version"] == "4.0.0rc1+local"


@pytest.mark.parametrize("mode", ["none", "inline", "offline", "server", "relative", "absolute"])
def test_cdn_version_does_not_affect_other_resource_modes(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
    tmp_path: Path, mode: resources.ResourcesMode,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("BOKEH_CDN_VERSION", raising=False)
    (tmp_path / "js").mkdir()
    (tmp_path / "js" / "bokeh.min.js").write_text("globalThis.Bokeh = {}")
    policy = resources.Resources(mode=mode, base_dir=tmp_path)
    requirements = ResourceRequirements()
    expected = policy.resolve(requirements, bokeh_version="4.0.1")

    monkeypatch.setenv("BOKEH_CDN_VERSION", "3.8.0")

    assert policy.resolve(requirements, bokeh_version="4.0.1") == expected
    assert resources.Resources(mode=mode, base_dir=tmp_path).override_version is None
    assert "override_version" not in policy.to_dict()


def test_cdn_version_override_selects_matching_integrity_hash(
    monkeypatch: pytest.MonkeyPatch, cdn_version_setting: PrioritizedSetting[str | None],
) -> None:
    monkeypatch.setenv("BOKEH_CDN_VERSION", "3.8.0+local")

    resolved = resources.Resources(mode=resources.CDN, integrity=True).resolve(
        ResourceRequirements(), bokeh_version="4.0.1",
    )

    [asset] = resolved.assets
    assert asset.url == "https://cdn.bokeh.org/bokeh/release/bokeh-3.8.0.min.js"
    assert asset.integrity == f"sha384-{resources.get_sri_hashes_for_version('3.8.0')['bokeh-3.8.0.min.js']}"


@pytest.mark.parametrize(("setting", "mode"), [
    ("server-dev", "server"),
    ("relative-dev", "relative"),
    ("absolute-dev", "absolute"),
])
def test_build_accepts_dev_resource_settings(setting: resources.ResourcesSetting, mode: resources.ResourcesMode) -> None:
    configured = resources.Resources.build(setting)

    assert configured.mode == mode
    assert configured.minified is False


@pytest.mark.parametrize("setting", [
    "none-dev",
    "inline-dev",
    "offline-dev",
    "cdn-dev",
    "unknown-dev",
])
def test_build_rejects_unknown_dev_resource_settings(setting: str) -> None:
    with pytest.raises(resources.ResourceConflictError, match="unknown resource mode"):
        resources.Resources.build(setting)


def test_inline_resource_cache_is_invalidated_by_file_changes(tmp_path: Path) -> None:
    path = tmp_path / "resource.js"
    path.write_text("first")
    resources._cached_inline_resource.cache_clear()

    first = resources._inline_resource(path)
    assert first == "/* BEGIN resource.js */\nfirst\n/* END resource.js */"
    assert resources._inline_resource(path) == first

    path.write_text("second version")

    assert resources._inline_resource(path) == "/* BEGIN resource.js */\nsecond version\n/* END resource.js */"


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
