# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from subprocess import CalledProcessError

# Bokeh imports
from .config import Config
from .system import System
from .ui import failed, passed

__all__ = (
    "build_bokehjs",
    "build_conda_packages",
    "build_docs",
    "build_sdist_packages",
    "dev_install",
    "npm_install",
    "install_bokehjs",
)


def build_bokehjs(config: Config, system: System) -> None:
    try:
        system.cd("bokehjs")
        system.run("node make")
        system.cd("..")
        passed("BokehJS build succeeded")
    except CalledProcessError as e:
        failed("BokehJS build did NOT succeed", str(e).split("\n"))
        config.abort()


def build_conda_packages(config: Config, system: System) -> None:
    system.run("conda build conda.recipe --quiet --no-test")


def build_sdist_packages(config: Config, system: System) -> None:
    system.run("python setup.py sdist --install-js --formats=gztar")


def build_docs(config: Config, system: System) -> None:
    system.cd("sphinx")
    system.run("make clean all", BOKEH_DOCS_CDN=config.version, BOKEH_DOCS_VERSION=config.version)
    system.cd("..")


def npm_install(config: Config, system: System) -> None:
    try:
        system.cd("bokehjs")
        system.run("npm install")
        system.cd("..")
        passed("npm install succeeded")
    except CalledProcessError as e:
        failed("npm install did NOT succeed", str(e).split("\n"))
        config.abort()


def install_bokehjs(config: Config, system: System) -> None:
    try:
        system.run("python setup.py --install-js")
        passed("BokehJS install succeeded")
    except CalledProcessError as e:
        failed("BokehJS install did NOT succeed", str(e).split("\n"))
        config.abort()


def dev_install(config: Config, system: System) -> None:
    try:
        system.run("python setup.py develop --install-js")
        passed("Bokeh dev install succeeded")
    except CalledProcessError as e:
        failed("Bokeh dev install did NOT succeed", str(e).split("\n"))
        config.abort()
