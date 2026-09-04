from __future__ import annotations

# Standard library imports
import json
from pathlib import Path

# External imports
import pytest
import tomllib
import yaml
from packaging.requirements import Requirement

# Bokeh imports
# Bokeh test imports
from tests.support.util.project import TOP_PATH
from tests.tools.release._support import RecordingSystem
from tools.release import build
from tools.release.config import Config
from tools.release.enums import ActionResult
from tools.release.npm import NPM_PACKAGES
from tools.release.pipeline import StepType
from tools.release.system import System


def test_conda_recipe_dependencies_match_project_dependencies() -> None:
    with open(TOP_PATH / "pyproject.toml", "rb") as f:
        project_dependencies = tomllib.load(f)["project"]["dependencies"]
    with open(TOP_PATH / "conda/recipe/recipe.yaml") as f:
        conda_dependencies = yaml.safe_load(f)["requirements"]["run"]

    def constraints(requirements: list[str]) -> dict[str, str]:
        parsed = (Requirement(requirement) for requirement in requirements)
        return {requirement.name.lower(): str(requirement.specifier) for requirement in parsed}

    actual = constraints(conda_dependencies)
    assert actual.pop("python") == ">=3.12"
    assert actual == constraints(project_dependencies)


@pytest.mark.parametrize(
    ("func", "command", "environment"),
    [
        (build.build_bokehjs, "node make build", {}),
        (build.build_jupyter, "bash tools/ci/build_jupyter.sh", {}),
        (build.build_npm_packages, "npm pack --workspace frameworks/web-component", {}),
        (
            build.build_conda_package,
            "rattler-build build --recipe conda/recipe --channel conda-forge "
            "--output-dir dist/conda --package-format tar-bz2 --test skip",
            {"VERSION": "4.0.0"},
        ),
        (
            build.build_docs,
            "make clean all SPHINXOPTS=-v",
            {"BOKEH_DOCS_CDN": "4.0.0", "BOKEH_DOCS_VERSION": "4.0.0"},
        ),
        (build.build_pip_packages, "python -m build .", {"BOKEHJS_ACTION": "install"}),
        (build.dev_install_bokehjs, "python -m pip install --no-deps -e .", {"BOKEHJS_ACTION": "install"}),
        (build.install_bokehjs, "python -m pip install --no-deps .", {"BOKEHJS_ACTION": "install"}),
        (build.npm_install, "npm ci", {}),
        (
            build.verify_pip_install_from_sdist,
            "bash tools/ci/verify_pip_install_from_sdist.sh",
            {"VERSION": "4.0.0"},
        ),
        (
            build.verify_pip_install_using_sdist,
            "bash tools/ci/verify_pip_install_using_sdist.sh",
            {"VERSION": "4.0.0"},
        ),
        (
            build.verify_pip_install_using_wheel,
            "bash tools/ci/verify_pip_install_using_wheel.sh",
            {"VERSION": "4.0.0"},
        ),
        (
            build.verify_conda_package,
            "rattler-build test --package-file dist/conda/noarch/bokeh-4.0.0-py_0.tar.bz2 --channel conda-forge",
            {},
        ),
    ],
)
def test_command_build_steps(
    config: Config,
    func: StepType,
    command: str,
    environment: dict[str, str],
) -> None:
    system = RecordingSystem()

    result = func(config, system)

    assert result.kind is ActionResult.PASS
    assert (command, environment) in system.calls


@pytest.mark.parametrize(
    ("func", "command"),
    [
        (build.build_bokehjs, "node make build"),
        (build.build_jupyter, "bash tools/ci/build_jupyter.sh"),
        (build.build_npm_packages, "npm pack --workspace frameworks/web-component"),
        (
            build.build_conda_package,
            "rattler-build build --recipe conda/recipe --channel conda-forge "
            "--output-dir dist/conda --package-format tar-bz2 --test skip",
        ),
        (build.build_docs, "make clean all SPHINXOPTS=-v"),
        (build.build_pip_packages, "python -m build ."),
        (build.dev_install_bokehjs, "python -m pip install --no-deps -e ."),
        (build.install_bokehjs, "python -m pip install --no-deps ."),
        (build.npm_install, "npm ci"),
        (build.verify_pip_install_from_sdist, "bash tools/ci/verify_pip_install_from_sdist.sh"),
        (build.verify_pip_install_using_sdist, "bash tools/ci/verify_pip_install_using_sdist.sh"),
        (build.verify_pip_install_using_wheel, "bash tools/ci/verify_pip_install_using_wheel.sh"),
        (
            build.verify_conda_package,
            "rattler-build test --package-file dist/conda/noarch/bokeh-4.0.0-py_0.tar.bz2 --channel conda-forge",
        ),
    ],
)
def test_command_build_steps_report_failure(config: Config, func: StepType, command: str) -> None:
    system = RecordingSystem(failures={command: ("command failed",)})

    result = func(config, system)

    assert result.kind is ActionResult.FAIL
    assert result.details == ("command failed",)


def test_directory_build_steps_use_expected_working_directories(config: Config) -> None:
    cases = [
        (build.build_bokehjs, [("cd", "bokehjs"), ("cd", "..")]),
        (build.build_jupyter, []),
        (build.build_npm_packages, [("cd", "bokehjs"), ("cd", "..")]),
        (build.build_docs, [("cd", "docs/bokeh"), ("cd", "../..")]),
        (build.npm_install, [("cd", "bokehjs"), ("cd", "..")]),
    ]

    for func, expected in cases:
        system = RecordingSystem()
        func(config, system)
        assert system.directories == expected


def test_jupyter_build_reinstalls_and_tracks_generated_outputs(config: Config) -> None:
    system = RecordingSystem()

    result = build.build_jupyter(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["bash tools/ci/build_jupyter.sh"]
    assert config.modified == {
        "src/bokeh/jupyter/anywidget.js",
        "src/bokeh/jupyter/labextension",
    }


def test_build_npm_packages_packs_every_public_package_in_dependency_order(config: Config) -> None:
    system = RecordingSystem()

    result = build.build_npm_packages(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == [
        "npm pack",
        "npm pack --workspace frameworks/base",
        "npm pack --workspace frameworks/angular",
        "npm pack --workspace frameworks/react",
        "npm pack --workspace frameworks/svelte",
        "npm pack --workspace frameworks/vue",
        "npm pack --workspace frameworks/web-component",
    ]


def test_npm_package_manifest_matches_public_package_metadata() -> None:
    for package in NPM_PACKAGES:
        metadata = json.loads((TOP_PATH / "bokehjs" / package.workspace / "package.json").read_text())
        assert metadata["name"] == package.name


def make_bokehjs_package_files(root: Path, *, lockfile_version: int = 3) -> list[str]:
    filenames = [
        "package.json",
        "make/package.json",
        "src/compiler/package.json",
        "src/lib/package.json",
        "src/server/package.json",
        "test/package.json",
        "frameworks/base/package.json",
        "frameworks/react/package.json",
        "examples/frameworks/react-vite/package.json",
    ]
    for filename in filenames:
        path = root / "bokehjs" / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        name = {
            "frameworks/base/package.json": "@bokeh/framework",
            "frameworks/react/package.json": "@bokeh/react",
            "examples/frameworks/react-vite/package.json": "@bokeh-example/react-vite",
        }.get(filename, "@bokeh/internal")
        content: dict[str, object] = {"name": name, "version": "0.0.0"}
        if filename == "package.json":
            content["workspaces"] = [filename.removesuffix("/package.json") for filename in filenames[1:]]
        elif filename == "frameworks/base/package.json":
            content["peerDependencies"] = {"@bokeh/bokehjs": ">=0.0.0 <1"}
        elif filename == "frameworks/react/package.json":
            content["dependencies"] = {"@bokeh/framework": "0.0.0"}
        elif filename == "examples/frameworks/react-vite/package.json":
            content["dependencies"] = {"@bokeh/bokehjs": "0.0.0", "@bokeh/react": "0.0.0"}
        path.write_text(json.dumps(content))

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


def test_update_bokehjs_versions_updates_every_workspace(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    filenames = make_bokehjs_package_files(tmp_path)
    monkeypatch.chdir(tmp_path)
    config = Config("4.0.0rc2")

    result = build.update_bokehjs_versions(config, System(dry_run=True))

    assert result.kind is ActionResult.PASS
    assert config.modified == {f"bokehjs/{filename}" for filename in filenames}
    for filename in filenames[:-1]:
        package = json.loads((tmp_path / "bokehjs" / filename).read_text())
        expected = "0.0.0" if package["name"].startswith("@bokeh-example/") else "4.0.0-rc.2"
        assert package["version"] == expected
    base = json.loads((tmp_path / "bokehjs/frameworks/base/package.json").read_text())
    assert base["peerDependencies"]["@bokeh/bokehjs"] == ">=4.0.0-rc.2 <5"
    react = json.loads((tmp_path / "bokehjs/frameworks/react/package.json").read_text())
    assert react["dependencies"]["@bokeh/framework"] == "4.0.0-rc.2"
    example = json.loads((tmp_path / "bokehjs/examples/frameworks/react-vite/package.json").read_text())
    assert example["dependencies"] == {"@bokeh/bokehjs": "4.0.0-rc.2", "@bokeh/react": "4.0.0-rc.2"}
    lock = json.loads((tmp_path / "bokehjs" / "package-lock.json").read_text())
    assert lock["version"] == "4.0.0-rc.2"
    assert lock["packages"][""]["version"] == "4.0.0-rc.2"
    assert lock["packages"]["make"]["version"] == "4.0.0-rc.2"
    assert lock["packages"]["node_modules/library"]["version"] == "1.0.0"


def test_update_bokehjs_versions_rejects_old_lockfile(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    make_bokehjs_package_files(tmp_path, lockfile_version=2)
    monkeypatch.chdir(tmp_path)

    result = build.update_bokehjs_versions(Config("4.0.0"), System(dry_run=True))

    assert result.kind is ActionResult.FAIL
    assert result.details is not None
    assert "Expected lock file v3" in result.details
    assert Path.cwd() == tmp_path


def test_update_and_verify_jupyter_release_frontend(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    frontend = tmp_path / "src" / "bokeh" / "jupyter" / "frontend"
    labextension = frontend.parent / "labextension"
    static = labextension / "static"
    static.mkdir(parents=True)
    frontend.mkdir(parents=True, exist_ok=True)
    (frontend / "package.json").write_text(json.dumps({"name": "@bokeh/bokeh-jupyter", "version": "0.0.0"}))
    (frontend / "package-lock.json").write_text(json.dumps({
        "name": "@bokeh/bokeh-jupyter",
        "version": "0.0.0",
        "lockfileVersion": 3,
        "packages": {"": {"name": "@bokeh/bokeh-jupyter", "version": "0.0.0"}},
    }))
    (frontend.parent / "anywidget.js").write_text("generated")
    (labextension / "package.json").write_text(json.dumps({
        "name": "@bokeh/bokeh-jupyter",
        "version": "4.0.0-rc.2",
        "jupyterlab": {"_build": {"load": "static/remoteEntry.test.js"}},
    }))
    (static / "remoteEntry.test.js").write_text("generated")
    monkeypatch.chdir(tmp_path)
    config = Config("4.0.0rc2")

    result = build.update_jupyter_version(config, RecordingSystem())

    assert result.kind is ActionResult.PASS
    assert json.loads((frontend / "package.json").read_text())["version"] == "4.0.0-rc.2"
    lock = json.loads((frontend / "package-lock.json").read_text())
    assert lock["version"] == "4.0.0-rc.2"
    assert lock["packages"][""]["version"] == "4.0.0-rc.2"
    assert config.modified == {
        "src/bokeh/jupyter/frontend/package.json",
        "src/bokeh/jupyter/frontend/package-lock.json",
    }
    assert build.verify_jupyter_build(config, RecordingSystem()).kind is ActionResult.PASS


def test_verify_jupyter_release_frontend_rejects_stale_generated_version(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    frontend = tmp_path / "src" / "bokeh" / "jupyter" / "frontend"
    labextension = frontend.parent / "labextension"
    (labextension / "static").mkdir(parents=True)
    frontend.mkdir(parents=True, exist_ok=True)
    (frontend / "package.json").write_text(json.dumps({"version": "4.0.0"}))
    (labextension / "package.json").write_text(json.dumps({
        "version": "4.0.0-dev.4",
        "jupyterlab": {"_build": {"load": "static/remoteEntry.test.js"}},
    }))
    (frontend.parent / "anywidget.js").write_text("generated")
    (labextension / "static" / "remoteEntry.test.js").write_text("generated")
    monkeypatch.chdir(tmp_path)

    result = build.verify_jupyter_build(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.details is not None
    assert "source/generated versions" in result.details[0]


def test_update_bokehjs_versions_reports_missing_package_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    make_bokehjs_package_files(tmp_path)
    missing = tmp_path / "bokehjs" / "src" / "lib" / "package.json"
    missing.unlink()
    monkeypatch.chdir(tmp_path)

    result = build.update_bokehjs_versions(Config("4.0.0"), System(dry_run=True))

    assert result.kind is ActionResult.FAIL
    assert "src/lib/package.json" in result.message
    assert result.details
    assert Path.cwd() == tmp_path


def test_update_bokehjs_versions_reports_malformed_package_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    make_bokehjs_package_files(tmp_path)
    malformed = tmp_path / "bokehjs" / "package.json"
    malformed.write_text("not JSON")
    monkeypatch.chdir(tmp_path)

    result = build.update_bokehjs_versions(Config("4.0.0"), System(dry_run=True))

    assert result.kind is ActionResult.FAIL
    assert "package.json" in result.message
    assert result.details
    assert Path.cwd() == tmp_path


def test_update_switcher_json_writes_latest_and_dev_entries(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
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


def test_update_switcher_json_refreshes_dev_name_within_release_level(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    (switcher_dir / "switcher.json").write_text(json.dumps([{
        "name": "dev (3.10.0.dev6)",
        "url": "https://docs.bokeh.org/en/dev-3.10/",
        "version": "dev-3.10",
    }]))
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["3.10.0.dev6", "3.9.1"])

    result = build.update_switcher_json(Config("3.10.0.dev7"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert switcher[-1] == {
        "name": "dev (3.10.0.dev7)",
        "url": "https://docs.bokeh.org/en/dev-3.10/",
        "version": "dev-3.10",
    }


@pytest.mark.parametrize(
    ("version", "release_level"),
    [("3.11.0.dev1", "3.11"), ("4.0.0.dev1", "4.0")],
)
def test_update_switcher_json_moves_dev_entry_for_new_release_level(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    version: str,
    release_level: str,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    (switcher_dir / "switcher.json").write_text(json.dumps([{
        "name": "dev (3.10.0.dev6)",
        "url": "https://docs.bokeh.org/en/dev-3.10/",
        "version": "dev-3.10",
    }]))
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["3.10.0.dev6", "3.9.1"])

    result = build.update_switcher_json(Config(version), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert switcher[-1] == {
        "name": f"dev ({version})",
        "url": f"https://docs.bokeh.org/en/dev-{release_level}/",
        "version": f"dev-{release_level}",
    }


def test_update_switcher_json_keeps_only_latest_dev_release_level(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: ["4.1.0.dev2", "4.0.1rc1", "4.0.0", "3.10.1rc1", "3.10.0"],
    )

    result = build.update_switcher_json(Config("4.0.1rc2"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    dev_entries = [entry for entry in switcher if entry["version"].startswith("dev-")]
    assert result.kind is ActionResult.PASS
    assert dev_entries == [{
        "name": "dev (4.1.0.dev2)",
        "url": "https://docs.bokeh.org/en/dev-4.1/",
        "version": "dev-4.1",
    }]


def test_update_switcher_json_includes_untagged_release(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
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


def test_update_switcher_json_keeps_five_latest_minors_and_one_older_major_for_prerelease(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: [
            "3.9.2",
            "3.8.2",
            "3.7.3",
            "3.6.3",
            "3.5.2",
            "3.4.3",
            "2.4.3",
            "2.3.3",
        ],
    )

    result = build.update_switcher_json(Config("4.0.0.dev1"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == [
        "3.9.2",
        "3.8.2",
        "3.7.3",
        "3.6.3",
        "3.5.2",
        "2.4.3",
        "dev-4.0",
    ]
    assert switcher[-1]["name"] == "dev (4.0.0.dev1)"


def test_update_switcher_json_keeps_five_previous_minors_after_full_release(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: [
            "4.1.0.dev1",
            "3.9.2",
            "3.8.2",
            "3.7.3",
            "3.6.3",
            "3.5.2",
            "3.4.3",
            "2.4.3",
        ],
    )

    result = build.update_switcher_json(Config("4.0.0"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == [
        "4.0.0",
        "3.9.2",
        "3.8.2",
        "3.7.3",
        "3.6.3",
        "3.5.2",
        "dev-4.1",
    ]


def test_update_switcher_json_honors_custom_minor_version_limit(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(
        build,
        "get_tags",
        lambda config, system: ["3.9.2", "3.8.2", "3.7.3", "3.6.3", "2.4.3"],
    )

    result = build.update_switcher_json(
        Config("4.0.0"),
        RecordingSystem(),
        minor_versions=3,
    )

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == ["4.0.0", "3.9.2", "3.8.2", "3.7.3"]


def test_update_switcher_json_rejects_non_version_tags(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    (tmp_path / "docs" / "bokeh").mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["not-a-version"])

    result = build.update_switcher_json(Config("4.0.0"), RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Switcher.json update failed"
    assert result.details == ("Got invalid version string 'not-a-version'.",)


def test_update_switcher_json_normalizes_legacy_dev_tags(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    switcher_dir = tmp_path / "docs" / "bokeh"
    switcher_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["3.0.0dev1", "3.0.0"])

    result = build.update_switcher_json(Config("4.0.0"), RecordingSystem())

    switcher = json.loads((switcher_dir / "switcher.json").read_text())
    assert result.kind is ActionResult.PASS
    assert [entry["version"] for entry in switcher] == ["4.0.0", "3.0.0"]


def test_update_switcher_json_reports_write_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    release_dir = tmp_path / "tools" / "release"
    release_dir.mkdir(parents=True)
    monkeypatch.setattr(build, "__file__", str(release_dir / "build.py"))
    monkeypatch.setattr(build, "get_tags", lambda config, system: ["4.0.0"])
    config = Config("4.0.0")

    result = build.update_switcher_json(config, RecordingSystem())

    assert result.kind is ActionResult.FAIL
    assert result.message == "Switcher.json update failed"
    assert result.details
    assert config.modified == set()


def test_update_changelog_tracks_modified_file(config: Config) -> None:
    system = RecordingSystem()

    result = build.update_changelog(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["python -m tools.milestone -a 4.0"]
    assert system.directories == []
    assert config.modified == {"docs/CHANGELOG"}


def test_update_hash_manifest_tracks_new_file(config: Config) -> None:
    system = RecordingSystem()

    result = build.update_hash_manifest(config, system)

    assert result.kind is ActionResult.PASS
    assert system.commands == ["python -m tools.sri 4.0.0"]
    assert system.directories == []
    assert config.new == {"src/bokeh/_sri/4.0.0.json"}
