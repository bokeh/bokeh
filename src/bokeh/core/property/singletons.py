#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Internal primitives of the properties system. """

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
from typing import (
    Any,
    ClassVar,
    Self,
    cast,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "OldValueUnavailable",
    "Undefined",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class _Singleton:
    _instance: ClassVar[_Singleton | None] = None
    _name: ClassVar[str]
    _repr: ClassVar[str | None] = None

    __slots__ = ()

    def __new__(cls) -> Self:
        instance = cls.__dict__.get("_instance")
        if instance is None:
            instance = super().__new__(cls)
            cls._instance = instance
        return cast(Self, instance)

    def __copy__(self) -> Self:
        return self

    def __deepcopy__(self, _memo: dict[int, Any]) -> Self:
        return self

    def __reduce__(self) -> tuple[type[Any], tuple[()]]:
        return (type(self), ())

    def __str__(self) -> str:
        return self._name

    def __repr__(self) -> str:
        return self._repr if self._repr is not None else self._name

class UndefinedType(_Singleton):
    """ Indicates no value set, which is not the same as setting ``None``. """

    _name = "Undefined"

    __slots__ = ()

Undefined = UndefinedType()

class _OldValueUnavailableType(_Singleton):
    """Indicates that an incremental update didn't retain the previous value."""

    _name = "OldValueUnavailable"

    __slots__ = ()

#: Sentinel passed as ``old`` to property callbacks when an incremental
#: update doesn't retain the complete previous value.
OldValueUnavailable = _OldValueUnavailableType()

class _NotGivenType(_Singleton):
    """ Indicates that an optional internal argument wasn't provided. """

    _name = "NotGiven"
    _repr = "..."

    __slots__ = ()

_NotGiven = _NotGivenType()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
