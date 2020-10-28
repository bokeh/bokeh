# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
# Standard library imports
import json
from typing import List

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .system import System
from .util import skip_for_prerelease

__all__ = (
    "build_bokehjs",
    "build_conda_packages",
    "build_docs",
    "build_sdist_packages",
    "dev_install",
    "install_bokehjs",
    "npm_install",
    "pack_deployment_tarball",
    "update_bokehjs_versions",
    "update_changelog",
    "update_hash_manifest",
)


def build_bokehjs(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("bokehjs")
        system.run("node make")
        system.cd("..")
        return PASSED("BokehJS build succeeded")
    except RuntimeError as e:
        return FAILED("BokehJS build did NOT succeed", details=e.args)


def build_conda_packages(config: Config, system: System) -> ActionReturn:
    try:
        system.run("conda build conda.recipe --quiet --no-test --output-folder .")
        return PASSED("conda package build succeeded")
    except RuntimeError as e:
        return FAILED("conda package build did NOT succeed", details=e.args)


def build_docs(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("sphinx")
        system.run("make clean all", BOKEH_DOCS_CDN=config.version, BOKEH_DOCS_VERSION=config.version)
        system.cd("..")
        return PASSED("Docs build succeeded")
    except RuntimeError as e:
        return FAILED("Docs build did NOT succeed", details=e.args)


def build_sdist_packages(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python setup.py sdist --install-js --formats=gztar")
        return PASSED("sdist package build succeeded")
    except RuntimeError as e:
        return FAILED("sdist package build did NOT succeed", details=e.args)


def dev_install(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python setup.py develop --install-js")
        return PASSED("Bokeh dev install succeeded")
    except RuntimeError as e:
        return FAILED("Bokeh dev install did NOT succeed", details=e.args)


def install_bokehjs(config: Config, system: System) -> ActionReturn:
    try:
        system.run("python setup.py --install-js")
        return PASSED("BokehJS install succeeded")
    except RuntimeError as e:
        return FAILED("BokehJS install did NOT succeed", details=e.args)


def npm_install(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("bokehjs")
        system.run("npm install")
        system.cd("..")
        return PASSED("npm install succeeded")
    except RuntimeError as e:
        return FAILED("npm install did NOT succeed", details=e.args)


def pack_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        dirname = f"deployment-{config.version}"
        filename = f"{dirname}.tgz"
        system.run(f"mkdir {dirname}")
        system.run(f"cp noarch/bokeh-{config.version}-py_0.tar.bz2 {dirname}")
        system.run(f"cp dist/bokeh-*.tar.gz {dirname}")  # TODO: handle .dev version variant better
        system.run(f"mkdir {dirname}/bokehjs")
        system.run(f"cp -r bokehjs/build {dirname}/bokehjs")
        system.run(f"mkdir -p {dirname}/sphinx/build")
        system.run(f"cp -r sphinx/build/html {dirname}/sphinx/build")
        system.run(f"cp -r sphinx/versions.json {dirname}/sphinx")
        system.run(f"tar cvf {filename} {dirname}")
        return PASSED(f"Packed deployment tarball {filename!r}")
    except RuntimeError as e:
        return FAILED("Could NOT pack deployment tarball", details=e.args)


def update_bokehjs_versions(config: Config, system: System) -> ActionReturn:
    filenames: List[str] = [
        "package.json",
        "package-lock.json",
    ]

    system.pushd("bokehjs")

    for filename in filenames:
        content = json.load(open(filename))
        try:
            content["version"] = config.js_version
            with open(filename, "w") as f:
                json.dump(content, f, indent=2)
                f.write("\n")
        except Exception as e:
            return FAILED(f"Unable to write new version to file {filename!r}", details=e.args)

    system.popd()

    return PASSED(f"Updated version to {config.js_version!r} in files: {filenames!r}")


@skip_for_prerelease
def update_changelog(config: Config, system: System) -> ActionReturn:
    try:
        system.pushd("scripts")
        system.run(f"python milestone.py -a {config.milestone_version}")
        system.popd()
        return PASSED("Updated CHANGELOG with new closed issues")
    except RuntimeError as e:
        return FAILED("CHANGELOG update failed", details=e.args)


@skip_for_prerelease
def update_hash_manifest(config: Config, system: System) -> ActionReturn:
    try:
        system.cd("scripts")
        system.run(f"python sri.py {config.version}")
        system.cd("..")
        return PASSED("Updated SRI hash manifest")
    except RuntimeError as e:
        return FAILED("SRI hash manifest update failed", details=e.args)
