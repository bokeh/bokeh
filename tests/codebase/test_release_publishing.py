from __future__ import annotations

# Standard library imports
from typing import Any
from xml.etree.ElementTree import ParseError

# External imports
import pytest
from release import publishing
from release.config import Config
from release.enums import ActionResult

# Bokeh imports
# Bokeh test imports
from tests.codebase._release_support import RecordingSystem


def test_publish_documentation_delegates_metadata_policy(monkeypatch: pytest.MonkeyPatch, config: Config) -> None:
    system = RecordingSystem()
    calls = []
    monkeypatch.setattr(publishing, "publish_docs", lambda *args: calls.append(args))
    assert publishing.publish_documentation(config, system).kind is ActionResult.PASS
    assert calls == [(config, system)]


def test_publish_documentation_reports_preflight_failure(monkeypatch: pytest.MonkeyPatch, config: Config) -> None:
    def fail(*args: Any) -> None:
        raise RuntimeError("Published switcher is invalid")
    monkeypatch.setattr(publishing, "publish_docs", fail)
    result = publishing.publish_documentation(config, RecordingSystem())
    assert result.kind is ActionResult.FAIL
    assert result.details is not None
    assert "Published switcher is invalid" in result.details


@pytest.mark.parametrize(
    ("version", "subdir"),
    [("4.0.0", "release"), ("4.0.0rc1", "dev"), ("4.0.0.dev1", "dev")],
)
def test_publish_bokehjs_to_cdn_uploads_every_bundle(
    monkeypatch: pytest.MonkeyPatch,
    version: str,
    subdir: str,
) -> None:
    monkeypatch.setattr(publishing, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))
    system = RecordingSystem()
    config = Config(version)

    result = publishing.publish_bokehjs_to_cdn(config, system)

    assert result.kind is ActionResult.PASS
    assert len(system.commands) == 24
    assert all(command.startswith("aws s3 cp bokehjs/build/js/") for command in system.commands)
    assert all(f"s3://test-bucket/bokeh/{subdir}/" in command for command in system.commands)
    assert all(f"-{version}." in command for command in system.commands)
    assert all("--content-type application/javascript" in command for command in system.commands)
    assert all("--cache-control max-age=31536000" in command for command in system.commands)
    assert all(command.endswith("--region test-region") for command in system.commands)


def test_publish_bokehjs_to_cdn_returns_failure_for_missing_bundle(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(publishing, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))
    command = (
        "aws s3 cp bokehjs/build/js/bokeh.js s3://test-bucket/bokeh/release/bokeh-4.0.0.js "
        "--content-type application/javascript --cache-control max-age=31536000 --region test-region"
    )
    system = RecordingSystem(failures={command: ("The user-provided path does not exist",)})
    config = Config("4.0.0")

    result = publishing.publish_bokehjs_to_cdn(config, system)

    assert result.kind is ActionResult.FAIL
    assert "The user-provided path does not exist" in result.message


@pytest.mark.parametrize("error", [ParseError("Malformed sitemap"), KeyError("ETag")])
def test_publish_documentation_reports_invalid_metadata(monkeypatch: pytest.MonkeyPatch, config: Config, error: Exception) -> None:
    def fail(*args: Any) -> None:
        raise error
    monkeypatch.setattr(publishing, "publish_docs", fail)
    result = publishing.publish_documentation(config, RecordingSystem())
    assert result.kind is ActionResult.FAIL
    assert result.details == error.args
