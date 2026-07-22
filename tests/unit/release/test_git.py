from __future__ import annotations

# External imports
import pytest
from release import git
from release.enums import ActionResult

# Bokeh imports
# Bokeh test imports
from tests.unit.release._support import RecordingSystem


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (git.checkout_base_branch, "git checkout branch-4.0"),
        (git.checkout_staging_branch, "git checkout -b staging-4.0.0"),
        (git.clean_repo, "git clean -fdx"),
        (git.delete_staging_branch, "git branch -D 'staging-4.0.0'"),
        (
            git.merge_staging_branch,
            "git merge --no-ff staging-4.0.0 -m 'Merge deployment staging branch staging-4.0.0'",
        ),
        (git.tag_release_version, "git tag -a 4.0.0 -m 'Release 4.0.0'"),
    ],
)
def test_single_command_git_actions(config, func, command):
    system = RecordingSystem()

    result = func(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [command]


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (git.checkout_base_branch, "git checkout branch-4.0"),
        (git.checkout_staging_branch, "git checkout -b staging-4.0.0"),
        (git.clean_repo, "git clean -fdx"),
        (git.delete_staging_branch, "git branch -D 'staging-4.0.0'"),
        (
            git.merge_staging_branch,
            "git merge --no-ff staging-4.0.0 -m 'Merge deployment staging branch staging-4.0.0'",
        ),
        (git.tag_release_version, "git tag -a 4.0.0 -m 'Release 4.0.0'"),
    ],
)
def test_single_command_git_actions_report_failure(config, func, command):
    system = RecordingSystem(failures={command: ("git error",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("git error",)


def test_push_to_github_pushes_branch_before_tag(config):
    system = RecordingSystem()

    result = git.push_to_github(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "git push --no-verify origin branch-4.0",
        "git push --no-verify origin 4.0.0",
    ]


@pytest.mark.parametrize(
    "failed_command",
    ["git push --no-verify origin branch-4.0", "git push --no-verify origin 4.0.0"],
)
def test_push_to_github_reports_either_push_failure(config, failed_command):
    system = RecordingSystem(failures={failed_command: ("rejected",)})

    result = git.push_to_github(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("rejected",)


def test_commit_staging_branch_adds_modified_and_new_files(config):
    config.add_modified("modified.json")
    config.add_new("new.json")
    system = RecordingSystem()

    result = git.commit_staging_branch(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "git ls-files --error-unmatch modified.json",
        "git add modified.json",
        "git ls-files --error-unmatch -o new.json",
        "git add new.json",
        "git commit -m 'Deployment updates for release 4.0.0'",
    ]


@pytest.mark.parametrize(
    ("failed_command", "message"),
    [
        ("git ls-files --error-unmatch modified.json", "marked modified"),
        ("git add modified.json", "Could not git add"),
        ("git ls-files --error-unmatch -o new.json", "marked new"),
        ("git add new.json", "Could not git add"),
        ("git commit -m 'Deployment updates for release 4.0.0'", "Could not git commit"),
    ],
)
def test_commit_staging_branch_reports_each_failure(config, failed_command, message):
    config.add_modified("modified.json")
    config.add_new("new.json")
    system = RecordingSystem(failures={failed_command: ("failure",)})

    result = git.commit_staging_branch(config, system)

    assert result.kind is ActionResult.FAIL
    assert message in result.message


def test_commit_staging_branch_commits_even_with_no_tracked_changes(config):
    system = RecordingSystem()

    result = git.commit_staging_branch(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["git commit -m 'Deployment updates for release 4.0.0'"]


def test_get_tags_filters_final_commit_markers_and_sorts_versions(config):
    system = RecordingSystem(outputs={
        "git tag": "3.10.0\n4.0.0rc1\n3.9.3-final-commit\n4.0.0.dev2\n",
    })

    assert git.get_tags(config, system) == ["4.0.0rc1", "4.0.0.dev2", "3.10.0"]


def test_get_tags_wraps_git_failure(config):
    system = RecordingSystem(failures={"git tag": ("failure",)})

    with pytest.raises(RuntimeError, match="Could NOT get release version tags"):
        git.get_tags(config, system)
