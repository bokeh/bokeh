from __future__ import annotations

# Standard library imports
import os
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

# External imports
import pytest
from release import ui
from release.action import (
    FAILED,
    PASSED,
    SKIPPED,
    ActionReturn,
)
from release.config import Config
from release.enums import ActionResult, VersionType
from release.pipeline import Pipeline, is_check
from release.system import System
from release.util import skip_for_prerelease

# Bokeh imports
# Bokeh test imports
from tests.codebase._release_support import AbortCalled, RecordingSystem


@pytest.mark.parametrize(
    ("version", "base", "extension", "js_version", "version_type"),
    [
        ("4.0.0", "4.0.0", None, "4.0.0", VersionType.FULL),
        ("4.0.1", "4.0.1", None, "4.0.1", VersionType.FULL),
        ("4.0.0rc1", "4.0.0", "rc1", "4.0.0-rc.1", VersionType.RC),
        ("4.0.0rc12", "4.0.0", "rc12", "4.0.0-rc.12", VersionType.RC),
        ("4.0.0.dev1", "4.0.0", ".dev1", "4.0.0-dev.1", VersionType.DEV),
        ("10.20.30.dev42", "10.20.30", ".dev42", "10.20.30-dev.42", VersionType.DEV),
    ],
)
def test_config_parses_versions(
    version: str,
    base: str,
    extension: str | None,
    js_version: str,
    version_type: VersionType,
) -> None:
    config = Config(version)

    assert config.base_version == base
    assert config.ext == extension
    assert config.js_version == js_version
    assert config.version_type is version_type


@pytest.mark.parametrize(
    "version",
    [
        "",
        "4",
        "4.0",
        "4.0.0.0",
        "v4.0.0",
        "4.0.0a1",
        "4.0.0b1",
        "4.0.0-rc1",
        "4.0.0+local",
        "4.0.0.dev",
        "4.0.0rc",
        "release-4.0.0",
    ],
)
def test_config_rejects_unsupported_versions(version: str) -> None:
    with pytest.raises(ValueError, match="Invalid version"):
        Config(version)


@pytest.mark.parametrize(
    ("version", "release_level", "base_branch", "milestone", "prerelease"),
    [
        ("4.0.0", "4.0", "branch-4.0", "4.0", False),
        ("4.0.1", "4.0", "branch-4.0", "4.0.1", False),
        ("4.0.0rc2", "4.0", "branch-4.0", "4.0", True),
        ("4.1.0.dev3", "4.1", "branch-4.1", "4.1", True),
    ],
)
def test_config_release_properties(
    version: str,
    release_level: str,
    base_branch: str,
    milestone: str,
    prerelease: bool,
) -> None:
    config = Config(version)

    assert config.release_level == release_level
    assert config.base_branch == base_branch
    assert config.milestone_version == milestone
    assert config.staging_branch == f"staging-{version}"
    assert config.prerelease is prerelease


def test_config_tracks_new_and_modified_files() -> None:
    config = Config("4.0.0")

    config.add_new("new.json")
    config.add_new("new.json")
    config.add_modified("old.json")
    config.add_modified("old.json")

    assert config.new == {"new.json"}
    assert config.modified == {"old.json"}


@pytest.mark.parametrize(
    ("result_type", "kind", "marker"),
    [
        (PASSED, ActionResult.PASS, "[PASS]"),
        (FAILED, ActionResult.FAIL, "[FAIL]"),
        (SKIPPED, ActionResult.SKIP, "[SKIP]"),
    ],
)
def test_action_results(result_type: type[ActionReturn], kind: ActionResult, marker: str) -> None:
    result = result_type("message", details=("first", "second"))

    assert result.kind is kind
    assert marker in str(result)
    assert "message" in str(result)
    assert repr(result) == f"{result_type.__name__}('message', details=...)"


@pytest.mark.parametrize("formatter", [ui.failed, ui.passed])
def test_ui_result_details(formatter: Callable[[str, Sequence[str] | None], str]) -> None:
    assert formatter("summary", ("one", "two")).endswith("summary\n    one\n    two")


def test_ui_skipped_ignores_details() -> None:
    assert "details" not in ui.skipped("summary", ("details",))


def test_ui_banner_and_task() -> None:
    banner = ui.banner(str.upper, "release")

    assert "release" in banner
    assert banner.count("=" * 80) == 2
    assert ui.task("work") == "\n------ work"


def test_skip_for_prerelease_marks_function() -> None:
    def step(config: Config, system: System) -> ActionReturn:
        return PASSED("ok")

    assert skip_for_prerelease(step) is step
    assert getattr(step, "skip_for_prerelease") is True


def test_system_run_returns_output_and_passes_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    observed: dict[str, Any] = {}

    def run(cmd: str, **kw: Any) -> Any:
        observed.update(cmd=cmd, **kw)
        return type("Result", (), {"returncode": 0, "stdout": "output\n"})()

    monkeypatch.setattr("release.system.stdlib_run", run)

    assert System().run("command", CUSTOM="value") == "output\n"
    assert observed["cmd"] == "command"
    assert observed["shell"] is True
    assert observed["env"]["CUSTOM"] == "value"


def test_system_run_raises_each_output_line(monkeypatch: pytest.MonkeyPatch) -> None:
    result = type("Result", (), {"returncode": 2, "stdout": "first\nsecond\n"})()
    monkeypatch.setattr("release.system.stdlib_run", lambda *args, **kw: result)

    with pytest.raises(RuntimeError) as error:
        System().run("bad")

    assert error.value.args == ("first", "second")


def test_system_dry_run_does_not_spawn(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("release.system.stdlib_run", lambda *args, **kw: pytest.fail("spawned"))

    assert System(dry_run=True).run("command") == ""


def test_system_directory_stack(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    child = tmp_path / "child"
    child.mkdir()
    monkeypatch.chdir(tmp_path)
    system = System()

    system.pushd(str(child))
    assert os.getcwd() == str(child)
    system.popd()
    assert os.getcwd() == str(tmp_path)


def test_system_abort_raises_system_exit() -> None:
    with pytest.raises(SystemExit) as error:
        System().abort()

    assert error.value.code == 1


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("check_something", True),
        ("verify_something", True),
        ("build_something", False),
        ("verification_step", False),
    ],
)
def test_is_check_uses_step_name(name: str, expected: bool) -> None:
    def step(config: Config, system: System) -> ActionReturn:
        return PASSED("ok")

    step.__name__ = name
    assert is_check(step) is expected


def test_pipeline_executes_steps_in_order() -> None:
    called: list[str] = []

    def first(config: Config, system: System) -> ActionReturn:
        called.append("first")
        return PASSED("first")

    def second(config: Config, system: System) -> ActionReturn:
        called.append("second")
        return PASSED("second")

    Pipeline((first, second), Config("4.0.0"), RecordingSystem()).execute()

    assert called == ["first", "second"]


def test_pipeline_skips_checks_for_dry_run(caplog: pytest.LogCaptureFixture) -> None:
    def check_never(config: Config, system: System) -> ActionReturn:
        pytest.fail("check was called")

    with caplog.at_level("INFO", logger="release"):
        Pipeline((check_never,), Config("4.0.0"), RecordingSystem(dry_run=True)).execute()

    assert "skipped for dry run" in caplog.text


def test_pipeline_skips_marked_prerelease_steps(caplog: pytest.LogCaptureFixture) -> None:
    @skip_for_prerelease
    def never(config: Config, system: System) -> ActionReturn:
        pytest.fail("step was called")

    with caplog.at_level("INFO", logger="release"):
        Pipeline((never,), Config("4.0.0rc1"), RecordingSystem()).execute()

    assert "skipped for pre-releases" in caplog.text


def test_pipeline_aborts_on_first_failure() -> None:
    called: list[str] = []

    def failing(config: Config, system: System) -> ActionReturn:
        called.append("failing")
        return FAILED("bad")

    def never(config: Config, system: System) -> ActionReturn:
        called.append("never")
        return PASSED("ok")

    system = RecordingSystem()
    with pytest.raises(AbortCalled):
        Pipeline((failing, never), Config("4.0.0"), system).execute()

    assert called == ["failing"]
    assert system.aborted is True
