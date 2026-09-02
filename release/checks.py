# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import json
import os
from pathlib import Path

# External imports
from packaging.version import Version as V

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .git import get_tags
from .pipeline import StepType
from .system import System
from .util import skip_for_prerelease

__all__ = (
    "check_aws_present",
    "check_checkout_matches_remote",
    "check_checkout_on_base_branch",
    "check_checkout_is_clean",
    "check_docs_version_config",
    "check_git_present",
    "check_milestone_labels",
    "check_release_tag_is_available",
    "check_repo_is_bokeh",
    "check_staging_branch_is_available",
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


check_aws_present = _check_app_present("aws")
check_git_present = _check_app_present("git")


def check_repo_is_bokeh(config: Config, system: System) -> ActionReturn:
    try:
        system.run("git status")
    except RuntimeError:
        return FAILED("Executing outside of a git repository")

    try:
        remote = system.run("git config --get remote.origin.url").strip()
        normalized_remote = remote.removesuffix(".git")
        if normalized_remote in ("git@github.com:bokeh/bokeh", "https://github.com/bokeh/bokeh"):
            return PASSED("Executing inside the bokeh/bokeh repository")
        else:
            return FAILED(f"Executing OUTSIDE the bokeh/bokeh repository (bad remote: {remote})")
    except RuntimeError as e:
        return FAILED("Could not determine Git config remote.origin.url", details=e.args)


@skip_for_prerelease
def check_release_notes_present(config: Config, system: System) -> ActionReturn:
    try:
        if os.path.exists(Path(f"docs/bokeh/source/docs/releases/{config.version}.rst")):
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


def check_docs_version_config(config: Config, system: System) -> ActionReturn:
    try:
        with open(Path("docs/bokeh/switcher.json")) as fp:
            switcher = json.load(fp)

            if not config.prerelease and not any(entry.get("version") == config.version for entry in switcher):
                return FAILED(f"Version {config.version!r} is missing from switcher.json")

            versions = [V(tag) for tag in get_tags(config, system)]
            current_version = V(config.version)
            if current_version not in versions:
                versions.append(current_version)
            stable_versions = [version for version in versions if not version.is_prerelease]
            prerelease_versions = [version for version in versions if version.is_prerelease]
            latest_stable = max(stable_versions, default=None)
            latest_prerelease = max(prerelease_versions, default=None)
            if latest_prerelease is not None and latest_stable is not None and latest_prerelease <= latest_stable:
                latest_prerelease = None

            dev_entries = [entry for entry in switcher if str(entry.get("version", "")).startswith("dev-")]
            if len(dev_entries) > 1:
                return FAILED("Multiple development versions are present in switcher.json")
            if latest_prerelease is None:
                if dev_entries:
                    return FAILED("An obsolete development version is present in switcher.json")
            else:
                release_level = ".".join(str(part) for part in latest_prerelease.release[:2])
                expected_entry = {
                    "name": f"dev ({latest_prerelease})",
                    "version": f"dev-{release_level}",
                    "url": f"https://docs.bokeh.org/en/dev-{release_level}/",
                }
                if not dev_entries:
                    return FAILED(f"Version {expected_entry['version']!r} is missing from switcher.json")
                if any(dev_entries[0].get(key) != value for key, value in expected_entry.items()):
                    return FAILED(f"Version {expected_entry['version']!r} has stale metadata in switcher.json")
            return PASSED("Docs versions config is correct")
    except (OSError, RuntimeError, ValueError) as e:
        return FAILED("Could not check docs versions config", details=e.args)


def check_release_tag_is_available(config: Config, system: System) -> ActionReturn:
    try:
        out = system.run("git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        if config.version in tags:
            return FAILED(f"There is already an existing tag for new version {config.version!r}")
        else:
            return PASSED(f"New version {config.version!r} does not already have a tag")

    except RuntimeError as e:
        return FAILED("Could not check release tag availability", details=e.args)


def check_version_order(config: Config, system: System) -> ActionReturn:
    try:
        out = system.run("git for-each-ref --sort=-taggerdate --format '%(refname:short)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        release_prefix = f"{config.release_level}."
        if all(V(config.version) > V(tag) for tag in tags if tag.startswith(release_prefix)):
            return PASSED(f"Version {config.version!r} is newer than any tag at release level {config.release_level!r}")
        else:
            return FAILED(f"Version {config.version!r} is older than an existing tag at release level {config.release_level!r}")

    except RuntimeError as e:
        return FAILED("Could not compare tag version order", details=e.args)


def check_staging_branch_is_available(config: Config, system: System) -> ActionReturn:
    try:
        out = system.run(f"git branch --list {config.staging_branch}")
        if out:
            return FAILED(f"Release branch {config.staging_branch!r} ALREADY exists")
        else:
            return PASSED(f"Release branch {config.staging_branch!r} does not already exist")
    except RuntimeError as e:
        return FAILED("Could not check staging branch availability", details=e.args)


@skip_for_prerelease
def check_milestone_labels(config: Config, system: System) -> ActionReturn:
    try:
        system.run(
            f"python scripts/milestone.py {config.milestone_version} --check-only --allow-closed",
        )
        return PASSED("Milestone labels are BEP-1 compliant")
    except RuntimeError as e:
        return FAILED("Milestone labels are NOT BEP-1 compliant", details=e.args)
