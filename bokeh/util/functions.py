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
from typing import Any, List, Optional, Tuple, TypeVar, Union, overload

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

def url_join(*parts: str) -> str:
    if not parts:
        return ""

    leading = "/" if parts[0].startswith("/") else ""
    trailing = "/" if parts[-1].endswith("/") else ""

    stripped = [ part.strip("/") for part in parts ]
    nonempty = [ part for part in stripped if part != "" ]

    return f"{leading}{'/'.join(nonempty)}{trailing}"

def or_else(this: Optional[T], that: T) -> T:
    return this if this is not None else that

@overload
def list_of(obj: List[T]) -> List[T]: ...
@overload
def list_of(obj: T) -> List[T]: ...

def list_of(obj: Union[List[T], T]) -> List[T]:
    return obj if isinstance(obj, list) else [obj]

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
