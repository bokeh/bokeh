#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for function introspection.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from inspect import Signature
from typing import Any, List, Optional, Tuple, TypeVar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

T = TypeVar("T")

__all__ = (
    'get_param_info',
    'or_else',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def or_else(this: Optional[T], that: T) -> T:
    return this if this is not None else that

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

def get_param_info(sig: Signature) -> Tuple[List[str], List[Any]]:
    ''' Find parameters with defaults and return them.

    Arguments:
        sig (Signature) : a function signature

    Returns:
        tuple(list, list) : parameters with defaults

    '''
    defaults = []
    for param in sig.parameters.values():
        if param.default is not param.empty:
            defaults.append(param.default)
    return list(sig.parameters), defaults
