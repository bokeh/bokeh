from __future__ import annotations

# Standard library imports
from pathlib import Path

# External imports
import pytest
from release import remote
from release.config import Config
from release.enums import ActionResult

# Bokeh imports
# Bokeh test imports
from tests.unit.release._support import RecordingSystem


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (
            remote.download_deployment_tarball,
            "aws s3 cp s3://bokeh-deployments/deployment-4.0.0.tgz . --region us-east-1",
        ),
        (
            remote.upload_deployment_tarball,
            "aws s3 cp deployment-4.0.0.tgz s3://bokeh-deployments/ --region us-east-1",
        ),
    ],
)
def test_remote_tarball_transfers(config, func, command):
    system = RecordingSystem()

    result = func(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [command]


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (
            remote.download_deployment_tarball,
            "aws s3 cp s3://bokeh-deployments/deployment-4.0.0.tgz . --region us-east-1",
        ),
        (
            remote.upload_deployment_tarball,
            "aws s3 cp deployment-4.0.0.tgz s3://bokeh-deployments/ --region us-east-1",
        ),
    ],
)
def test_remote_tarball_transfer_failures(config, func, command):
    system = RecordingSystem(failures={command: ("transfer failed",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("transfer failed",)


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
def test_publish_bokehjs_to_cdn_uploads_every_bundle(tmp_path, monkeypatch, version, subdir):
    make_bokehjs_bundles(tmp_path)
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(remote, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))
    clients = []

    class Client:
        def __init__(self, **kw):
            self.kw = kw
            self.objects = []

        def put_object(self, **kw):
            self.objects.append(kw)

    def client(service, **kw):
        assert service == "s3"
        result = Client(**kw)
        clients.append(result)
        return result

    monkeypatch.setattr(remote.boto3, "client", client)
    config = Config(version)
    config.add_secret("AWS_ACCESS_KEY_ID", "access")
    config.add_secret("AWS_SECRET_ACCESS_KEY", "secret")

    result = remote.publish_bokehjs_to_cdn(config, RecordingSystem())

    assert result.kind is ActionResult.PASS
    assert len(clients) == 1
    assert clients[0].kw == {
        "region_name": "test-region",
        "aws_access_key_id": "access",
        "aws_secret_access_key": "secret",
    }
    assert len(clients[0].objects) == 24
    assert {item["ContentType"] for item in clients[0].objects} == {"application/javascript"}
    assert {item["CacheControl"] for item in clients[0].objects} == {"max-age=31536000"}
    assert all(item["Key"].startswith(f"bokeh/{subdir}/") for item in clients[0].objects)
    assert all(f"-{version}." in item["Key"] for item in clients[0].objects)


def test_publish_bokehjs_to_cdn_returns_failure_for_missing_bundle(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(remote, "BOKEHJS_BUCKETS", (("test-bucket", "test-region"),))

    class Client:
        def put_object(self, **kw):
            pytest.fail("put_object should not be reached")

    monkeypatch.setattr(remote.boto3, "client", lambda *args, **kw: Client())
    config = Config("4.0.0")
    config.add_secret("AWS_ACCESS_KEY_ID", "access")
    config.add_secret("AWS_SECRET_ACCESS_KEY", "secret")

    result = remote.publish_bokehjs_to_cdn(config, RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert "No such file" in result.message
