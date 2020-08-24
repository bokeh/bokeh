# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .system import System

__all__ = (
    "checkout_base_branch",
    "checkout_staging_branch",
    "commit_staging_branch",
    "delete_staging_branch",
    "merge_staging_branch",
    "push_to_github",
    "tag_release_version",
)


def checkout_base_branch(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"git checkout {config.base_branch}")
        return PASSED(f"Checked out release branch {config.base_branch!r}")
    except RuntimeError as e:
        return FAILED(f"Could not check out release branch {config.base_branch!r}", details=e.args)


def checkout_staging_branch(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"git checkout -b {config.staging_branch}")
        return PASSED(f"Checked out staging branch {config.staging_branch!r}")
    except RuntimeError as e:
        return FAILED(f"Could not check out staging branch {config.staging_branch!r}", details=e.args)


def clean_repo(config: Config, system: System) -> ActionReturn:
    try:
        system.run("git clean -fdx")
        return PASSED("Cleaned the repo checkout")
    except RuntimeError as e:
        return FAILED("Could NOT clean the repo checkout", details=e.args)


def commit_staging_branch(config: Config, system: System) -> ActionReturn:
    paths = ("CHANGELOG", "bokehjs/package-lock.json", "bokehjs/package.json", "bokeh/_sri.json")
    for path in paths:
        try:
            system.run(f"git add {path}")
        except RuntimeError as e:
            return FAILED("Could not git add {path!r}", details=e.args)
    try:
        system.run(f"git commit -m'Deployment updates for release {config.version}'")
    except RuntimeError as e:
        return FAILED("Could not git commit deployment updates", details=e.args)
    return PASSED(f"Committed deployment updates for release {config.version!r}")


def delete_staging_branch(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"git branch -D {config.staging_branch!r}")
        return PASSED(f"Deleted staging branch {config.staging_branch!r}")
    except RuntimeError as e:
        return FAILED(f"Could NOT delete staging branch {config.staging_branch!r}", details=e.args)


def merge_staging_branch(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"git merge --no-ff {config.staging_branch} -m 'Merge deployment staging branch {config.staging_branch}'")
        return PASSED(f"Merged staging branch {config.staging_branch!r} into base branch {config.base_branch!r}")
    except RuntimeError as e:
        return FAILED(f"Could NOT merge staging branch {config.staging_branch!r} in to base branch {config.base_branch!r}", details=e.args)


def push_to_github(config: Config, system: System) -> ActionReturn:
    try:
        # use --no-verify to prevent git hook that might ask for confirmation
        system.run(f"git push --no-verify origin {config.base_branch}")
        system.run(f"git push --no-verify origin {config.version}")
        return PASSED(f"Pushed base branch and tag for {config.base_branch!r} to GitHub")
    except RuntimeError as e:
        return FAILED("Could NOT push base branch and tag to origin", details=e.args)


def tag_release_version(config: Config, system: System) -> ActionReturn:
    try:
        system.run(f"git tag -a {config.version} -m 'Release {config.version}'")
        return PASSED(f"Tagged release verison {config.version!r}")
    except RuntimeError as e:
        return FAILED(f"Could NOT tag release version {config.version!r}", details=e.args)
