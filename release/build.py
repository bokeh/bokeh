# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from subprocess import CalledProcessError
from typing import Callable

# Bokeh imports
from .config import Config, StepType
from .enums import ActionStatus
from .system import cd, run
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


def artifact_build_wrapper(name: str) -> Callable[[StepType], StepType]:
    def decorator(func: StepType) -> StepType:
        def wrapper(config: Config) -> None:
            try:
                config.build_status[name] = ActionStatus.STARTED
                func(config)
                passed(f"Build for {name!r} finished")
            except Exception as e:
                failed(f"Build for {name!r} did NOT succeed", str(e).split("\n"))
                config.abort()
            config.build_status[name] = ActionStatus.COMPLETED

        return wrapper

    return decorator


@artifact_build_wrapper("npm")
def build_bokehjs(config: Config) -> None:
    try:
        cd("bokehjs", silent=False)
        run("node make", silent=False)
        cd("..", silent=False)
        passed("BokehJS build succeeded")
    except CalledProcessError as e:
        failed("BokehJS build did NOT succeed", str(e).split("\n"))
        config.abort()


@artifact_build_wrapper("conda")
def build_conda_packages(config: Config) -> None:
    run("conda build conda.recipe --quiet --no-test", silent=False)


@artifact_build_wrapper("sdist")
def build_sdist_packages(config: Config) -> None:
    run("python setup.py sdist --install-js --formats=gztar", silent=False)


@artifact_build_wrapper("docs")
def build_docs(config: Config) -> None:
    cd("sphinx", silent=False)
    run("make clean all", silent=False, BOKEH_DOCS_CDN=config.version, BOKEH_DOCS_VERSION=config.version)
    cd("..", silent=False)


def npm_install(config: Config) -> None:
    try:
        cd("bokehjs", silent=False)
        run("npm install", silent=False)
        cd("..", silent=False)
        passed("npm install succeeded")
    except CalledProcessError as e:
        failed("npm install did NOT succeed", str(e).split("\n"))
        config.abort()


def install_bokehjs(config: Config) -> None:
    try:
        run("python setup.py --install-js", silent=False)
        passed("BokehJS install succeeded")
    except CalledProcessError as e:
        failed("BokehJS install did NOT succeed", str(e).split("\n"))
        config.abort()


def dev_install(config: Config) -> None:
    try:
        run("python setup.py develop --install-js")
        passed("Bokeh dev install succeeded")
    except CalledProcessError as e:
        failed("Bokeh dev install did NOT succeed", str(e).split("\n"))
        config.abort()
