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
from typing import Any

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Optional",
    "Undefined",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# TODO turn this into an actual singleton class
class UndefinedType:
    """ Indicates no value set, which is not the same as setting ``None``. """

    def __copy__(self) -> UndefinedType:
        return self

    def __str__(self) -> str:
        return "Undefined"

    def __repr__(self) -> str:
        return "Undefined"

    def __eq__(self, other: Any) -> bool:
        return other is Undefined

    def __ne__(self, other: Any) -> bool:
        return other is not Undefined

Undefined = UndefinedType()

type Optional[T] = T | UndefinedType

class _NotGivenType:
    """ Indicates that an optional internal argument wasn't provided. """

    def __copy__(self) -> _NotGivenType:
        return self

    def __str__(self) -> str:
        return "NotGiven"

    def __repr__(self) -> str:
        return "NotGiven"

    def __eq__(self, other: Any) -> bool:
        return other is _NotGiven

    def __ne__(self, other: Any) -> bool:
        return other is not _NotGiven

_NotGiven = _NotGivenType()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
