#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``NotSerialized`` property. """

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
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "NotSerialized",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class NotSerialized(SingleParameterizedProperty[T]):
    """
    A property which state won't be synced with the browser.
    """

    _serialized = False

    def __init__(self, type_param: TypeOrInst[Property[T]], *,
            default: Init[T] = Intrinsic, help: str | None = None) -> None:
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

@register_type_link(NotSerialized)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.type_param)})"
