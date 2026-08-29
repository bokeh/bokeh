# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

# Standard library imports
import json
import re
from pathlib import Path
from typing import Any, Callable

# External imports
from packaging.version import Version as V

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import ANY_VERSION, Config
from .git import get_tags
from .system import System
from .util import skip_for_prerelease

__all__ = (
    "build_bokehjs",
    "build_conda_package",
    "build_docs",
    "build_pip_packages",
    "dev_install_bokehjs",
    "install_bokehjs",
    "npm_install",
    "update_bokehjs_versions",
    "update_changelog",
    "update_hash_manifest",
    "update_switcher_json",
    "verify_conda_package",
    "verify_pip_install_from_sdist",
    "verify_pip_install_using_sdist",
    "verify_pip_install_using_wheel",
)


def build_bokehjs(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("bokehjs")
        system.run("node make build")
        system.cd("..")
        return PASSED("BokehJS build succeeded")
    except RuntimeError as e:
        return FAILED("BokehJS build did NOT succeed", details=e.args)


def build_npm_packages(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("bokehjs")
        system.run("npm pack")
        system.cd("..")
        return PASSED("npm pack succeeded")
    except RuntimeError as e:
        return FAILED("npm pack did NOT succeed", details=e.args)


def build_conda_package(config: Config, system: System) -> ActionReturn:
    try:
        system.run(
            "rattler-build build --recipe conda/recipe --channel conda-forge "
            "--output-dir dist/conda --package-format tar-bz2 --test skip",
            VERSION=config.version,
        )
        return PASSED("Conda package build succeeded")
    except RuntimeError as e:
        return FAILED("Conda package build did NOT succeed", details=e.args)


def build_docs(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("docs/bokeh")
        system.run("make clean all SPHINXOPTS=-v", BOKEH_DOCS_CDN=config.version, BOKEH_DOCS_VERSION=config.version)
        system.cd("../..")
        return PASSED("Docs build succeeded")
    except RuntimeError as e:
        return FAILED("Docs build did NOT succeed", details=e.args)


def build_pip_packages(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python -m build .", BOKEHJS_ACTION="install")
        return PASSED("pip packages build succeeded")
    except RuntimeError as e:
        return FAILED("pip packages build did NOT succeed", details=e.args)


def dev_install_bokehjs(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python -m pip install --no-deps -e .", BOKEHJS_ACTION="install")
        return PASSED("Bokeh dev install succeeded")
    except RuntimeError as e:
        return FAILED("Bokeh dev install did NOT succeed", details=e.args)


def install_bokehjs(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python -m pip install --no-deps .", BOKEHJS_ACTION="install")
        return PASSED("BokehJS install succeeded")
    except RuntimeError as e:
        return FAILED("BokehJS install did NOT succeed", details=e.args)


def npm_install(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("bokehjs")
        system.run("npm ci")
        system.cd("..")
        return PASSED("npm ci succeeded")
    except RuntimeError as e:
        return FAILED("npm ci did NOT succeed", details=e.args)


def update_bokehjs_versions(config: Config, system: System) -> ActionReturn:
    def update_package_json(content: dict[str, Any]) -> None:
        content["version"] = config.js_version

    def update_package_lock_json(content: dict[str, Any]) -> None:
        assert content["lockfileVersion"] == 3, "Expected lock file v3"
        content["version"] = config.js_version
        for pkg in content["packages"].values():
            if pkg.get("name", "").startswith("@bokeh/"):
                pkg["version"] = config.js_version

    files: dict[str, Callable[[dict[str, Any]], None]] = {
        "package.json": update_package_json,
        "make/package.json": update_package_json,
        "src/compiler/package.json": update_package_json,
        "src/lib/package.json": update_package_json,
        "src/server/package.json": update_package_json,
        "test/package.json": update_package_json,
        "package-lock.json": update_package_lock_json,
    }

    system.pushd("bokehjs")
    try:
        for filename, action in files.items():
            try:
                with open(filename) as f:
                    content = json.load(f)
                action(content)

                with open(filename, "w") as f:
                    json.dump(content, f, indent=2)
                    f.write("\n")
                config.add_modified(f"bokehjs/{filename}")
            except Exception as e:
                return FAILED(f"Unable to update version in file {filename!r}", details=e.args)
    finally:
        system.popd()

    return PASSED(f"Updated version to {config.js_version!r} in files: {list(files.keys())!r}")


def update_switcher_json(
        config: Config,
        system: System,
        major_versions:int=2,
        minor_versions:int=5,
    ) -> ActionReturn:

    switcher_path = Path(__file__).parents[2] / "docs" / "bokeh" / "switcher.json"
    base_url = "https://docs.bokeh.org/en/"

    try:
        tags = []
        for tag in get_tags(config, system):
            try:
                normalized_tag = str(V(tag))
            except ValueError:
                raise ValueError(f"Got invalid version string {tag!r}.")
            if re.match(ANY_VERSION, normalized_tag) is None:
                raise ValueError(f"Got invalid version string {tag!r}.")
            tags.append(normalized_tag)
        if config.version not in tags:
            tags.append(config.version)
        tags.sort(key=V, reverse=True)

        major_counter = 0
        minor_counter = 0
        minor_limit_reached = minor_versions == 0
        switcher_list: list[dict[str, str | bool]] = []
        version_list: set[str] = set()
        major_list: list[str] = []
        latest_stable: str | None = None
        newest_prerelease: tuple[str, str] | None = None
        for tag in tags:
            m = re.match(ANY_VERSION, tag)
            assert m is not None
            major = m[2]
            minor = m[3]
            dev = m[5]
            major_minor = f"{major}.{minor}"

            if dev is not None:
                if newest_prerelease is None:
                    newest_prerelease = (tag, major_minor)
                continue

            is_new_major = major not in major_list
            if is_new_major:
                if major_counter == major_versions:
                    break
                major_counter += 1
                minor_counter = 0
                major_list.append(major)
            elif major_minor in version_list or minor_limit_reached:
                continue

            minor_counter += 1
            if minor_counter == minor_versions:
                minor_limit_reached = True
            if latest_stable is None:
                latest_stable = tag
                entry: dict[str, str | bool] = {
                    "name": f"{tag} (latest)",
                    "version": tag,
                    "url": f"{base_url}latest/",
                    "preferred": True,
                }
            else:
                entry = {
                    "version": tag,
                    "url": f"{base_url}{tag}/",
                }
            switcher_list.append(entry)
            version_list.add(major_minor)
            if major_counter == major_versions and minor_limit_reached:
                break

        if newest_prerelease is not None:
            dev_tag, major_minor = newest_prerelease
            if latest_stable is None or V(dev_tag) > V(latest_stable):
                switcher_list.append({
                    "name": f"dev ({dev_tag})",
                    "version": f"dev-{major_minor}",
                    "url": f"{base_url}dev-{major_minor}/",
                })

        with open(switcher_path, "w") as f:
            json.dump(switcher_list, f, indent=2)
            f.write("\n")

        config.add_modified("docs/bokeh/switcher.json")
        return PASSED("Switcher.json was updated.")
    except (OSError, RuntimeError, ValueError) as e:
        return FAILED("Switcher.json update failed", details=e.args)

@skip_for_prerelease
def update_changelog(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"python -m tools.milestone -a {config.milestone_version}")
        config.add_modified("docs/CHANGELOG")
        return PASSED("Updated CHANGELOG with new closed issues")
    except RuntimeError as e:
        return FAILED("CHANGELOG update failed", details=e.args)


@skip_for_prerelease
def update_hash_manifest(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"python -m tools.sri {config.version}")
        config.add_new(f"src/bokeh/_sri/{config.version}.json")
        return PASSED("Updated SRI hash manifest")
    except RuntimeError as e:
        return FAILED("SRI hash manifest update failed", details=e.args)

def verify_pip_install_from_sdist(config: Config, system: System) -> ActionReturn:
    try:
        system.run("bash tools/ci/verify_pip_install_from_sdist.sh", VERSION=config.version)
        return PASSED("Verified pip install from sdist")
    except RuntimeError as e:
        return FAILED("Verify pip install from sdist failed", details=e.args)

def verify_pip_install_using_sdist(config: Config, system: System) -> ActionReturn:
    try:
        system.run("bash tools/ci/verify_pip_install_using_sdist.sh", VERSION=config.version)
        return PASSED("Verified pip install using sdist")
    except RuntimeError as e:
        return FAILED("Verify pip install using sdist failed", details=e.args)

def verify_pip_install_using_wheel(config: Config, system: System) -> ActionReturn:
    try:
        system.run("bash tools/ci/verify_pip_install_using_wheel.sh", VERSION=config.version)
        return PASSED("Verified pip install using wheel")
    except RuntimeError as e:
        return FAILED("Verify pip install using wheel failed", details=e.args)

def verify_conda_package(config: Config, system: System) -> ActionReturn:
    try:
        system.run(
            f"rattler-build test --package-file dist/conda/noarch/bokeh-{config.version}-py_0.tar.bz2 "
            "--channel conda-forge",
        )
        return PASSED("Verified Conda package")
    except RuntimeError as e:
        return FAILED("Verify Conda package failed", details=e.args)
