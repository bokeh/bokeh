#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``Nullable`` and ``NonNullable`` properties. """

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
from typing import Any, TypeVar, Union

# Bokeh imports
from ...util.deprecation import deprecated
from ._sphinx import property_link, register_type_link, type_link
from .bases import (
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .required import Required
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "NonNullable",
    "Nullable",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Nullable(SingleParameterizedProperty[Union[T, None]]):
    """ A property accepting ``None`` or a value of some other type. """

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T | None] = None, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def transform(self, value: Any) -> T | None:
        return None if value is None else super().transform(value)

    def wrap(self, value: Any) -> Any:
        return None if value is None else super().wrap(value)

    def validate(self, value: Any, detail: bool = True) -> None:
        if value is None:
            return

        try:
            super().validate(value, detail=False)
        except ValueError:
            pass
        else:
            return

        msg = "" if not detail else f"expected either None or a value of type {self.type_param}, got {value!r}"
        raise ValueError(msg)

class NonNullable(Required[T]):
    """
    A property accepting a value of some other type while having undefined default.

    .. deprecated:: 3.0.0

        Use ``bokeh.core.property.required.Required`` instead.
    """

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T] = Undefined, help: str | None = None) -> None:
        deprecated((3, 0, 0), "NonNullable(Type)", "Required(Type)")
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

@register_type_link(Nullable)
@register_type_link(NonNullable)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.type_param)})"
