#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for checking dependencies

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
from importlib import import_module
from types import ModuleType

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'import_optional',
    'import_required',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def import_optional(mod_name: str) -> ModuleType | None:
    ''' Attempt to import an optional dependency.

    Silently returns None if the requested module is not available.

    Args:
        mod_name (str) : name of the optional module to try to import

    Returns:
        imported module or None, if import fails

    '''
    try:
        return import_module(mod_name)
    except ImportError:
        pass
    except Exception:
        msg = f"Failed to import optional module `{mod_name}`"
        log.exception(msg)

    return None


def import_required(mod_name: str, error_msg: str) -> ModuleType:
    ''' Attempt to import a required dependency.

    Raises a RuntimeError if the requested module is not available.

    Args:
        mod_name (str) : name of the required module to try to import
        error_msg (str) : error message to raise when the module is missing

    Returns:
        imported module

    Raises:
        RuntimeError

    '''
    try:
        return import_module(mod_name)
    except ImportError as e:
        raise RuntimeError(error_msg) from e

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
