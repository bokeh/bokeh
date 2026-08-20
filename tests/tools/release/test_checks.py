from __future__ import annotations

# Standard library imports
from pathlib import Path

# External imports
import pytest

# Bokeh imports
# Bokeh test imports
from tests.tools.release._support import RecordingSystem
from tools.release import checks
from tools.release.action import FAILED, PASSED
from tools.release.config import Config
from tools.release.enums import ActionResult
from tools.release.pipeline import StepType


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (checks.check_anaconda_present, "which anaconda"),
        (checks.check_aws_present, "which aws"),
        (checks.check_git_present, "which git"),
        (checks.check_npm_present, "which npm"),
        (checks.check_rattler_build_present, "which rattler-build"),
        (checks.check_twine_present, "which twine"),
    ],
)
def test_application_checks_pass_when_command_exists(config: Config, func: StepType, command: str) -> None:
    system = RecordingSystem()

    result = func(config, system)

    assert isinstance(result, PASSED)
    assert system.commands == [command]


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (checks.check_anaconda_present, "which anaconda"),
        (checks.check_aws_present, "which aws"),
        (checks.check_git_present, "which git"),
        (checks.check_npm_present, "which npm"),
        (checks.check_rattler_build_present, "which rattler-build"),
        (checks.check_twine_present, "which twine"),
    ],
)
def test_application_checks_fail_when_command_is_missing(config: Config, func: StepType, command: str) -> None:
    system = RecordingSystem(failures={command: ("missing",)})

    result = func(config, system)

    assert isinstance(result, FAILED)


@pytest.mark.parametrize(
    "remote",
    [
        "git@github.com:bokeh/bokeh.git\n",
        "git@github.com:bokeh/bokeh\n",
        "https://github.com/bokeh/bokeh\n",
        "https://github.com/bokeh/bokeh.git\n",
    ],
)
def test_check_repo_accepts_supported_origin_urls(config: Config, remote: str) -> None:
    system = RecordingSystem(outputs={"git config --get remote.origin.url": remote})

    result = checks.check_repo_is_bokeh(config, system)

    assert result.kind is ActionResult.PASS


def test_check_repo_rejects_other_origin(config: Config) -> None:
    system = RecordingSystem(outputs={"git config --get remote.origin.url": "git@example.com:fork/bokeh.git\n"})

    result = checks.check_repo_is_bokeh(config, system)

    assert result.kind is ActionResult.FAIL
    assert "bad remote" in result.message


def test_check_repo_fails_outside_git_repository(config: Config) -> None:
    system = RecordingSystem(failures={"git status": ("not a repository",)})

    result = checks.check_repo_is_bokeh(config, system)

    assert result.message == "Executing outside of a git repository"


@pytest.mark.parametrize(
    ("branch", "expected"),
    [("branch-4.0\n", ActionResult.PASS), ("main\n", ActionResult.FAIL)],
)
def test_check_checkout_on_base_branch(branch: str, expected: ActionResult) -> None:
    config = Config("4.0.0")
    system = RecordingSystem(outputs={"git rev-parse --abbrev-ref HEAD": branch})

    assert checks.check_checkout_on_base_branch(config, system).kind is expected


@pytest.mark.parametrize(
    ("porcelain", "expected", "details"),
    [
        ("", ActionResult.PASS, None),
        ("M tools/release/build.py\n", ActionResult.FAIL, ["M tools/release/build.py"]),
        ("M a\n?? b\n", ActionResult.FAIL, ["M a", "?? b"]),
    ],
)
def test_check_checkout_cleanliness(
    config: Config,
    porcelain: str,
    expected: ActionResult,
    details: list[str] | None,
) -> None:
    system = RecordingSystem(outputs={"git status --porcelain": porcelain})

    result = checks.check_checkout_is_clean(config, system)

    assert result.kind is expected
    assert result.details == details


@pytest.mark.parametrize(
    ("local", "remote", "base", "expected", "status"),
    [
        ("same\n", "same\n", "same\n", ActionResult.PASS, None),
        ("base\n", "remote\n", "base\n", ActionResult.FAIL, "NEED TO PULL"),
        ("local\n", "base\n", "base\n", ActionResult.FAIL, "NEED TO PUSH"),
        ("local\n", "remote\n", "base\n", ActionResult.FAIL, "DIVERGED"),
    ],
)
def test_check_checkout_matches_remote(
    config: Config,
    local: str,
    remote: str,
    base: str,
    expected: ActionResult,
    status: str | None,
) -> None:
    system = RecordingSystem(outputs={
        "git rev-parse @": local,
        "git rev-parse @{u}": remote,
        "git merge-base @ @{u}": base,
    })

    result = checks.check_checkout_matches_remote(config, system)

    assert result.kind is expected
    if status is not None:
        assert status in result.message


def test_check_checkout_matches_remote_reports_command_failure(config: Config) -> None:
    system = RecordingSystem(failures={"git remote update": ("network",)})

    result = checks.check_checkout_matches_remote(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("network",)


@pytest.mark.parametrize(
    ("versions", "expected"),
    [
        ([{"version": "4.0.0"}], ActionResult.PASS),
        ([{"version": "3.10.0"}], ActionResult.FAIL),
        ([{"name": "heading"}], ActionResult.FAIL),
    ],
)
def test_check_docs_version_config(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    versions: list[dict[str, str]],
    expected: ActionResult,
) -> None:
    path = tmp_path / "docs" / "bokeh"
    path.mkdir(parents=True)
    (path / "switcher.json").write_text(__import__("json").dumps(versions))
    monkeypatch.chdir(tmp_path)

    result = checks.check_docs_version_config(Config("4.0.0"), RecordingSystem())

    assert result.kind is expected


@pytest.mark.parametrize(
    ("version", "versions", "expected"),
    [
        (
            "4.0.0.dev1",
            [{"name": "dev (4.0.0.dev1)", "version": "dev-4.0", "url": "https://docs.bokeh.org/en/dev-4.0/"}],
            ActionResult.PASS,
        ),
        (
            "4.0.0rc1",
            [{"name": "dev (4.0.0rc1)", "version": "dev-4.0", "url": "https://docs.bokeh.org/en/dev-4.0/"}],
            ActionResult.PASS,
        ),
        (
            "4.0.0.dev2",
            [{"name": "dev (4.0.0.dev1)", "version": "dev-4.0", "url": "https://docs.bokeh.org/en/dev-4.0/"}],
            ActionResult.FAIL,
        ),
        (
            "4.0.0.dev1",
            [{"name": "dev (4.0.0.dev1)", "version": "dev-4.0", "url": "https://docs.bokeh.org/en/dev-3.10/"}],
            ActionResult.FAIL,
        ),
        ("4.0.0.dev1", [{"version": "4.0.0.dev1"}], ActionResult.FAIL),
    ],
)
def test_check_docs_version_config_validates_prerelease_entry(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    version: str,
    versions: list[dict[str, str]],
    expected: ActionResult,
) -> None:
    path = tmp_path / "docs" / "bokeh"
    path.mkdir(parents=True)
    (path / "switcher.json").write_text(__import__("json").dumps(versions))
    monkeypatch.chdir(tmp_path)

    result = checks.check_docs_version_config(Config(version), RecordingSystem())

    assert result.kind is expected


def test_check_docs_version_config_uses_latest_prerelease_level(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = tmp_path / "docs" / "bokeh"
    path.mkdir(parents=True)
    (path / "switcher.json").write_text(__import__("json").dumps([{
        "name": "dev (4.1.0.dev2)",
        "version": "dev-4.1",
        "url": "https://docs.bokeh.org/en/dev-4.1/",
    }]))
    monkeypatch.chdir(tmp_path)
    system = RecordingSystem(outputs={"git tag": "4.1.0.dev2\n4.0.0\n3.10.0"})

    result = checks.check_docs_version_config(Config("3.10.1rc1"), system)

    assert result.kind is ActionResult.PASS


def test_check_docs_version_config_allows_no_dev_entry_for_older_prerelease(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = tmp_path / "docs" / "bokeh"
    path.mkdir(parents=True)
    (path / "switcher.json").write_text(__import__("json").dumps([{"version": "4.0.0"}]))
    monkeypatch.chdir(tmp_path)
    system = RecordingSystem(outputs={"git tag": "4.0.0\n3.10.0"})

    result = checks.check_docs_version_config(Config("3.10.1rc1"), system)

    assert result.kind is ActionResult.PASS


def test_check_docs_version_config_rejects_multiple_dev_entries(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = tmp_path / "docs" / "bokeh"
    path.mkdir(parents=True)
    (path / "switcher.json").write_text(__import__("json").dumps([
        {"version": "4.0.0"},
        {"name": "dev (4.1.0.dev2)", "version": "dev-4.1", "url": "https://docs.bokeh.org/en/dev-4.1/"},
        {"name": "dev (4.0.1rc1)", "version": "dev-4.0", "url": "https://docs.bokeh.org/en/dev-4.0/"},
    ]))
    monkeypatch.chdir(tmp_path)
    system = RecordingSystem(outputs={"git tag": "4.1.0.dev2\n4.0.0"})

    result = checks.check_docs_version_config(Config("4.0.0"), system)

    assert result.kind is ActionResult.FAIL
    assert result.message == "Multiple development versions are present in switcher.json"


@pytest.mark.parametrize("content", [None, "not JSON"])
def test_check_docs_version_config_reports_file_errors(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    content: str | None,
) -> None:
    if content is not None:
        path = tmp_path / "docs" / "bokeh"
        path.mkdir(parents=True)
        (path / "switcher.json").write_text(content)
    monkeypatch.chdir(tmp_path)

    result = checks.check_docs_version_config(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Could not check docs versions config"
    assert result.details


@pytest.mark.parametrize(
    ("exists", "expected"),
    [(True, ActionResult.PASS), (False, ActionResult.FAIL)],
)
def test_check_release_notes_present(
    monkeypatch: pytest.MonkeyPatch,
    exists: bool,
    expected: ActionResult,
) -> None:
    monkeypatch.setattr(checks.os.path, "exists", lambda path: exists)

    result = checks.check_release_notes_present(Config("4.0.0"), RecordingSystem())

    assert result.kind is expected
    assert "4.0.0.rst" in result.message


@pytest.mark.parametrize(
    ("tags", "version", "expected"),
    [
        ("3.10.0\n", "4.0.0", ActionResult.PASS),
        ("4.0.0\n3.10.0\n", "4.0.0", ActionResult.FAIL),
        ("'4.0.0'\n", "4.0.0", ActionResult.FAIL),
    ],
)
def test_check_release_tag_available(tags: str, version: str, expected: ActionResult) -> None:
    command = "git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags"
    system = RecordingSystem(outputs={command: tags})

    assert checks.check_release_tag_is_available(Config(version), system).kind is expected


@pytest.mark.parametrize(
    ("tags", "version", "expected"),
    [
        ("3.10.0\n", "4.0.0", ActionResult.PASS),
        ("4.0.0rc1\n", "4.0.0", ActionResult.PASS),
        ("4.0.0\n", "4.0.0rc1", ActionResult.FAIL),
        ("4.0.1\n", "4.0.0", ActionResult.FAIL),
        ("4.1.0\n", "4.0.0", ActionResult.PASS),
    ],
)
def test_check_version_order(tags: str, version: str, expected: ActionResult) -> None:
    command = "git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags"
    system = RecordingSystem(outputs={command: tags})

    assert checks.check_version_order(Config(version), system).kind is expected


def test_check_version_order_distinguishes_minor_version_prefixes() -> None:
    command = "git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags"
    system = RecordingSystem(outputs={command: "3.10.0\n3.1.0\n"})

    result = checks.check_version_order(Config("3.1.1"), system)

    assert result.kind is ActionResult.PASS


def test_check_version_order_reports_command_failure(config: Config) -> None:
    command = "git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags"
    system = RecordingSystem(failures={command: ("git error",)})

    result = checks.check_version_order(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.message == "Could not compare tag version order"
    assert result.details == ("git error",)


@pytest.mark.parametrize(
    ("branches", "expected"),
    [("", ActionResult.PASS), ("  staging-4.0.0\n", ActionResult.FAIL)],
)
def test_check_staging_branch_available(config: Config, branches: str, expected: ActionResult) -> None:
    system = RecordingSystem(outputs={"git branch --list staging-4.0.0": branches})

    assert checks.check_staging_branch_is_available(config, system).kind is expected


def test_check_staging_branch_available_reports_command_failure(config: Config) -> None:
    command = "git branch --list staging-4.0.0"
    system = RecordingSystem(failures={command: ("git error",)})

    result = checks.check_staging_branch_is_available(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.message == "Could not check staging branch availability"
    assert result.details == ("git error",)


def test_check_milestone_labels_uses_release_milestone(config: Config) -> None:
    system = RecordingSystem()

    result = checks.check_milestone_labels(config, system)

    assert result.kind is ActionResult.PASS
    assert "BEP-1 compliant" in result.message
    assert system.commands == [
        "python -m tools.milestone 4.0 --check-only --allow-closed",
    ]


def test_check_milestone_labels_reports_command_failure(config: Config) -> None:
    command = "python -m tools.milestone 4.0 --check-only --allow-closed"
    system = RecordingSystem(failures={command: ("invalid milestone item",)})

    result = checks.check_milestone_labels(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("invalid milestone item",)
