#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

__all__ = (
    "Intrinsic",
    "Undefined",
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class UndefinedType:
    """ Indicates no value set, which is not the same as setting ``None``. """

    def __copy__(self) -> UndefinedType:
        return self

    def __str__(self) -> str:
        return "Undefined"

    def __repr__(self) -> str:
        return "Undefined"

Undefined = UndefinedType()

class IntrinsicType:
    """ Indicates usage of the intrinsic default value of a property. """

    def __copy__(self) -> IntrinsicType:
        return self

    def __str__(self) -> str:
        return "Intrinsic"

    def __repr__(self) -> str:
        return "Intrinsic"

Intrinsic = IntrinsicType()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
