# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import json
import os
from pathlib import Path

# External imports
from packaging.version import Version as V

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .pipeline import StepType
from .system import System
from .util import skip_for_prerelease

__all__ = (
    "check_anaconda_present",
    "check_aws_present",
    "check_checkout_matches_remote",
    "check_checkout_on_base_branch",
    "check_checkout_is_clean",
    "check_docs_version_config",
    "check_git_present",
    "check_milestone_labels",
    "check_release_tag_is_available",
    "check_npm_present",
    "check_repo_is_bokeh",
    "check_staging_branch_is_available",
    "check_twine_present",
    "check_version_order",
)


def _check_app_present(app: str) -> StepType:
    def func(config: Config, system: System) -> ActionReturn:
        try:
            system.run(f"which {app}")
            return PASSED(f"Command {app!r} is available")
        except RuntimeError:
            return FAILED(f"Command {app!r} is missing")

    func.__name__ = f"check_{app}_present"
    return func


check_anaconda_present = _check_app_present("anaconda")
check_aws_present = _check_app_present("aws")
check_git_present = _check_app_present("git")
check_npm_present = _check_app_present("npm")
check_twine_present = _check_app_present("twine")


def check_repo_is_bokeh(config: Config, system: System) -> ActionReturn:
    try:
        system.run("git status")
    except RuntimeError:
        return FAILED("Executing outside of a git repository")

    try:
        remote = system.run("git config --get remote.origin.url")
        if remote.strip() == "git@github.com:bokeh/bokeh.git":
            return PASSED("Executing inside the the bokeh/bokeh repository")
        else:
            return FAILED("Executing OUTSIDE the bokeh/bokeh repository")
    except RuntimeError as e:
        return FAILED("Could not determine Git config remote.origin.url", details=e.args)


@skip_for_prerelease
def check_release_notes_present(config: Config, system: System) -> ActionReturn:
    try:
        if os.path.exists(Path(f"sphinx/source/docs/releases/{config.version}.rst")):
            return PASSED(f"Release notes file '{config.version}.rst' exists")
        else:
            return FAILED(f"Release notes file '{config.version}.rst' does NOT exist")
    except RuntimeError as e:
        return FAILED("Could not check presence of release notes file", details=e.args)


def check_checkout_on_base_branch(config: Config, system: System) -> ActionReturn:
    try:
        branch = system.run("git rev-parse --abbrev-ref HEAD").strip()
        if branch == config.base_branch:
            return PASSED(f"Working on base branch {config.base_branch!r} for release {config.version!r}")
        else:
            return FAILED(f"NOT working on base branch {config.base_branch!r} for release {config.version!r}")
    except RuntimeError as e:
        return FAILED("Could not check the checkout branch", details=e.args)


def check_checkout_is_clean(config: Config, system: System) -> ActionReturn:
    try:
        extras = system.run("git status --porcelain").split("\n")
        extras = [x for x in extras if x != ""]
        if extras:
            return FAILED("Local checkout is NOT clean", extras)
        else:
            return PASSED("Local checkout is clean")
    except RuntimeError as e:
        return FAILED("Could not check the checkout state", details=e.args)


def check_checkout_matches_remote(config: Config, system: System) -> ActionReturn:
    try:
        system.run("git remote update")
        local = system.run("git rev-parse @")
        remote = system.run("git rev-parse @{u}")
        base = system.run("git merge-base @ @{u}")
        if local == remote:
            return PASSED("Checkout is up to date with GitHub")
        else:
            if local == base:
                status = "NEED TO PULL"
            elif remote == base:
                status = "NEED TO PUSH"
            else:
                status = "DIVERGED"
            return FAILED(f"Checkout is NOT up to date with GitHub ({status})")
    except RuntimeError as e:
        return FAILED("Could not check whether local and GitHub are up to date", details=e.args)


@skip_for_prerelease
def check_docs_version_config(config: Config, system: System) -> ActionReturn:
    try:
        with open(Path("sphinx/versions.json")) as fp:
            versions = json.load(fp)
            all_versions = versions["all"]
            latest_version = versions["latest"]
            if config.version not in all_versions:
                return FAILED(f"Version {config.version!r} is missing from 'all' versions")
            if V(config.version) > V(latest_version):
                return FAILED(f"Version {config.version!r} is not configured as 'latest' version")
            return PASSED("Docs versions config is correct")
    except RuntimeError as e:
        return FAILED("Could not check docs versions config", details=e.args)


def check_release_tag_is_available(config: Config, system: System) -> ActionReturn:
    try:
        out = system.run("git for-each-ref --sort=-taggerdate --format '%(tag)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        if config.version in tags:
            return FAILED(f"There is already an existing tag for new version {config.version!r}")
        else:
            return PASSED(f"New version {config.version!r} does not already have a tag")

    except RuntimeError as e:
        return FAILED("Could not check release tag availability", details=e.args)


def check_version_order(config: Config, system: System) -> ActionReturn:
    try:
        out = system.run("git for-each-ref --sort=-taggerdate --format '%(tag)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        if all(V(config.version) > V(tag) for tag in tags if tag.startswith(config.release_level)):
            return PASSED(f"Version {config.version!r} is newer than any tag at release level {config.release_level!r}")
        else:
            return FAILED(f"Version {config.version!r} is older than an existing tag at release level {config.release_level!r}")

    except RuntimeError as e:
        return FAILED("Could compare tag version order", details=e.args)


def check_staging_branch_is_available(config: Config, system: System) -> ActionReturn:
    out = system.run(f"git branch --list {config.staging_branch}")
    if out:
        return FAILED(f"Release branch {config.staging_branch!r} ALREADY exists")
    else:
        return PASSED(f"Release branch {config.staging_branch!r} does not already exist")


@skip_for_prerelease
def check_milestone_labels(config: Config, system: System) -> ActionReturn:
    try:
        # system.run(f"python scripts/milestone.py {config.version} --check-only")
        return PASSED("Milestone labels are BEP-1 compliant")
    except RuntimeError as e:
        return FAILED("Milesstone labels are NOT BEP-1 compliant", e.args)
