#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various ways for constraining values of other properties.

"""

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
    "TypeOfAttr",
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TypeOfAttr(SingleParameterizedProperty[T]):
    """ Allows to check if an attribute of an object satisfies the
    given type or a collection of types.

    """

    def __init__(
        self,
        type_param: TypeOrInst[Property[T]],
        name: str,
        type: TypeOrInst[Property[Any]],
        *,
        default: Init[T] = Intrinsic,
        help: str | None = None,
    ) -> None:
        super().__init__(type_param, default=default, help=help)
        self._query_name = name
        self._query_type = self._validate_type_param(type)

    def __call__(self, *, default: Init[T] = Intrinsic, help: str | None = None) -> TypeOfAttr[T]:
        """ Clone this property and allow to override ``default`` and ``help``. """
        default = self._default if default is Intrinsic else default
        help = self._help if help is None else help
        prop = self.__class__(self.type_param, self._query_name, self._query_type, default=default, help=help)
        prop.alternatives = list(self.alternatives)
        prop.assertions = list(self.assertions)
        return prop

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        return f"{class_name}({self.type_param}, {self._query_name!r}, {self._query_type})"

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        name = self._query_name
        type = self._query_type

        try:
            attr = getattr(value, name)
        except AttributeError:
            raise ValueError(f"expected {value!r} to have an attribute '{name}'" if detail else "")

        if type.is_valid(attr):
            return

        raise ValueError(f"expected {value!r} to have an attribute {name!r} of type {type}" if detail else "")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(TypeOfAttr)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f"{property_link(obj)}({type_link(obj.type_param)})"
