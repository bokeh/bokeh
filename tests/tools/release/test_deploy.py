from __future__ import annotations

# External imports
import pytest

# Bokeh imports
# Bokeh test imports
from tests.tools.release._support import RecordingSystem
from tools.release import deploy
from tools.release.config import Config
from tools.release.enums import ActionResult
from tools.release.pipeline import StepType


@pytest.mark.parametrize(
    ("version", "expected_command"),
    [
        ("4.0.0", "npm publish --access=public  bokeh-bokehjs-4.0.0.tgz"),
        ("4.0.0rc1", "npm publish --access=public --tag=dev bokeh-bokehjs-4.0.0-rc.1.tgz"),
        ("4.0.0.dev1", "npm publish --access=public --tag=dev bokeh-bokehjs-4.0.0-dev.1.tgz"),
    ],
)
def test_publish_npm_package_uses_release_appropriate_tag(version: str, expected_command: str) -> None:
    system = RecordingSystem()

    result = deploy.publish_npm_package(Config(version), system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [expected_command]
    assert system.directories == [("cd", f"deployment-{version}"), ("cd", "..")]


@pytest.mark.parametrize(
    ("version", "channels"),
    [
        ("4.0.0", "--channel main --channel rc --channel dev"),
        ("4.0.0rc1", "--channel rc --channel dev"),
        ("4.0.0.dev1", "--channel dev"),
    ],
)
def test_publish_conda_package_uses_release_appropriate_labels(version: str, channels: str) -> None:
    config = Config(version)
    config.add_secret("ANACONDA_TOKEN", "token")
    system = RecordingSystem()

    result = deploy.publish_conda_package(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        f"rattler-build upload anaconda --owner bokeh --api-key token {channels} --force "
        f"deployment-{version}/bokeh-{version}-py_0.tar.bz2",
    ]


def test_publish_full_documentation_updates_version_latest_and_switcher(config: Config) -> None:
    system = RecordingSystem()

    result = deploy.publish_documentation(config, system)

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

    result = deploy.publish_documentation(Config(version), system)

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


def test_publish_pip_packages_uploads_sdist_and_wheel(config: Config) -> None:
    system = RecordingSystem()

    result = deploy.publish_pip_packages(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "twine upload -u __token__ -p $PYPI_TOKEN deployment-4.0.0/bokeh-4.0.0.tar.gz deployment-4.0.0/bokeh-4.0.0-py3-none-any.whl",
    ]


def test_unpack_deployment_tarball(config: Config) -> None:
    system = RecordingSystem()

    result = deploy.unpack_deployment_tarball(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["tar xvf deployment-4.0.0.tgz"]


@pytest.mark.parametrize(
    ("func", "failed_command"),
    [
        (deploy.publish_npm_package, "npm publish --access=public  bokeh-bokehjs-4.0.0.tgz"),
        (
            deploy.publish_conda_package,
            "rattler-build upload anaconda --owner bokeh --api-key token "
            "--channel main --channel rc --channel dev --force "
            "deployment-4.0.0/bokeh-4.0.0-py_0.tar.bz2",
        ),
        (
            deploy.publish_pip_packages,
            "twine upload -u __token__ -p $PYPI_TOKEN deployment-4.0.0/bokeh-4.0.0.tar.gz deployment-4.0.0/bokeh-4.0.0-py3-none-any.whl",
        ),
        (deploy.unpack_deployment_tarball, "tar xvf deployment-4.0.0.tgz"),
    ],
)
def test_deploy_steps_report_command_failures(config: Config, func: StepType, failed_command: str) -> None:
    config.add_secret("ANACONDA_TOKEN", "token")
    system = RecordingSystem(failures={failed_command: ("failure",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("failure",)
