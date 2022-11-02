#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from dataclasses import dataclass, field, fields
from typing import (
    TYPE_CHECKING,
    Any,
    Iterable,
    TypeVar,
    Union,
)

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

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
    "is_dataclass",
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
NotRequired: TypeAlias = Union[_UnspecifiedType, _T]

def entries(obj: Any) -> Iterable[tuple[str, Any]]:
    """ Iterate over a dataclass' fields and their values. """
    if is_dataclass(obj):
        for f in fields(obj):
            value = getattr(obj, f.name)
            if value is not Unspecified:
                yield (f.name, value)
    else:
        raise TypeError(f"expected a dataclass, got {type(obj)}")

def is_dataclass(obj: Any) -> bool:
    return hasattr(type(obj), "__dataclass_fields__")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
