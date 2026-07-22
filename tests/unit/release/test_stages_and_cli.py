from __future__ import annotations

# Standard library imports
import ast
import runpy
import sys
from subprocess import run

# External imports
import pytest
import yaml
from release import stages
from release.build import update_changelog, update_hash_manifest, update_switcher_json
from release.checks import (
    check_docs_version_config,
    check_milestone_labels,
    check_release_notes_present,
)
from release.config import Config
from release.git import commit_staging_branch, push_to_github, tag_release_version
from release.pipeline import is_check
from release.util import CONFIG_FILENAME, load_config

# Bokeh imports
from tests.support.util.project import TOP_PATH


@pytest.mark.parametrize(
    "steps",
    [stages.BUILD_CHECKS, stages.BUILD_STEPS, stages.DEPLOY_CHECKS, stages.DEPLOY_STEPS],
)
def test_stage_lists_do_not_repeat_functions(steps):
    assert len(steps) == len(set(steps))


def test_all_build_checks_are_recognized_as_checks():
    assert all(is_check(step) for step in stages.BUILD_CHECKS)


def test_all_deploy_checks_are_recognized_as_checks():
    assert all(is_check(step) for step in stages.DEPLOY_CHECKS)


def test_build_pipeline_midflight_checks_are_explicit():
    assert [step.__name__ for step in stages.BUILD_STEPS if is_check(step)] == [
        "check_docs_version_config",
        "check_checkout_is_clean",
        "verify_pip_install_from_sdist",
        "verify_pip_install_using_sdist",
        "verify_pip_install_using_wheel",
        "verify_conda_install",
    ]


def test_deploy_steps_are_not_misclassified_as_checks():
    assert all(not is_check(step) for step in stages.DEPLOY_STEPS)


def test_full_release_only_checks_and_steps_are_marked():
    assert check_release_notes_present.skip_for_prerelease is True
    assert getattr(check_docs_version_config, "skip_for_prerelease", False) is False
    assert check_milestone_labels.skip_for_prerelease is True
    assert update_changelog.skip_for_prerelease is True
    assert update_hash_manifest.skip_for_prerelease is True


def test_build_pipeline_checks_branch_before_mutating_steps():
    assert stages.BUILD_CHECKS.index(stages.check_checkout_on_base_branch) < len(stages.BUILD_CHECKS)
    assert stages.BUILD_STEPS[0].__name__ == "clean_repo"


def test_build_pipeline_commits_before_tagging_and_pushes_last():
    assert stages.BUILD_STEPS.index(update_switcher_json) < stages.BUILD_STEPS.index(commit_staging_branch)
    assert stages.BUILD_STEPS.index(check_docs_version_config) < stages.BUILD_STEPS.index(commit_staging_branch)
    assert stages.BUILD_STEPS.index(commit_staging_branch) < stages.BUILD_STEPS.index(tag_release_version)
    assert stages.BUILD_STEPS.index(tag_release_version) < stages.BUILD_STEPS.index(push_to_github)
    assert stages.BUILD_STEPS[-2] is push_to_github


def test_build_pipeline_updates_and_checks_switcher():
    assert update_switcher_json in stages.BUILD_STEPS
    assert check_docs_version_config in stages.BUILD_STEPS
    assert stages.BUILD_STEPS.index(update_switcher_json) < stages.BUILD_STEPS.index(check_docs_version_config)


def test_deploy_pipeline_downloads_and_unpacks_before_publication():
    names = [step.__name__ for step in stages.DEPLOY_STEPS]

    assert names[:2] == ["download_deployment_tarball", "unpack_deployment_tarball"]
    assert names[2:] == [
        "publish_npm_package",
        "publish_conda_package",
        "publish_pip_packages",
        "publish_documentation",
    ]


def test_build_workflow_fetches_full_git_history():
    with open(TOP_PATH / ".github/workflows/bokeh-release-build.yml") as f:
        workflow = yaml.safe_load(f)

    steps = workflow["jobs"]["build"]["steps"]
    checkout = next(step for step in steps if step.get("uses", "").startswith("actions/checkout@"))

    assert checkout["with"]["fetch-depth"] == 0


@pytest.mark.parametrize(
    ("filename", "job_name"),
    [
        ("bokeh-release-build.yml", "build"),
        ("bokeh-release-deploy.yml", "deploy"),
    ],
)
def test_release_confirmation_includes_version(filename, job_name):
    with open(TOP_PATH / ".github/workflows" / filename) as f:
        workflow = yaml.safe_load(f)

    steps = workflow["jobs"][job_name]["steps"]
    confirmation = next(step for step in steps if step.get("name") == "Maintainer confirmed")

    assert confirmation["env"]["BOKEH_VERSION"] == "${{ github.event.inputs.version }}"


def test_generated_config_is_gitignored():
    result = run(["git", "check-ignore", "--quiet", CONFIG_FILENAME], cwd=TOP_PATH)

    assert result.returncode == 0


@pytest.mark.parametrize(
    ("argument", "expected"),
    [
        ("generate-build-checks", [step.__name__ for step in stages.BUILD_CHECKS]),
        ("generate-build-steps", [step.__name__ for step in stages.BUILD_STEPS]),
        ("generate-deploy-checks", [step.__name__ for step in stages.DEPLOY_CHECKS]),
        ("generate-deploy-steps", [step.__name__ for step in stages.DEPLOY_STEPS]),
    ],
)
def test_cli_generates_stage_names(monkeypatch, capsys, argument, expected):
    monkeypatch.setattr(sys, "argv", ["release", argument])

    with pytest.raises(SystemExit) as error:
        runpy.run_module("release.__main__", run_name="__main__")

    assert error.value.code == 0
    assert ast.literal_eval(capsys.readouterr().out) == expected


def test_cli_generates_serialized_config(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(sys, "argv", ["release", "generate-config", "4.0.0"])

    with pytest.raises(SystemExit) as error:
        runpy.run_module("release.__main__", run_name="__main__")

    assert error.value.code == 0
    config = load_config()
    assert isinstance(config, Config)
    assert config.version == "4.0.0"
    assert config.base_branch == "branch-4.0"


@pytest.mark.parametrize(
    ("command", "expected_stages"),
    [
        ("build", [stages.BUILD_CHECKS, stages.BUILD_STEPS]),
        ("deploy", [stages.DEPLOY_CHECKS, stages.DEPLOY_STEPS]),
    ],
)
def test_cli_executes_build_and_deploy_pipelines(monkeypatch, command, expected_stages):
    observed = []

    class FakePipeline:
        def __init__(self, steps, config, system):
            observed.append((steps, config.version, system))

        def execute(self):
            observed[-1] += ("executed",)

    sentinel_system = object()
    monkeypatch.setattr("release.pipeline.Pipeline", FakePipeline)
    monkeypatch.setattr("release.system.System", lambda: sentinel_system)
    monkeypatch.setattr(sys, "argv", ["release", command, "4.0.0"])

    with pytest.raises(SystemExit) as error:
        runpy.run_module("release.__main__", run_name="__main__")

    assert error.value.code == 0
    assert [item[0] for item in observed] == expected_stages
    assert all(item[1:] == ("4.0.0", sentinel_system, "executed") for item in observed)


def test_cli_executes_and_persists_individual_stage(monkeypatch):
    observed = []
    config = Config("4.0.0")

    def stage(config, system):
        raise AssertionError("Fake pipeline should own stage execution")

    stage.__name__ = "custom_stage"

    class FakePipeline:
        def __init__(self, steps, actual_config, system):
            observed.append((steps, actual_config, system))

        def execute(self):
            observed.append("executed")

    saved = []
    sentinel_system = object()
    monkeypatch.setattr(stages, "custom_stage", stage, raising=False)
    monkeypatch.setattr("release.pipeline.Pipeline", FakePipeline)
    monkeypatch.setattr("release.system.System", lambda: sentinel_system)
    monkeypatch.setattr("release.util.load_config", lambda: config)
    monkeypatch.setattr("release.util.save_config", saved.append)
    monkeypatch.setattr(sys, "argv", ["release", "custom_stage"])

    with pytest.raises(SystemExit) as error:
        runpy.run_module("release.__main__", run_name="__main__")

    assert error.value.code == 0
    assert observed == [([stage], config, sentinel_system), "executed"]
    assert saved == [config]


@pytest.mark.parametrize("arguments", [[], ["unknown"], ["build"], ["deploy"], ["extra", "arguments", "here"]])
def test_cli_rejects_unrecognized_arguments(monkeypatch, arguments):
    monkeypatch.setattr(sys, "argv", ["release", *arguments])

    with pytest.raises(RuntimeError, match="Unrecognized args"):
        runpy.run_module("release.__main__", run_name="__main__")
