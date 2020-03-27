# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import json
import re
from os.path import join
from subprocess import CalledProcessError

# External imports
from packaging.version import Version as V

# Bokeh imports
from .config import Config
from .system import cd, run
from .ui import failed, passed, skipped

__all__ = (
    "checkout_master",
    "checkout_release_branch",
    "commit",
    "delete_release_branch",
    "merge_release_branch",
    "push_to_github",
    "tag_version",
    "update_bokehjs_versions",
    "update_changelog",
    "update_hash_manifest",
)


def commit(config: Config, filename: str) -> None:
    path = join(config.repo_top_dir, filename)
    try:
        run(f"git add {path}")
    except CalledProcessError as e:
        failed("Could not git add {filename!r}", str(e).split("/n"))
        config.abort()
    try:
        run(f"git commit -m'Updating for version {config.version}'")
    except CalledProcessError as e:
        failed(f"Could not git commit {filename!r}", str(e).split("/n"))
        config.abort()
    passed(f"Committed file {filename!r}")


def checkout_release_branch(config: Config) -> None:
    try:
        run(f"git checkout -b {config.release_branch}")
        passed(f"Checked out release branch {config.release_branch!r}")
    except CalledProcessError as e:
        failed(f"Could not check out release branch {config.release_branch!r}", str(e).split("/n"))
        config.abort()


def checkout_master(config: Config) -> None:
    try:
        run("git checkout master")
        passed("Checked out master branch")
    except CalledProcessError as e:
        failed("Coud NOT check out master branch", str(e).split("/"))
        config.abort()


def merge_release_branch(config: Config) -> None:
    try:
        run(f"git merge --no-ff {config.release_branch} -m 'Merge branch {config.release_branch}'")
        passed("Merged release branch into master branch")
    except CalledProcessError as e:
        failed("Could NOT merge release branch in to master", str(e).split("/"))
        config.abort()


def delete_release_branch(config: Config) -> None:
    try:
        run(f"git branch -d {config.release_branch}")
        passed("Deleted release branch")
    except CalledProcessError as e:
        failed("Could NOT delete release branch", str(e).split("/"))
        config.abort()


def push_to_github(config: Config) -> None:
    try:
        # use --no-verify to prevent git hook that might ask for confirmation
        run("git push --no-verify origin master")
        passed("Pushed master branch to GitHub")
    except CalledProcessError as e:
        failed("Could NOT push master to origin", str(e).split("/"))
        config.abort()

    try:
        # use --no-verify to prevent git hook that might ask for confirmation
        run(f"git push --no-verify origin {config.version}")
        passed(f"Pushed tag {config.version!r} to GitHub")
    except CalledProcessError as e:
        failed("Could NOT push tag to origin", str(e).split("/"))
        config.abort()


def update_changelog(config: Config) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating CHANGELOG for pre-releases")
        return

    try:
        cd("scripts")
        run(f"python issues.py -p {config.last_full_version} -r {config.version}")
        cd("..")
        passed("Updated CHANGELOG with new closed issues")
        filename = join(config.repo_top_dir, "CHANGELOG")
        commit(config, filename)
    except CalledProcessError as e:
        if "HTTP Error 403: Forbidden" in e.output:
            failed("CHANGELOG cannot be updated right now due to GitHub rate limiting")
        else:
            failed("CHANGELOG update failed", e.output.split("\n"))


def update_bokehjs_versions(config: Config) -> None:

    regex_filenames = [
        "bokehjs/src/lib/version.ts",
    ]

    json_filenames = [
        "bokehjs/package.json",
        "bokehjs/package-lock.json",
    ]

    pat = rf"(release|version)([\" ][:=] [\"\']){config.js_last_any_version}([\"\'])"

    for filename in regex_filenames:
        path = join(config.repo_top_dir, filename)
        with open(path) as f:
            text = f.read()
            match = re.search(pat, text)

        if not match:
            failed(f"Unable to find version string for {config.js_last_any_version!r} in file {filename!r}")
            continue

        text = re.sub(pat, rf"\g<1>\g<2>{config.js_version}\g<3>", text)

        try:
            with open(path, "w") as f:
                f.write(text)
        except Exception as e:
            failed(f"Unable to write new version to file {filename!r}", str(e).split("\n"))
        else:
            passed(f"Updated version from {config.js_last_any_version!r} to {config.js_version!r} in file {filename!r}")
            commit(config, filename)

    for filename in json_filenames:
        path = join(config.repo_top_dir, filename)
        content = json.load(open(path))
        try:
            content["version"] = config.js_version
            with open(path, "w") as f:
                json.dump(content, f, indent=2)
                f.write("\n")
        except Exception as e:
            failed(f"Unable to write new version to file {filename!r}", str(e).split("\n"))
        else:
            passed(f"Updated version from {config.js_last_any_version!r} to {config.js_version!r} in file {filename!r}")
            commit(config, filename)


def update_hash_manifest(config: Config) -> None:
    if V(config.version).is_prerelease:
        skipped("Not updating SRH hash manifest for pre-releases")
        return

    try:
        cd("scripts")
        run(f"python sri.py {config.version}")
        cd("..")
        passed("Updated SRI hash manifest")
        commit(config, "bokeh/_sri.json")
    except CalledProcessError as e:
        failed("SRI hash manifest update failed", e.output.split("\n"))
        config.abort()


def tag_version(config: Config) -> None:
    try:
        run(f"git tag -a {config.version} -m 'Release {config.version}'", silent=False)
        passed("Tagged release {config.version!r}")
    except CalledProcessError as e:
        failed("COULD NOT TAG RELEASE" % e.output.split("\n"))
        config.abort()
