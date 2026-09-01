from __future__ import annotations

# External imports
import pytest
from release import publishing
from release.config import Config
from release.enums import ActionResult

# Bokeh imports
# Bokeh test imports
from tests.codebase._release_support import RecordingSystem


def test_publish_full_documentation_updates_version_latest_and_switcher(config: Config) -> None:
    system = RecordingSystem()

    result = publishing.publish_documentation(config, system)

    assert result.kind is ActionResult.PASS
    assert len(system.commands) == 4
    assert all("--acl" not in command for command in system.commands)
    assert "s3://docs.bokeh.org/en/4.0.0/" in system.commands[0]
    assert "s3://docs.bokeh.org/en/latest/" in system.commands[1]
    assert system.commands[2] == (
        "aws s3 cp deployment-4.0.0/docs/bokeh/switcher.json s3://docs.bokeh.org/ "
        "--only-show-errors "
        "--cache-control no-cache,max-age=0,must-revalidate --region us-east-1"
    )
    assert '"/en/latest*" "/en/4.0.0*" "/switcher.json"' in system.commands[3]


@pytest.mark.parametrize("version", ["4.0.0rc1", "4.0.0.dev1"])
def test_publish_prerelease_documentation_updates_dev_and_switcher(version: str) -> None:
    system = RecordingSystem()

    result = publishing.publish_documentation(Config(version), system)

    assert result.kind is ActionResult.PASS
    assert len(system.commands) == 3
    assert all("--acl" not in command for command in system.commands)
    assert "s3://docs.bokeh.org/en/dev-4.0/" in system.commands[0]
    assert system.commands[1] == (
        f"aws s3 cp deployment-{version}/docs/bokeh/switcher.json s3://docs.bokeh.org/ "
        "--only-show-errors "
        "--cache-control no-cache,max-age=0,must-revalidate --region us-east-1"
    )
    assert '"/en/dev-4.0*" "/switcher.json"' in system.commands[2]


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
