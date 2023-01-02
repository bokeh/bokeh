#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" This module is intended for use in  CI workflows to help with validating
built sdist, wheel, and conda packages.

"""

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
import filecmp
from pathlib import Path

# Bokeh imports
from .. import __version__, resources
from .version import is_full_release

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ('validate',)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def validate(*, version: str | None = None, build_dir: str | None = None) -> list[str]:
    """ Perform some basic package validation checks for the installed package.

    Args:
        version (str | None, optional) :
            A version to compare against the package's reported version

        build_dir (str | None, optional) :
            A path to a JS build dir to make detailed BokehJS file comparisons

    Returns:
        list[str]
            A list of all errors encountered

    """
    errors = []

    if version is None:
        # This can happen under certain circumstances
        if __version__ == "0.0.0":
            errors.append("Invalid version 0.0.0")
    elif version != __version__:
        errors.append(f"Version mismatch: given version ({version}) != package version ({__version__})")

    if is_full_release(__version__) and __version__ != "0.0.0":
        try:
            resources.verify_sri_hashes()
        except RuntimeError as e:
            errors.append(f"SRI hashes for BokehJS files could not be verified: {e}")

    r = resources.Resources(mode="absolute")
    rmin = resources.Resources(mode="absolute", minified=True)
    package_js_paths = r.js_files + rmin.js_files

    for path in package_js_paths:
        package_path = Path(path)
        if not package_path.exists():
            errors.append(f"missing BokehJS file: {path}")
        elif package_path.stat().st_size == 0:
            errors.append(f"Empty BokehJS file: {path}")
        elif build_dir is not None:
            build_path = Path(build_dir) / "js" / package_path.name
            try:
                if not filecmp.cmp(build_path, package_path):
                    errors.append(f"BokehJS package file differs from build dir file: {package_path}")
            except FileNotFoundError:
                errors.append(f"missing build dir file: {build_path}")

    if not Path(__file__).parents[1].joinpath("py.typed").exists():
        errors.append("py.typed is missing")

    return errors

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# Support basic ``python -m bokeh.util.package <version> <build_dir>`` usage
#
# No serious arg parsing, only intended for use in CI
if __name__ == "__main__":
    import sys
    version = sys.argv[1] if len(sys.argv) >= 2 else None
    build_dir = sys.argv[2] if len(sys.argv) >= 3 else None
    errors = validate(version=version, build_dir=build_dir)
    for error in errors:
        print(error)
    sys.exit(len(errors) != 0)
