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

    is_valid_version:
        Return whether a string uses Bokeh's Python version syntax.

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

# Standard library imports
import re

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
    'is_valid_version',
)

_BASE_VERSION_PAT = re.compile(r"\d+\.\d+\.\d+")
_VERSION_PAT = re.compile(
    r"[0-9]+\.[0-9]+\.[0-9]+(?:(?:\.dev|rc)[0-9]+)?(?:\+[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)?",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def base_version() -> str:
    return _base_version_helper(__version__)


def is_full_release(version: str | None = None) -> bool:
    version = version or __version__
    return _BASE_VERSION_PAT.fullmatch(version) is not None


def is_valid_version(version: str) -> bool:
    '''Return whether a string uses Bokeh's Python version syntax.

    Accepts release, ``.devN``, and ``rcN`` versions with an optional local
    build suffix such as ``+local`` or ``+52.g87c2e72b.dirty``.
    '''
    return _VERSION_PAT.fullmatch(version) is not None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def npm_version(version: str | None) -> str:
    '''Convert a Python package version to npm version syntax.

    Args:
        version:
            The Python version, or ``None`` to use the installed Bokeh version.

    Returns:
        The corresponding npm release, prerelease, or development version.

    '''
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
    match = _BASE_VERSION_PAT.match(version)
    assert match is not None
    return match.group(0)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
