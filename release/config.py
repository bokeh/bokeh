# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import re
from collections import defaultdict
from typing import Any, Callable, Dict

# Bokeh imports
from .enums import ActionStatus, VersionType
from .system import run
from .ui import banner, bright, red, yellow

__all__ = (
    "Config",
    "StepType",
)

# This excludes "local" build versions, e.g. 0.12.4+19.gf85560a
ANY_VERSION = re.compile(r"^(\d+\.\d+\.\d+)((dev|rc)(\d+))?$")

FULL_VERSION = re.compile(r"^(\d+\.\d+\.\d+)?$")


class Config(object):
    def __init__(self, version: str) -> None:
        if not ANY_VERSION.match(version):
            raise ValueError(f"Invalid Bokeh version for build/release {version!r}")
        self.version: str = version
        self.credentials: Dict[str, Any] = {}
        self._last_any_version: str = ""
        self._last_full_version: str = ""

        self.builds = ("conda", "sdist", "docs", "npm")
        self.build_status: Dict[str, ActionStatus] = defaultdict(lambda: ActionStatus.NOT_STARTED)

        self.uploads = ("cdn", "anaconda", "pypi", "docs", "npm")
        self.upload_status: Dict[str, ActionStatus] = defaultdict(lambda: ActionStatus.NOT_STARTED)

    def _to_js_version(self, v: str) -> str:
        if FULL_VERSION.match(v):
            return v
        match = ANY_VERSION.match(v)
        if not match:
            raise ValueError(f"Invalid verison {v!r}")
        (version, suffix, release, number) = match.groups()
        return f"{version}-{release}.{number}"

    @property
    def version_type(self) -> VersionType:
        if "rc" in self.version:
            return VersionType.RC
        elif "dev" in self.version:
            return VersionType.DEV
        else:
            return VersionType.FULL

    @property
    def repo_top_dir(self) -> str:
        return run("git rev-parse --show-toplevel").strip()

    @property
    def js_version(self) -> str:
        return self._to_js_version(self.version)

    @property
    def last_any_version(self) -> str:
        return self._last_any_version

    @last_any_version.setter
    def last_any_version(self, v: str) -> None:
        m = ANY_VERSION.match(v)
        if not m:
            raise ValueError("Invalid Bokeh version %r" % v)
        self._last_any_version = v

    @property
    def js_last_any_version(self) -> str:
        return self._to_js_version(self.last_any_version)

    @property
    def last_full_version(self) -> str:
        return self._last_full_version

    @last_full_version.setter
    def last_full_version(self, v: str) -> None:
        m = FULL_VERSION.match(v)
        if not m:
            raise ValueError("Invalid Bokeh version %r" % v)
        self._last_full_version = v

    @property
    def release_branch(self) -> str:
        return "release-%s" % self.version

    def abort(self) -> None:
        print()
        print(bright(red("!!! Steps failed. The BUILD has been aborted.")))
        print()

        print(bright(yellow("Here is the status of all build steps:")))
        print()
        for build in self.builds:
            print(f"    - {build:>10}: {self.build_status[build].value}")

        print()

        if all(self.upload_status[x] == ActionStatus.NOT_STARTED for x in self.uploads):
            print(bright(red("!!! NO ASSETS HAVE BEEN UPLOADED")))
        else:
            print(bright(red("!!! SOME ASSETS MAY HAVE BEEN UPLOADED")))
            print
            print(bright(yellow("Here is the status of all uploads:")))
            for upload in self.uploads:
                print(f"    - {upload:>10}: {self.upload_status[upload].value}")

        banner(red, "{:^80}".format(f"Bokeh {self.version!r} build: FAILURE"))
        raise RuntimeError()
        # sys.exit(1)


StepType = Callable[[Config], None]
