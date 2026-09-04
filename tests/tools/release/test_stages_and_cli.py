from __future__ import annotations

# Standard library imports
import runpy
import sys
from collections.abc import Sequence
from typing import Any

# External imports
import pytest
import yaml

# Bokeh imports
from tests.support.util.project import TOP_PATH
from tools.release import stages
from tools.release.build import (
    update_changelog,
    update_hash_manifest,
    update_switcher_json,
)
from tools.release.checks import (
    check_docs_version_config,
    check_milestone_labels,
    check_release_notes_present,
)
from tools.release.config import Config
from tools.release.git import commit_staging_branch, push_to_github, tag_release_version
from tools.release.pipeline import StepType, is_check


@pytest.mark.parametrize(
    "steps",
    [
        stages.BUILD_ARTIFACT_STEPS,
        stages.BUILD_CHECKS,
        stages.DOCS_STEPS,
        stages.PREPARE_DEPLOYMENT_CHECKS,
        stages.PREPARE_DEPLOYMENT_STEPS,
        stages.UPLOAD_DEPLOYMENT_STEPS,
        stages.UPDATE_RELEASE_REPOSITORY_STEPS,
    ],
)
def test_stage_lists_do_not_repeat_functions(steps: list[StepType]) -> None:
    assert len(steps) == len(set(steps))


def test_all_build_checks_are_recognized_as_checks() -> None:
    assert all(is_check(step) for step in stages.BUILD_CHECKS)


def test_all_prepare_deployment_checks_are_recognized_as_checks() -> None:
    assert all(is_check(step) for step in stages.PREPARE_DEPLOYMENT_CHECKS)


def test_build_artifact_pipeline_midflight_checks_are_explicit() -> None:
    assert [step.__name__ for step in stages.BUILD_ARTIFACT_STEPS if is_check(step)] == [
        "check_docs_version_config",
        "check_checkout_is_clean",
        "verify_pip_install_from_sdist",
        "verify_pip_install_using_sdist",
        "verify_pip_install_using_wheel",
        "verify_conda_package",
    ]


def test_build_pipeline_is_partitioned_for_scoped_aws_credentials() -> None:
    assert stages.UPLOAD_DEPLOYMENT_STEPS == (
        stages.upload_deployment_tarball,
        stages.publish_bokehjs_to_cdn,
    )
    assert not set(stages.BUILD_ARTIFACT_STEPS) & set(stages.UPLOAD_DEPLOYMENT_STEPS)
    assert not set(stages.BUILD_ARTIFACT_STEPS) & set(stages.UPDATE_RELEASE_REPOSITORY_STEPS)
    assert not set(stages.UPLOAD_DEPLOYMENT_STEPS) & set(stages.UPDATE_RELEASE_REPOSITORY_STEPS)


def test_prepare_deployment_steps_are_not_misclassified_as_checks() -> None:
    assert all(not is_check(step) for step in stages.PREPARE_DEPLOYMENT_STEPS)


def test_docs_steps_are_not_misclassified_as_checks() -> None:
    assert all(not is_check(step) for step in stages.DOCS_STEPS)


def test_full_release_only_checks_and_steps_are_marked() -> None:
    assert getattr(check_release_notes_present, "skip_for_prerelease") is True
    assert getattr(check_docs_version_config, "skip_for_prerelease", False) is False
    assert getattr(check_milestone_labels, "skip_for_prerelease") is True
    assert getattr(update_changelog, "skip_for_prerelease") is True
    assert getattr(update_hash_manifest, "skip_for_prerelease") is True


def test_build_artifact_pipeline_checks_branch_before_mutating_steps() -> None:
    assert stages.BUILD_CHECKS.index(stages.check_checkout_on_base_branch) < len(stages.BUILD_CHECKS)
    assert stages.BUILD_ARTIFACT_STEPS[0].__name__ == "clean_repo"


def test_build_artifact_pipeline_commits_before_tagging() -> None:
    steps = stages.BUILD_ARTIFACT_STEPS
    assert steps.index(update_switcher_json) < steps.index(commit_staging_branch)
    assert steps.index(check_docs_version_config) < steps.index(commit_staging_branch)
    assert steps.index(commit_staging_branch) < steps.index(tag_release_version)
    assert stages.UPDATE_RELEASE_REPOSITORY_STEPS[-2] is push_to_github


def test_build_pipeline_uploads_deployment_and_cdn_artifacts() -> None:
    assert stages.BUILD_ARTIFACT_STEPS.index(stages.build_docs) < stages.BUILD_ARTIFACT_STEPS.index(stages.pack_deployment_tarball)
    assert stages.UPLOAD_DEPLOYMENT_STEPS.index(stages.upload_deployment_tarball) < stages.UPLOAD_DEPLOYMENT_STEPS.index(stages.publish_bokehjs_to_cdn)


def test_build_pipeline_updates_and_checks_switcher() -> None:
    assert update_switcher_json in stages.BUILD_ARTIFACT_STEPS
    assert check_docs_version_config in stages.BUILD_ARTIFACT_STEPS
    assert stages.BUILD_ARTIFACT_STEPS.index(update_switcher_json) < stages.BUILD_ARTIFACT_STEPS.index(check_docs_version_config)


def test_prepare_deployment_pipeline_only_prepares_release_artifacts() -> None:
    names = [step.__name__ for step in stages.PREPARE_DEPLOYMENT_STEPS]

    assert names == ["download_deployment_tarball", "unpack_deployment_tarball"]


def test_docs_pipeline_only_publishes_documentation() -> None:
    assert [step.__name__ for step in stages.DOCS_STEPS] == ["publish_documentation"]


def test_build_workflow_fetches_full_git_history() -> None:
    with open(TOP_PATH / ".github/workflows/bokeh-release-build.yml") as f:
        workflow = yaml.safe_load(f)

    steps = workflow["jobs"]["build"]["steps"]
    checkout = next(step for step in steps if step.get("uses", "").startswith("actions/checkout@"))

    assert checkout["with"]["fetch-depth"] == 0


@pytest.mark.parametrize(
    ("filename", "job_name"),
    [
        ("bokeh-release-build.yml", "build"),
        ("bokeh-release-deploy.yml", "prepare"),
    ],
)
def test_release_confirmation_includes_version(filename: str, job_name: str) -> None:
    with open(TOP_PATH / ".github/workflows" / filename) as f:
        workflow = yaml.safe_load(f)

    steps = workflow["jobs"][job_name]["steps"]
    confirmation = next(step for step in steps if step.get("name") == "Maintainer confirmed")

    assert confirmation["env"]["BOKEH_VERSION"] == "${{ github.event.inputs.version }}"


@pytest.mark.parametrize(
    (
        "filename",
        "job_name",
        "step_name",
        "role_variable",
        "session_name",
        "contents_permission",
        "environment_name",
    ),
    [
        (
            "bokeh-release-build.yml",
            "build",
            "Upload Deployment Assets",
            "${{ vars.AWS_RELEASE_BUILD_ROLE_ARN }}",
            "bokeh-release-build-${{ github.run_id }}",
            "write",
            "upload-deployment",
        ),
        (
            "bokeh-release-deploy.yml",
            "prepare",
            "Prepare Release Tarball",
            "${{ vars.AWS_RELEASE_DEPLOY_ROLE_ARN }}",
            "bokeh-release-prepare-${{ github.run_id }}",
            "read",
            "download-deployment",
        ),
        (
            "bokeh-release-deploy.yml",
            "publish-docs",
            "Publish documentation",
            "${{ vars.AWS_RELEASE_DOCS_ROLE_ARN }}",
            "bokeh-release-docs-${{ github.run_id }}",
            "read",
            "publish-docs",
        ),
    ],
)
def test_release_workflows_use_aws_oidc(
    filename: str,
    job_name: str,
    step_name: str,
    role_variable: str,
    session_name: str,
    contents_permission: str,
    environment_name: str,
) -> None:
    with open(TOP_PATH / ".github/workflows" / filename) as f:
        workflow = yaml.safe_load(f)

    job = workflow["jobs"][job_name]
    assert job["environment"]["name"] == environment_name
    assert job["permissions"] == {"contents": contents_permission, "id-token": "write"}

    configure = next(step for step in job["steps"] if step.get("uses", "").startswith("aws-actions/configure-aws-credentials@"))
    assert configure["uses"] == "aws-actions/configure-aws-credentials@v6.2.3"
    expected: dict[str, str | int] = {
        "role-to-assume": role_variable,
        "role-session-name": session_name,
        "aws-region": "us-east-1",
        "output-env-credentials": False,
        "output-credentials": True,
    }
    if job_name == "build":
        expected["role-duration-seconds"] = 7200
    assert configure["with"] == expected
    assert configure["id"] == "aws"

    release = next(step for step in job["steps"] if step.get("name") == step_name)
    assert release["env"] == {
        "AWS_ACCESS_KEY_ID": "${{ steps.aws.outputs.aws-access-key-id }}",
        "AWS_SECRET_ACCESS_KEY": "${{ steps.aws.outputs.aws-secret-access-key }}",
        "AWS_SESSION_TOKEN": "${{ steps.aws.outputs.aws-session-token }}",
        "BOKEH_VERSION": "${{ github.event.inputs.version }}",
    }

    configure_index = job["steps"].index(configure)
    release_index = job["steps"].index(release)
    assert configure_index < release_index
    for step in job["steps"]:
        if step.get("uses", "").startswith(("actions/checkout@", "prefix-dev/setup-pixi@")):
            assert job["steps"].index(step) < configure_index

    if job_name == "build":
        build = next(step for step in job["steps"] if step.get("name") == "Build Release Artifacts")
        update_repository = next(step for step in job["steps"] if step.get("name") == "Update Release Repository")
        assert configure_index < job["steps"].index(build) < release_index < job["steps"].index(update_repository)
    elif job_name == "publish-docs":
        download = next(step for step in job["steps"] if step.get("name") == "Download documentation")
        assert job["steps"].index(download) < configure_index

    for step in job["steps"]:
        if step is release:
            continue
        env = step.get("env", {})
        assert not {"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"} & set(env)


@pytest.mark.parametrize("version", ["4.0.0.dev1", "4.0.0rc1", "4.0.0"])
def test_deploy_workflow_uploads_distributions_for_all_release_types(version: str) -> None:
    with open(TOP_PATH / ".github/workflows/bokeh-release-deploy.yml") as f:
        workflow = yaml.safe_load(f)

    steps = workflow["jobs"]["prepare"]["steps"]
    conda = next(step for step in steps if step.get("name") == "Upload Conda distribution")
    docs = next(step for step in steps if step.get("name") == "Upload documentation")
    npm = next(step for step in steps if step.get("name") == "Upload npm distribution")
    pypi = next(step for step in steps if step.get("name") == "Upload Python distributions")

    assert conda["with"]["path"].replace("${{ github.event.inputs.version }}", version) == (f"deployment-{version}/bokeh-{version}-py_0.tar.bz2")
    assert docs["with"]["path"].replace("${{ github.event.inputs.version }}", version) == f"deployment-{version}/docs/"
    assert npm["with"]["path"].replace("${{ github.event.inputs.version }}", version) == (f"deployment-{version}/bokeh-*.tgz")
    assert pypi["with"]["path"].replace("${{ github.event.inputs.version }}", version).splitlines() == [
        f"deployment-{version}/bokeh-{version}.tar.gz",
        f"deployment-{version}/bokeh-{version}-py3-none-any.whl",
    ]
    assert conda["with"]["if-no-files-found"] == docs["with"]["if-no-files-found"] == "error"
    assert npm["with"]["if-no-files-found"] == "error"
    assert pypi["with"]["if-no-files-found"] == "error"


def test_deploy_workflow_uses_isolated_publishers() -> None:
    with open(TOP_PATH / ".github/workflows/bokeh-release-deploy.yml") as f:
        workflow = yaml.safe_load(f)

    prepare = workflow["jobs"]["prepare"]
    deploy_step = next(step for step in prepare["steps"] if step.get("name") == "Prepare Release Tarball")
    assert "ANACONDA_TOKEN" not in deploy_step["env"]
    assert "PYPI_TOKEN" not in deploy_step["env"]
    assert "NPM_TOKEN" not in deploy_step["env"]

    assert set(workflow["jobs"]) == {
        "preflight",
        "prepare",
        "publish-docs",
        "publish-conda",
        "publish-npm",
        "publish-pypi",
        "finalize",
    }

    preflight = workflow["jobs"]["preflight"]
    assert preflight["environment"]["name"] == "publish-anaconda"
    assert preflight["permissions"] == {}
    setup_anaconda = next(
        step for step in preflight["steps"] if step.get("uses", "").startswith("anaconda/actions/setup-anaconda-cli@")
    )
    assert setup_anaconda["uses"] == "anaconda/actions/setup-anaconda-cli@v0.3.1"
    assert setup_anaconda["with"] == {"version": "v0.2.1", "tools": "anaconda-cli"}
    validate_anaconda = next(step for step in preflight["steps"] if step.get("name") == "Validate Anaconda token")
    assert validate_anaconda["env"] == {"ANACONDA_TOKEN": "${{ secrets.ANACONDA_TOKEN }}"}
    assert "-t \"$ANACONDA_TOKEN\" whoami 2>&1" in validate_anaconda["run"]
    assert "printf '%s\\n' \"$identity\"" in validate_anaconda["run"]
    assert "Username: bokeh" in validate_anaconda["run"]
    assert "Verified Anaconda credentials" in validate_anaconda["run"]

    assert prepare["needs"] == "preflight"

    docs = workflow["jobs"]["publish-docs"]
    conda = workflow["jobs"]["publish-conda"]
    npm = workflow["jobs"]["publish-npm"]
    pypi = workflow["jobs"]["publish-pypi"]
    assert docs["needs"] == conda["needs"] == npm["needs"] == pypi["needs"] == "prepare"
    assert docs["permissions"] == {"contents": "read", "id-token": "write"}
    assert conda["permissions"] == {}
    assert npm["permissions"] == pypi["permissions"] == {"id-token": "write"}
    assert docs["environment"]["name"] == "publish-docs"
    assert conda["environment"]["name"] == "publish-anaconda"
    assert npm["environment"]["name"] == "publish-npm"
    assert pypi["environment"]["name"] == "publish-pypi"
    environments = [job["environment"]["name"] for job in (docs, conda, npm, pypi)]
    assert len(environments) == len(set(environments))

    docs_download = next(step for step in docs["steps"] if step.get("uses", "").startswith("actions/download-artifact@"))
    conda_download = next(step for step in conda["steps"] if step.get("uses", "").startswith("actions/download-artifact@"))
    npm_download = next(step for step in npm["steps"] if step.get("uses", "").startswith("actions/download-artifact@"))
    pypi_download = next(step for step in pypi["steps"] if step.get("uses", "").startswith("actions/download-artifact@"))
    assert docs_download["with"] == {
        "name": "docs-distribution",
        "path": "deployment-${{ github.event.inputs.version }}/docs/",
    }
    assert conda_download["with"] == {"name": "conda-distribution", "path": "dist/"}
    assert npm_download["with"] == {"name": "npm-distribution", "path": "dist/"}
    assert pypi_download["with"] == {"name": "pypi-distributions", "path": "dist/"}

    docs_publish = next(step for step in docs["steps"] if step.get("name") == "Publish documentation")
    assert docs_publish["run"] == 'python -m tools.release publish-docs "$BOKEH_VERSION"'

    conda_publish = next(step for step in conda["steps"] if step.get("uses", "").startswith("anaconda/actions/upload-package@"))
    assert conda_publish["uses"] == "anaconda/actions/upload-package@v0.3.1"
    assert conda_publish["with"] == {
        "token": "${{ secrets.ANACONDA_TOKEN }}",
        "channel": "bokeh",
        "packages": "dist/bokeh-*.tar.bz2",
        "labels": ("${{ contains(github.event.inputs.version, '.dev') && 'dev' || contains(github.event.inputs.version, 'rc') && 'rc,dev' || 'main,rc,dev' }}"),
        "force": True,
    }

    npm_publish = next(step for step in npm["steps"] if step.get("name") == "Publish npm distribution")
    assert npm_publish["env"]["NPM_TAG"] == (
        "${{ (contains(github.event.inputs.version, '.dev') || contains(github.event.inputs.version, 'rc')) && 'dev' || 'latest' }}"
    )
    assert npm_publish["run"].splitlines() == [
        "for package in bokeh-bokehjs bokeh-framework bokeh-angular bokeh-react bokeh-svelte bokeh-vue bokeh-web-component; do",
        '  npm publish --access=public --tag="$NPM_TAG" "$package"-*.tgz',
        "done",
    ]

    pypi_publish = next(step for step in pypi["steps"] if step.get("uses", "").startswith("pypa/gh-action-pypi-publish@"))
    assert pypi_publish["uses"] == "pypa/gh-action-pypi-publish@release/v1"
    assert "with" not in pypi_publish

    finalize = workflow["jobs"]["finalize"]
    assert finalize["if"] == "${{ always() }}"
    assert set(finalize["needs"]) == {"preflight", "publish-docs", "publish-conda", "publish-npm", "publish-pypi"}
    assert finalize["permissions"] == {}

    confirmation = next(step for step in finalize["steps"] if step.get("name") == "Confirm release deployment")
    assert confirmation["env"] == {
        "BOKEH_VERSION": "${{ github.event.inputs.version }}",
        "PREFLIGHT_RESULT": "${{ needs.preflight.result }}",
        "DOCS_RESULT": "${{ needs.publish-docs.result }}",
        "CONDA_RESULT": "${{ needs.publish-conda.result }}",
        "NPM_RESULT": "${{ needs.publish-npm.result }}",
        "PYPI_RESULT": "${{ needs.publish-pypi.result }}",
    }


@pytest.mark.parametrize(
    ("command", "expected_stages"),
    [
        ("build-artifacts", [stages.BUILD_CHECKS, stages.BUILD_ARTIFACT_STEPS]),
        ("upload-deployment", [stages.UPLOAD_DEPLOYMENT_STEPS]),
        ("update-release-repository", [stages.UPDATE_RELEASE_REPOSITORY_STEPS]),
        ("publish-docs", [stages.DOCS_STEPS]),
        ("prepare-deployment", [stages.PREPARE_DEPLOYMENT_CHECKS, stages.PREPARE_DEPLOYMENT_STEPS]),
    ],
)
def test_cli_executes_release_pipelines(
    monkeypatch: pytest.MonkeyPatch,
    command: str,
    expected_stages: list[list[StepType]],
) -> None:
    observed: list[list[Any]] = []

    class FakePipeline:
        def __init__(self, steps: Sequence[StepType], config: Config, system: object) -> None:
            observed.append([steps, config.version, system])

        def execute(self) -> None:
            observed[-1].append("executed")

    sentinel_system = object()
    monkeypatch.setattr("tools.release.pipeline.Pipeline", FakePipeline)
    monkeypatch.setattr("tools.release.system.System", lambda: sentinel_system)
    monkeypatch.setattr(sys, "argv", ["tools.release", command, "4.0.0"])

    with pytest.raises(SystemExit) as error:
        runpy.run_module("tools.release.__main__", run_name="__main__")

    assert error.value.code == 0
    assert [item[0] for item in observed] == expected_stages
    assert all(item[1:] == ["4.0.0", sentinel_system, "executed"] for item in observed)


@pytest.mark.parametrize(
    "arguments",
    [
        [],
        ["unknown"],
        ["build"],
        ["build", "4.0.0"],
        ["build-artifacts"],
        ["publish-build", "4.0.0"],
        ["finalize-build", "4.0.0"],
        ["deploy", "4.0.0"],
        ["generate-build-checks"],
        ["generate-config", "4.0.0"],
        ["check_aws_present"],
        ["publish-docs"],
        ["prepare-deployment"],
        ["upload-deployment"],
        ["update-release-repository"],
        ["extra", "arguments", "here"],
    ],
)
def test_cli_rejects_unrecognized_arguments(monkeypatch: pytest.MonkeyPatch, arguments: list[str]) -> None:
    monkeypatch.setattr(sys, "argv", ["tools.release", *arguments])

    with pytest.raises(RuntimeError, match="Unrecognized args"):
        runpy.run_module("tools.release.__main__", run_name="__main__")
