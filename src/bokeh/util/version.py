#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a version for the Bokeh library.

This module uses `versioneer`_ to manage version strings. During development,
`versioneer`_ will compute a version string from the current git revision.
For packaged releases based off tags, the version string is hard coded in the
files packaged for distribution.

Attributes:
    __version__:
        The full version string for this installed Bokeh library

Functions:
    base_version:
        Return the base version string, without any "dev", "rc" or local build
        information appended.

    is_full_release:
        Return whether the current installed version is a full release.

.. _versioneer: https://github.com/warner/python-versioneer

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from packaging.version import Version

# Bokeh imports
from .. import __version__

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'base_version',
    'is_full_release',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def base_version() -> str:
    return _base_version_helper(__version__)

def is_full_release(version: str | None = None) -> bool:
    import re
    version = version or __version__
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)$")
    return bool(VERSION_PAT.match(version))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def bokehjs_version(version: str | None) -> str:
    parsed = Version(version or __version__)
    release = ".".join(str(part) for part in parsed.release)
    if parsed.dev is not None:
        return f"{release}-dev.{parsed.dev}"
    if parsed.pre is not None:
        kind, number = parsed.pre
        return f"{release}-{kind}.{number}"
    return release

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _base_version_helper(version: str) -> str:
    import re
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)((?:\.dev|\.rc).*)?")
    match = VERSION_PAT.search(version)
    assert match is not None
    return match.group(1)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
