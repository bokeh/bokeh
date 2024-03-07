#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide readonly properties. """

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
from typing import TypeVar

# Bokeh imports
from .bases import (
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Readonly",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Readonly(SingleParameterizedProperty[T]):
    """ A property that can't be manually modified by the user. """

    _readonly = True

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T] = Undefined, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
