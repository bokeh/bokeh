#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Either property.

The Either property is used to construct properties that an accept any of
multiple possible types.

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
from ...util.strings import nice_join
from ._sphinx import property_link, register_type_link, type_link
from .bases import (
    Init,
    ParameterizedProperty,
    Property,
    TypeOrInst,
)
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Either',
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Either(ParameterizedProperty[Any]):
    """ Accept values according to a sequence of other property types.

    Example:

        .. code-block:: python

            >>> class EitherModel(HasProps):
            ...     prop = Either(Bool, Int, Auto)
            ...

            >>> m = EitherModel()

            >>> m.prop = True

            >>> m.prop = 10

            >>> m.prop = "auto"

            >>> m.prop = 10.3   # ValueError !!

            >>> m.prop = "foo"  # ValueError !!

    """

    def __init__(self, type_param0: TypeOrInst[Property[Any]], *type_params: TypeOrInst[Property[Any]],
            default: Init[T] = Intrinsic, help: str | None = None) -> None:
        super().__init__(type_param0, *type_params, default=default, help=help)
        for tp in self.type_params:
            self.alternatives.extend(tp.alternatives)

    def transform(self, value: Any) -> Any:
        for param in self.type_params:
            try:
                return param.transform(value)
            except ValueError:
                pass

        raise ValueError(f"Could not transform {value!r}")

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if any(param.is_valid(value) for param in self.type_params):
            return

        msg = "" if not detail else f"expected an element of either {nice_join([ str(param) for param in self.type_params ])}, got {value!r}"
        raise ValueError(msg)

    def wrap(self, value):
        for tp in self.type_params:
            value = tp.wrap(value)
        return value

    def replace(self, old: type[Property[Any]], new: Property[Any]) -> Property[Any]:
        if self.__class__ == old:
            return new
        else:
            params = [ type_param.replace(old, new) for type_param in self.type_params ]
            return Either(*params)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Either)
def _sphinx_type_link(obj: Either[Any]):
    subtypes = ", ".join(type_link(x) for x in obj.type_params)
    return f"{property_link(obj)}({subtypes})"
