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
from typing import Any, TypeAlias, TypeVar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Intrinsic",
    "Optional",
    "Undefined",
)

T = TypeVar("T")

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

Optional: TypeAlias = T | UndefinedType

# TODO turn this into an actual singleton class
class IntrinsicType:
    """ Indicates usage of the intrinsic default value of a property. """

    def __copy__(self) -> IntrinsicType:
        return self

    def __str__(self) -> str:
        return "Intrinsic"

    def __repr__(self) -> str:
        return "Intrinsic"

    def __eq__(self, other: Any) -> bool:
        return other is Intrinsic

    def __ne__(self, other: Any) -> bool:
        return other is not Intrinsic

Intrinsic = IntrinsicType()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
