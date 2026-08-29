from __future__ import annotations

# Standard library imports
from pathlib import Path
from typing import Any

# External imports
import pytest

# Bokeh imports
# Bokeh test imports
from tests.tools.release._support import RecordingSystem
from tools.release import publishing
from tools.release.config import Config
from tools.release.enums import ActionResult


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


def make_bokehjs_bundles(root: Path) -> None:
    directory = root / "bokehjs" / "build" / "js"
    directory.mkdir(parents=True)
    for name in ("bokeh", "bokeh-gl", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax"):
        for suffix in ("js", "min.js", "esm.js", "esm.min.js"):
            (directory / f"{name}.{suffix}").write_text(f"// {name}.{suffix}\n")


@pytest.mark.parametrize(
    ("version", "subdir"),
    [("4.0.0", "release"), ("4.0.0rc1", "dev"), ("4.0.0.dev1", "dev")],
)
def test_publish_bokehjs_to_cdn_uploads_every_bundle(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    version: str,
    subdir: str,
) -> None:
    make_bokehjs_bundles(tmp_path)
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(publishing, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))

    class Client:
        def __init__(self, **kw: Any) -> None:
            self.kw = kw
            self.objects: list[dict[str, Any]] = []

        def put_object(self, **kw: Any) -> None:
            self.objects.append(kw)

    clients: list[Client] = []

    def client(service: str, **kw: Any) -> Client:
        assert service == "s3"
        result = Client(**kw)
        clients.append(result)
        return result

    monkeypatch.setattr(publishing.boto3, "client", client)
    config = Config(version)

    result = publishing.publish_bokehjs_to_cdn(config, RecordingSystem())

    assert result.kind is ActionResult.PASS
    assert len(clients) == 1
    assert clients[0].kw == {"region_name": "test-region"}
    assert len(clients[0].objects) == 24
    assert {item["ContentType"] for item in clients[0].objects} == {"application/javascript"}
    assert {item["CacheControl"] for item in clients[0].objects} == {"max-age=31536000"}
    assert all(item["Key"].startswith(f"bokeh/{subdir}/") for item in clients[0].objects)
    assert all(f"-{version}." in item["Key"] for item in clients[0].objects)


def test_publish_bokehjs_to_cdn_returns_failure_for_missing_bundle(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(publishing, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))

    class Client:
        def put_object(self, **kw: Any) -> None:
            pytest.fail("put_object should not be reached")

    monkeypatch.setattr(publishing.boto3, "client", lambda *args, **kw: Client())
    config = Config("4.0.0")

    result = publishing.publish_bokehjs_to_cdn(config, RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert "No such file" in result.message
