#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``Required`` property. """

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
from typing import Any, TypeVar

# Bokeh imports
from ._sphinx import property_link, register_type_link, type_link
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
    "Required",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Required(SingleParameterizedProperty[T]):
    """ A property accepting a value of some other type while having undefined default. """

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

@register_type_link(Required)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.type_param)})"
