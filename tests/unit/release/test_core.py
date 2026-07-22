from __future__ import annotations

# Standard library imports
import os
import pickle

# External imports
import pytest
from release import ui
from release.action import FAILED, PASSED, SKIPPED
from release.config import Config
from release.enums import ActionResult, VersionType
from release.logger import LOG, Log, Scrubber
from release.pipeline import Pipeline, is_check
from release.system import System
from release.util import load_config, save_config, skip_for_prerelease

# Bokeh imports
# Bokeh test imports
from tests.unit.release._support import AbortCalled, RecordingSystem


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
def test_config_parses_versions(version, base, extension, js_version, version_type):
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
def test_config_rejects_unsupported_versions(version):
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
def test_config_release_properties(version, release_level, base_branch, milestone, prerelease):
    config = Config(version)

    assert config.release_level == release_level
    assert config.base_branch == base_branch
    assert config.milestone_version == milestone
    assert config.staging_branch == f"staging-{version}"
    assert config.prerelease is prerelease


def test_config_tracks_new_and_modified_files():
    config = Config("4.0.0")

    config.add_new("new.json")
    config.add_new("new.json")
    config.add_modified("old.json")
    config.add_modified("old.json")

    assert config.new == {"new.json"}
    assert config.modified == {"old.json"}


def test_config_registers_and_protects_secrets(capsys):
    config = Config("4.0.0")

    config.add_secret("TOKEN", "very-secret")
    LOG.record("token=very-secret")

    assert config.secrets == {"TOKEN": "very-secret"}
    assert "very-secret" not in capsys.readouterr().out
    with pytest.raises(RuntimeError):
        config.add_secret("TOKEN", "other")


@pytest.mark.parametrize(
    ("result_type", "kind", "marker"),
    [
        (PASSED, ActionResult.PASS, "[PASS]"),
        (FAILED, ActionResult.FAIL, "[FAIL]"),
        (SKIPPED, ActionResult.SKIP, "[SKIP]"),
    ],
)
def test_action_results(result_type, kind, marker):
    result = result_type("message", details=("first", "second"))

    assert result.kind is kind
    assert marker in str(result)
    assert "message" in str(result)
    assert repr(result) == f"{result_type.__name__}('message', details=...)"


@pytest.mark.parametrize("formatter", [ui.failed, ui.passed])
def test_ui_result_details(formatter):
    assert formatter("summary", ("one", "two")).endswith("summary\n    one\n    two")


def test_ui_skipped_ignores_details():
    assert "details" not in ui.skipped("summary", ("details",))


def test_ui_banner_and_task():
    banner = ui.banner(str.upper, "release")

    assert "release" in banner
    assert banner.count("=" * 80) == 2
    assert ui.task("work") == "\n------ work"


def test_scrubber_repr_length_and_clean():
    scrubber = Scrubber("secret", name="TOKEN")

    assert len(scrubber) == 6
    assert repr(scrubber) == "Scrubber(..., name='TOKEN')"
    assert scrubber.clean("a secret value") == "a <xxxxx> value"


def test_scrubber_custom_replacement_repr():
    scrubber = Scrubber("secret", name="TOKEN", replacement="[redacted]")

    assert "replacement='[redacted]'" in repr(scrubber)
    assert scrubber.clean("secret") == "[redacted]"


def test_log_records_multiline_text_and_ranges(capsys):
    log = Log()

    first = log.record("one\ntwo")
    second = log.record("three")

    assert first == (0, 2)
    assert second == (2, 3)
    assert log.dump() == "one\ntwo\nthree"
    assert log.dump(start=1, end=3) == "two\nthree"
    assert capsys.readouterr().out == "one\ntwo\nthree\n"


def test_log_scrubs_before_printing_and_dumping(capsys):
    log = Log()
    log.add_scrubber(Scrubber("secret", name="TOKEN"))

    log.record("secret")
    log._record.append("secret")

    assert capsys.readouterr().out == "<xxxxx>\n"
    assert log.dump() == "<xxxxx>\n<xxxxx>"


def test_log_filters_ansi_and_can_preserve_it():
    log = Log()
    log.record("\x1b[31mred\x1b[0m")

    assert log.dump() == "red"
    assert log.dump(filter_ansi=False) == "\x1b[31mred\x1b[0m"


def test_log_clear_only_clears_records():
    log = Log()
    log.add_scrubber(Scrubber("secret", name="TOKEN"))
    log.record("before")

    log.clear()
    log.record("secret")

    assert log.dump() == "<xxxxx>"


def test_save_and_load_config(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    config = Config("4.0.0")
    config.add_modified("file")

    save_config(config)
    loaded = load_config()

    assert loaded.version == "4.0.0"
    assert loaded.modified == {"file"}
    with open("bokeh-build-config.pickle", "rb") as file:
        assert isinstance(pickle.load(file), Config)


def test_skip_for_prerelease_marks_function():
    def step(config, system):
        return PASSED("ok")

    assert skip_for_prerelease(step) is step
    assert step.skip_for_prerelease is True


def test_system_run_returns_output_and_passes_environment(monkeypatch):
    observed = {}

    def run(cmd, **kw):
        observed.update(cmd=cmd, **kw)
        return type("Result", (), {"returncode": 0, "stdout": "output\n"})()

    monkeypatch.setattr("release.system.stdlib_run", run)

    assert System().run("command", CUSTOM="value") == "output\n"
    assert observed["cmd"] == "command"
    assert observed["shell"] is True
    assert observed["env"]["CUSTOM"] == "value"


def test_system_run_raises_each_output_line(monkeypatch):
    result = type("Result", (), {"returncode": 2, "stdout": "first\nsecond\n"})()
    monkeypatch.setattr("release.system.stdlib_run", lambda *args, **kw: result)

    with pytest.raises(RuntimeError) as error:
        System().run("bad")

    assert error.value.args == ("first", "second")


def test_system_dry_run_does_not_spawn(monkeypatch):
    monkeypatch.setattr("release.system.stdlib_run", lambda *args, **kw: pytest.fail("spawned"))

    assert System(dry_run=True).run("command") == ""


def test_system_directory_stack(tmp_path, monkeypatch):
    child = tmp_path / "child"
    child.mkdir()
    monkeypatch.chdir(tmp_path)
    system = System()

    system.pushd(str(child))
    assert os.getcwd() == str(child)
    system.popd()
    assert os.getcwd() == str(tmp_path)


def test_system_abort_raises_system_exit():
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
def test_is_check_uses_step_name(name, expected):
    def step(config, system):
        return PASSED("ok")

    step.__name__ = name
    assert is_check(step) is expected


def test_pipeline_executes_steps_in_order():
    called = []

    def first(config, system):
        called.append("first")
        return PASSED("first")

    def second(config, system):
        called.append("second")
        return PASSED("second")

    Pipeline((first, second), Config("4.0.0"), RecordingSystem()).execute()

    assert called == ["first", "second"]


def test_pipeline_skips_checks_for_dry_run():
    def check_never(config, system):
        pytest.fail("check was called")

    Pipeline((check_never,), Config("4.0.0"), RecordingSystem(dry_run=True)).execute()

    assert "skipped for dry run" in LOG.dump()


def test_pipeline_skips_marked_prerelease_steps():
    @skip_for_prerelease
    def never(config, system):
        pytest.fail("step was called")

    Pipeline((never,), Config("4.0.0rc1"), RecordingSystem()).execute()

    assert "skipped for pre-releases" in LOG.dump()


def test_pipeline_aborts_on_first_failure():
    called = []

    def failing(config, system):
        called.append("failing")
        return FAILED("bad")

    def never(config, system):
        called.append("never")
        return PASSED("ok")

    system = RecordingSystem()
    with pytest.raises(AbortCalled):
        Pipeline((failing, never), Config("4.0.0"), system).execute()

    assert called == ["failing"]
    assert system.aborted is True
