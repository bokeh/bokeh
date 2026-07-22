from __future__ import annotations

# Standard library imports
import json
from pathlib import Path

# External imports
import pytest
from release import build
from release.config import Config
from release.enums import ActionResult
from release.system import System

# Bokeh imports
# Bokeh test imports
from tests.unit.release._support import RecordingSystem


@pytest.mark.parametrize(
    ("func", "command", "environment"),
    [
        (build.build_bokehjs, "node make build", {}),
        (build.build_npm_packages, "npm pack", {}),
        (build.build_conda_packages, "conda build conda/recipe --no-test", {"VERSION": "4.0.0"}),
        (
            build.build_docs,
            "make clean all SPHINXOPTS=-v",
            {"BOKEH_DOCS_CDN": "4.0.0", "BOKEH_DOCS_VERSION": "4.0.0"},
        ),
        (build.build_pip_packages, "python -m build .", {"BOKEHJS_ACTION": "install"}),
        (build.dev_install_bokehjs, "pip install -e .", {"BOKEHJS_ACTION": "install"}),
        (build.install_bokehjs, "pip install .", {"BOKEHJS_ACTION": "install"}),
        (build.npm_install, "npm ci", {}),
        (
            build.verify_pip_install_from_sdist,
            "bash scripts/ci/verify_pip_install_from_sdist.sh",
            {"VERSION": "4.0.0"},
        ),
        (
            build.verify_pip_install_using_sdist,
            "bash scripts/ci/verify_pip_install_using_sdist.sh",
            {"VERSION": "4.0.0"},
        ),
        (
            build.verify_pip_install_using_wheel,
            "bash scripts/ci/verify_pip_install_using_wheel.sh",
            {"VERSION": "4.0.0"},
        ),
        (build.verify_conda_install, "bash scripts/ci/verify_conda_install.sh", {"VERSION": "4.0.0"}),
    ],
)
def test_command_build_steps(config, func, command, environment):
    system = RecordingSystem()

    result = func(config, system)

    assert result.kind is ActionResult.PASS
    assert (command, environment) in system.calls


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (build.build_bokehjs, "node make build"),
        (build.build_npm_packages, "npm pack"),
        (build.build_conda_packages, "conda build conda/recipe --no-test"),
        (build.build_docs, "make clean all SPHINXOPTS=-v"),
        (build.build_pip_packages, "python -m build ."),
        (build.dev_install_bokehjs, "pip install -e ."),
        (build.install_bokehjs, "pip install ."),
        (build.npm_install, "npm ci"),
        (build.verify_pip_install_from_sdist, "bash scripts/ci/verify_pip_install_from_sdist.sh"),
        (build.verify_pip_install_using_sdist, "bash scripts/ci/verify_pip_install_using_sdist.sh"),
        (build.verify_pip_install_using_wheel, "bash scripts/ci/verify_pip_install_using_wheel.sh"),
        (build.verify_conda_install, "bash scripts/ci/verify_conda_install.sh"),
    ],
)
def test_command_build_steps_report_failure(config, func, command):
    system = RecordingSystem(failures={command: ("command failed",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("command failed",)


def test_directory_build_steps_use_expected_working_directories(config):
    cases = [
        (build.build_bokehjs, [("cd", "bokehjs"), ("cd", "..")]),
        (build.build_npm_packages, [("cd", "bokehjs"), ("cd", "..")]),
        (build.build_docs, [("cd", "docs/bokeh"), ("cd", "../..")]),
        (build.npm_install, [("cd", "bokehjs"), ("cd", "..")]),
    ]

    for func, expected in cases:
        system = RecordingSystem()
        func(config, system)
        assert system.directories == expected


def test_pack_deployment_tarball_collects_all_artifacts(config):
    system = RecordingSystem()

    result = build.pack_deployment_tarball(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "mkdir deployment-4.0.0",
        "cp bokehjs/bokeh-bokehjs-4.0.0.tgz deployment-4.0.0",
        "cp $CONDA_PREFIX/conda-bld/noarch/bokeh-4.0.0-py_0.tar.bz2 deployment-4.0.0",
        "cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0",
        "cp dist/bokeh-4.0.0-py3-none-any.whl deployment-4.0.0",
        "mkdir deployment-4.0.0/bokehjs",
        "cp -r bokehjs/build deployment-4.0.0/bokehjs",
        "mkdir -p deployment-4.0.0/docs/bokeh/build",
        "cp -r docs/bokeh/build/html deployment-4.0.0/docs/bokeh/build",
        "cp -r docs/bokeh/switcher.json deployment-4.0.0/docs/bokeh",
        "tar czvf deployment-4.0.0.tgz deployment-4.0.0",
    ]


def test_pack_deployment_tarball_stops_on_first_failure(config):
    system = RecordingSystem(failures={"cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0": ("missing",)})

    result = build.pack_deployment_tarball(config, system)

    assert result.kind is ActionResult.FAIL
    assert system.commands[-1] == "cp dist/bokeh-4.0.0.tar.gz deployment-4.0.0"


def make_bokehjs_package_files(root: Path, *, lockfile_version: int = 3) -> list[str]:
    filenames = [
        "package.json",
        "make/package.json",
        "src/compiler/package.json",
        "src/lib/package.json",
        "src/server/package.json",
        "test/package.json",
    ]
    for filename in filenames:
        path = root / "bokehjs" / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"name": "package", "version": "0.0.0"}))

    lock = root / "bokehjs" / "package-lock.json"
    lock.write_text(json.dumps({
        "lockfileVersion": lockfile_version,
        "version": "0.0.0",
        "packages": {
            "": {"name": "@bokeh/bokehjs", "version": "0.0.0"},
            "make": {"name": "@bokeh/make", "version": "0.0.0"},
            "node_modules/library": {"name": "library", "version": "1.0.0"},
        },
    }))
    return [*filenames, "package-lock.json"]


def test_update_bokehjs_versions_updates_every_workspace(tmp_path, monkeypatch):
    filenames = make_bokehjs_package_files(tmp_path)
    monkeypatch.chdir(tmp_path)
    config = Config("4.0.0rc2")

    result = build.update_bokehjs_versions(config, System(dry_run=True))

    assert result.kind is ActionResult.PASS
    assert config.modified == {f"bokehjs/{filename}" for filename in filenames}
    for filename in filenames[:-1]:
        assert json.loads((tmp_path / "bokehjs" / filename).read_text())["version"] == "4.0.0-rc.2"
    lock = json.loads((tmp_path / "bokehjs" / "package-lock.json").read_text())
    assert lock["version"] == "4.0.0-rc.2"
    assert lock["packages"][""]["version"] == "4.0.0-rc.2"
    assert lock["packages"]["make"]["version"] == "4.0.0-rc.2"
    assert lock["packages"]["node_modules/library"]["version"] == "1.0.0"


def test_update_bokehjs_versions_rejects_old_lockfile(tmp_path, monkeypatch):
    make_bokehjs_package_files(tmp_path, lockfile_version=2)
    monkeypatch.chdir(tmp_path)

    result = build.update_bokehjs_versions(Config("4.0.0"), System(dry_run=True))

    assert result.kind is ActionResult.FAIL
    assert "Expected lock file v3" in result.details


def test_update_switcher_json_writes_latest_and_dev_entries(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["4.0.0", "4.1.0.dev1"])
    config = Config("4.0.0")

    result = build.update_switcher_json(config, RecordingSystem(), major_versions=3)

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert switcher[0] == {
        "name": "4.0.0 (latest)",
        "preferred": True,
        "url": "https://docs.bokeh.org/en/latest/",
        "version": "4.0.0",
    }
    assert switcher[-1] == {
        "name": "dev (4.1.0.dev1)",
        "url": "https://docs.bokeh.org/en/dev-4.1/",
        "version": "dev-4.1",
    }
    assert config.modified == {"docs/bokeh/switcher.json"}


def test_update_switcher_json_includes_untagged_release(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["3.9.1"])

    result = build.update_switcher_json(Config("4.0.0"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert switcher[0] == {
        "name": "4.0.0 (latest)",
        "preferred": True,
        "url": "https://docs.bokeh.org/en/latest/",
        "version": "4.0.0",
    }


def test_update_switcher_json_keeps_new_major_prerelease_and_stable_history(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: ["3.10.0.dev6", "3.9.1", "3.8.2", "3.7.3"],
    )

    result = build.update_switcher_json(Config("4.0.0.dev1"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == ["3.9.1", "3.8.2", "3.7.3", "dev-4.0"]
    assert switcher[-1]["name"] == "dev (4.0.0.dev1)"


def test_update_switcher_json_keeps_previous_major_after_full_release(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: [
            "3.10.0.dev6",
            "3.9.1",
            "3.8.2",
            "3.7.3",
            "2.4.3",
        ],
    )

    result = build.update_switcher_json(
        Config("4.0.0"),
        RecordingSystem(),
        minor_versions=3,
    )

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == ["4.0.0", "3.9.1", "3.8.2", "3.7.3"]
    assert all(not entry["version"].startswith("dev-") for entry in switcher)


def test_update_switcher_json_rejects_non_version_tags(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    (tmp_path / "docs" / "bokeh").mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["not-a-version"])

    result = build.update_switcher_json(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Switcher.json update failed"
    assert result.details == ("Got invalid version string 'not-a-version'.",)


def test_update_switcher_json_reports_write_failure(tmp_path, monkeypatch):
    release_dir = tmp_path / "release"
    release_dir.mkdir()
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["4.0.0"])
    config = Config("4.0.0")

    result = build.update_switcher_json(config, RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Switcher.json update failed"
    assert result.details
    assert config.modified == set()


def test_update_changelog_tracks_modified_file(config):
    system = RecordingSystem()

    result = build.update_changelog(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["python milestone.py -a 4.0"]
    assert system.directories == [("pushd", "scripts"), ("popd", None)]
    assert config.modified == {"docs/CHANGELOG"}


def test_update_hash_manifest_tracks_new_file(config):
    system = RecordingSystem()

    result = build.update_hash_manifest(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["python sri.py 4.0.0"]
    assert config.new == {"src/bokeh/_sri/4.0.0.json"}
