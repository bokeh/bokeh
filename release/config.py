# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
import re
from typing import Dict, Optional, Tuple

# Bokeh imports
from .enums import VersionType
from .logger import LOG, Scrubber

__all__ = ("Config",)

# This excludes "local" build versions, e.g. 0.12.4+19.gf85560a
ANY_VERSION = re.compile(r"^((\d+)\.(\d+)\.(\d+))((dev|rc)(\d+))?$")

FULL_VERSION = re.compile(r"^(\d+\.\d+\.\d+)$")


class Config:
    def __init__(self, version: str) -> None:
        m = ANY_VERSION.match(version)
        if not m:
            raise ValueError(f"Invalid version for Bokeh build/release {version!r}")
        groups = m.groups()

        self.version: str = version

        self.base_version: str = groups[0]
        self.base_version_tuple: Tuple[str, ...] = tuple(groups[1:4])
        self.ext: Optional[str] = groups[4]
        self.ext_type: str = groups[5]
        self.ext_number: str = groups[6]

        self._secrets: Dict[str, str] = {}

    def add_secret(self, name: str, secret: str) -> None:
        """

        """
        if name in self._secrets:
            raise RuntimeError()
        LOG.add_scrubber(Scrubber(secret, name=name))
        self._secrets[name] = secret

    @property
    def secrets(self) -> Dict[str, str]:
        return self._secrets

    @property
    def prerelease(self) -> bool:
        return self.version_type != VersionType.FULL

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
        if self.ext is None:
            return self.version
        return f"{self.base_version}-{self.ext_type}.{self.ext_number}"

    @property
    def release_level(self) -> str:
        major, minor = self.base_version_tuple[:2]
        return f"{major}.{minor}"

    @property
    def staging_branch(self) -> str:
        return f"staging-{self.version}"

    @property
    def base_branch(self) -> str:
        return f"branch-{self.release_level}"

    @property
    def milestone_version(self) -> str:
        major, minor, patch = self.base_version_tuple
        if patch == "0":
            return f"{major}.{minor}"
        return self.base_version
