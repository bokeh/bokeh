from __future__ import annotations

# External imports
import pytest

# Bokeh imports
# Bokeh test imports
from tests.tools.release._support import RecordingSystem
from tools.release import deployment
from tools.release.config import Config
from tools.release.enums import ActionResult
from tools.release.pipeline import StepType


def test_pack_deployment_tarball_collects_all_artifacts(config: Config) -> None:
    system = RecordingSystem()

    result = deployment.pack_deployment_tarball(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "mkdir deployment-4.0.0",
        "cp bokehjs/bokeh-bokehjs-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-framework-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-angular-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-react-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-svelte-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-vue-4.0.0.tgz deployment-4.0.0",
        "cp bokehjs/bokeh-web-component-4.0.0.tgz deployment-4.0.0",
        "cp dist/conda/noarch/bokeh-4.0.0-py_0.tar.bz2 deployment-4.0.0",
        "cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0",
        "cp dist/bokeh-4.0.0-py3-none-any.whl deployment-4.0.0",
        "mkdir deployment-4.0.0/bokehjs",
        "cp -r bokehjs/build deployment-4.0.0/bokehjs",
        "mkdir -p deployment-4.0.0/docs/bokeh/build",
        "cp -r docs/bokeh/build/html deployment-4.0.0/docs/bokeh/build",
        "cp -r docs/bokeh/switcher.json deployment-4.0.0/docs/bokeh",
        "tar czvf deployment-4.0.0.tgz deployment-4.0.0",
    ]


def test_pack_deployment_tarball_stops_on_first_failure(config: Config) -> None:
    system = RecordingSystem(failures={"cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0": ("missing",)})

    result = deployment.pack_deployment_tarball(config, system)

    assert result.kind is ActionResult.FAIL
    assert system.commands[-1] == "cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0"


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (
            deployment.download_deployment_tarball,
            "aws s3 cp s3://bokeh-deployments/deployment-4.0.0.tgz . --region us-east-1",
        ),
        (
            deployment.upload_deployment_tarball,
            "aws s3 cp deployment-4.0.0.tgz s3://bokeh-deployments/ --region us-east-1",
        ),
    ],
)
def test_deployment_tarball_transfers(config: Config, func: StepType, command: str) -> None:
    system = RecordingSystem()

    result = func(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [command]


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (
            deployment.download_deployment_tarball,
            "aws s3 cp s3://bokeh-deployments/deployment-4.0.0.tgz . --region us-east-1",
        ),
        (
            deployment.upload_deployment_tarball,
            "aws s3 cp deployment-4.0.0.tgz s3://bokeh-deployments/ --region us-east-1",
        ),
    ],
)
def test_deployment_tarball_transfer_failures(config: Config, func: StepType, command: str) -> None:
    system = RecordingSystem(failures={command: ("transfer failed",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("transfer failed",)


def test_unpack_deployment_tarball(config: Config) -> None:
    system = RecordingSystem()

    result = deployment.unpack_deployment_tarball(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["tar xvf deployment-4.0.0.tgz"]


def test_unpack_deployment_tarball_failure(config: Config) -> None:
    command = "tar xvf deployment-4.0.0.tgz"
    system = RecordingSystem(failures={command: ("failure",)})

    result = deployment.unpack_deployment_tarball(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("failure",)
