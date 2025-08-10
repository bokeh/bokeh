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
from bokeh.settings import PrioritizedSetting, settings
from bokeh.util.compiler import nodejs_version, npmjs_version
from bokeh.util.dependencies import import_optional

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

    all_settings = [
        (name, attr) for name, attr in settings.__class__.__dict__.items()
        if isinstance(attr, PrioritizedSetting)
    ]

    non_default_settings = []
    for name, attr in all_settings:
        try:
            current_value = getattr(settings, name)()

            if str(current_value).lower() != str(attr.default).lower():
                non_default_settings.append((name, attr, current_value))
        except Exception:
            continue

    if not non_default_settings:
        print()
        print("No non-default settings found")
        return

    non_default_settings.sort(key=lambda x: x[0])

    print()
    print("Non-default Bokeh Settings:")
    print("=" * 60)
    print(f"{'Setting':<25} {'Default':<25} {'Value':<25}")
    print("-" * 60)

    for name, attr, current_value in non_default_settings:
        value_str = "None" if current_value is None else str(current_value)
        default_str = "None" if attr.default is None else str(attr.default)

        print(f"{name:<25} {default_str:<25} {value_str:<20}")

    print("-" * 60)

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
