#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
import platform
import sys

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings
from bokeh.util.compiler import nodejs_version, npmjs_version
from bokeh.util.dependencies import import_optional
from bokeh.util.settings import get_all_settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "print_info",
    "print_non_default_settings",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def print_info() -> None:
    """ Print version information about Bokeh, Python, the operating system
    and a selected set of dependencies.
    """
    # Keep one print() per line, so that users don't have to wait a long
    # time for all libraries and dependencies to get loaded.
    newline = '\n'
    print(f"Python version        :  {sys.version.split(newline)[0]}")
    print(f"IPython version       :  {_if_installed(_version('IPython', '__version__'))}")
    print(f"Tornado version       :  {_if_installed(_version('tornado', 'version'))}")
    print(f"NumPy version         :  {_if_installed(_version('numpy', '__version__'))}")
    print(f"Bokeh version         :  {__version__}")
    print(f"BokehJS static path   :  {settings.bokehjs_path()}")
    print(f"node.js version       :  {_if_installed(nodejs_version())}")
    print(f"npm version           :  {_if_installed(npmjs_version())}")
    print(f"jupyter_bokeh version :  {_if_installed(_version('jupyter_bokeh', '__version__'))}")
    print(f"Operating system      :  {platform.platform()}")

def print_non_default_settings() -> None:
    """ Print non-default settings in a table format. """

    all_settings = get_all_settings()

    non_default_settings = []
    for name, descriptor in all_settings.items():
        try:
            if descriptor.is_set:
                non_default_settings.append((name, descriptor()))
        except Exception:
            continue

    if not non_default_settings:
        print("\nNo set (non-default) settings found")
        return

    print("\nSet (non-default) Bokeh Settings:")
    print("=" * 40)
    print(f"{'Setting':<25} {'Value':<25}")
    print("-" * 40)

    for name, current_value in non_default_settings:
        print(f"{name:<25} {current_value!s:<20}")

    print("-" * 40)

#-----------------------------------------------------------------------------
# Legacy API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _if_installed(version_or_none: str | None) -> str:
    """ Return the given version or not installed if ``None``.
    """
    return version_or_none or "(not installed)"

def _version(module_name: str, attr: str) -> str | None:
    """ Get the version of a module if installed.
    """
    module = import_optional(module_name)
    return getattr(module, attr) if module else None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
