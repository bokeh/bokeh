#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides helper function for dealing with dataclasses.

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
from dataclasses import (
    dataclass,
    field,
    fields,
    is_dataclass,
)
from typing import (
    Any,
    Iterable,
    Tuple,
    TypeVar,
    Union,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "NotRequired",
    "Unspecified",
    "dataclass",
    "entries",
    "field",
    "fields",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class _UnspecifiedType:
    def __repr__(self) -> str:
        return "Unspecified"

Unspecified = _UnspecifiedType()

_T = TypeVar("_T")
NotRequired = Union[_UnspecifiedType, _T]

def entries(obj: Any) -> Iterable[Tuple[str, Any]]:
    """ Iterate over a dataclass' fields and their values. """
    if is_dataclass(obj) and not isinstance(obj, type):
        for f in fields(obj):
            value = getattr(obj, f.name)
            if value is not Unspecified:
                yield (f.name, value)
    else:
        raise TypeError(f"expected a dataclass, got {type(obj)}")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
