# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from subprocess import CalledProcessError

# External imports
from packaging.version import Version as V

# Bokeh imports
from .config import Config
from .system import run
from .ui import failed, passed

__all__ = (
    "check_checkout",
    "check_git",
    "check_issues",
    "check_release_branch",
    "check_repo",
    "check_tags",
    "check_version_order",
)


def check_git(config: Config) -> None:
    try:
        run("which git")
        passed("Command 'git' is available")
    except CalledProcessError:
        failed("Command 'git' is missing")
        config.abort()


def check_repo(config: Config) -> None:
    try:
        run("git status")
    except CalledProcessError:
        failed("Executing outside of a git repository")
        config.abort()

    try:
        remote = run("git config --get remote.origin.url")
        if "bokeh/bokeh" in remote:
            passed("Executing inside the the bokeh/bokeh repository")
        else:
            failed("Executing OUTSIDE the bokeh/bokeh repository")
            config.abort()
    except CalledProcessError:
        failed("Could not determine Git config remote.origin.url")
        config.abort()


def check_checkout(config: Config) -> None:
    try:
        branch = run("git rev-parse --abbrev-ref HEAD").strip()
        if branch == "master":
            passed("Working on master branch")
        else:
            failed(f"NOT working on master branch ({branch!r})")
            config.abort()

        extras = run("git status --porcelain").split("\n")
        extras = [x for x in extras if x != ""]
        if extras:
            failed("Local checkout is NOT clean", extras)
            config.abort()
        else:
            passed("Local checkout is clean")

        try:
            run("git remote update")
            local = run("git rev-parse @")
            remote = run("git rev-parse @{u}")
            base = run("git merge-base @ @{u}")
            if local == remote:
                passed("Checkout is up to date with GitHub")
            else:
                if local == base:
                    status = "NEED TO PULL"
                elif remote == base:
                    status = "NEED TO PUSH"
                else:
                    status = "DIVERGED"
                failed(f"Checkout is NOT up to date with GitHub ({status})")
                config.abort()
        except CalledProcessError:
            failed("Could not check whether local and GitHub are up to date")
            config.abort()

    except CalledProcessError:
        failed("Could not check the checkout state")
        config.abort()


def check_tags(config: Config) -> None:
    try:
        out = run("git for-each-ref --sort=-taggerdate --format '%(tag)' refs/tags")
        tags = [x.strip("'\"") for x in out.split("\n")]

        if config.version in tags:
            failed(f"There is already an existing tag for new version {config.version!r}")
            config.abort()
        else:
            passed(f"New version {config.version!r} does not already have a tag")

        try:
            config.last_any_version = tags[0]
            passed(f"Detected valid last dev/rc/full version {config.last_any_version!r}")
        except ValueError:
            failed(f"Last dev/rc/full version {config.last_any_version!r} is not a valid Bokeh version!")
            config.abort()

        try:
            config.last_full_version = [tag for tag in tags if ("rc" not in tag and "dev" not in tag)][0]
            passed(f"Detected valid last full release version {config.last_full_version!r}")
        except ValueError:
            failed(f"Last full release version {config.last_full_version!r} is not a valid Bokeh version!")
            config.abort()

    except CalledProcessError:
        failed("Could not detect last version tags")
        config.abort()


def check_version_order(config: Config) -> None:
    if V(config.version) > V(config.last_any_version):
        passed(f"New version {config.version!r} is newer than last version {config.last_any_version!r}")
    else:
        failed(f"New version {config.version!r} is NOT newer than last version {config.last_any_version!r}")
        config.abort()


def check_release_branch(config: Config) -> None:
    out = run("git branch --list %s" % config.release_branch)
    if out:
        failed(f"Release branch {config.release_branch!r} ALREADY exists")
        config.abort()
    else:
        passed(f"Release branch {config.release_branch!r} does not already exist")


def check_issues(config: Config) -> None:
    try:
        run(f"python scripts/issues.py -c -p {config.last_full_version}")
        passed("Issue labels are BEP-1 compliant")
    except CalledProcessError as e:
        if "HTTP Error 403: Forbidden" in e.output:
            failed("Issues cannot be checked right now due to GitHub rate limiting")
        else:
            failed("Issue labels are NOT BEP-1 compliant", e.output.split("\n"))
        config.abort()
