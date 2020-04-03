# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import re
from typing import Any, Callable, Dict

# Bokeh imports
from .enums import VersionType
from .system import System
from .ui import bright, red

__all__ = (
    "Config",
    "StepType",
)

# This excludes "local" build versions, e.g. 0.12.4+19.gf85560a
ANY_VERSION = re.compile(r"^(\d+\.\d+\.\d+)((dev|rc)(\d+))?$")

FULL_VERSION = re.compile(r"^(\d+\.\d+\.\d+)?$")


class Config(object):
    def __init__(self, version: str, dry_run: bool = False) -> None:
        if not ANY_VERSION.match(version):
            raise ValueError(f"Invalid Bokeh version for build/release {version!r}")
        self.version: str = version
        self.dry_run: bool = False

        self.system = System(dry_run=dry_run)

        self.credentials: Dict[str, Any] = {}
        self._last_any_version: str = ""
        self._last_full_version: str = ""

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
    def js_version(self) -> str:
        return self._to_js_version(self.version)

    @property
    def last_any_version(self) -> str:
        return self._last_any_version

    @last_any_version.setter
    def last_any_version(self, v: str) -> None:
        m = ANY_VERSION.match(v)
        if not m:
            raise ValueError(f"Invalid Bokeh version {v!r}")
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
            raise ValueError(f"Invalid Bokeh version {v!r}")
        self._last_full_version = v

    @property
    def release_branch(self) -> str:
        return f"release-{self.version}"

    def abort(self) -> None:
        print()
        print(bright(red("!!! Tasks failed. The XXX has been aborted.")))
        print()

        raise RuntimeError()


StepType = Callable[[Config, System], None]
