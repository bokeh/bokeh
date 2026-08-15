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
from typing import Any, ClassVar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Undefined",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class UndefinedType:
    """ Indicates no value set, which is not the same as setting ``None``. """

    _instance: ClassVar[UndefinedType | None] = None

    __slots__ = ()

    def __new__(cls) -> UndefinedType:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __copy__(self) -> UndefinedType:
        return self

    def __deepcopy__(self, _memo: dict[int, Any]) -> UndefinedType:
        return self

    def __reduce__(self) -> tuple[type[UndefinedType], tuple[()]]:
        return (UndefinedType, ())

    def __str__(self) -> str:
        return "Undefined"

    def __repr__(self) -> str:
        return "Undefined"

Undefined = UndefinedType()

class _NotGivenType:
    """ Indicates that an optional internal argument wasn't provided. """

    _instance: ClassVar[_NotGivenType | None] = None

    __slots__ = ()

    def __new__(cls) -> _NotGivenType:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __copy__(self) -> _NotGivenType:
        return self

    def __deepcopy__(self, _memo: dict[int, Any]) -> _NotGivenType:
        return self

    def __reduce__(self) -> tuple[type[_NotGivenType], tuple[()]]:
        return (_NotGivenType, ())

    def __str__(self) -> str:
        return "NotGiven"

    def __repr__(self) -> str:
        return "..."

_NotGiven = _NotGivenType()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
