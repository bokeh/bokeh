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

from typing import Any, overload

from ._sphinx import property_link, register_type_link, type_link
from .bases import (
    Init,
    ParameterizedProperty,
    Property,
    TypeOrInst,
)
from .exceptions import ValidationError
from .singletons import _NotGiven

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Either',
)

type _TypeParam[G, S] = TypeOrInst[Property[G, S]]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Either[G, S = G](ParameterizedProperty[G, S]):
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

            >>> m.prop = 10.3   # ValidationError !!

            >>> m.prop = "foo"  # ValidationError !!

    """

    # Infer value types from type parameters, so that they aren't inferred from
    # ``default`` instead. The last overload covers subclasses and annotated
    # assignments with fixed value types, which don't match the other overloads
    # because Property[G, S] is invariant.
    @overload
    def __init__[G1, S1](
        self: Either[G1, S1],
        tp1: _TypeParam[G1, S1],
        /, *,
        default: Init[S1] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2](
        self: Either[G1 | G2, S1 | S2],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2],
        /, *,
        default: Init[S1 | S2] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3](
        self: Either[G1 | G2 | G3, S1 | S2 | S3],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3],
        /, *,
        default: Init[S1 | S2 | S3] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3, G4, S4](
        self: Either[G1 | G2 | G3 | G4, S1 | S2 | S3 | S4],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3], tp4: _TypeParam[G4, S4],
        /, *,
        default: Init[S1 | S2 | S3 | S4] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3, G4, S4, G5, S5](
        self: Either[G1 | G2 | G3 | G4 | G5, S1 | S2 | S3 | S4 | S5],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3], tp4: _TypeParam[G4, S4],
        tp5: _TypeParam[G5, S5],
        /, *,
        default: Init[S1 | S2 | S3 | S4 | S5] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3, G4, S4, G5, S5, G6, S6](
        self: Either[G1 | G2 | G3 | G4 | G5 | G6, S1 | S2 | S3 | S4 | S5 | S6],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3], tp4: _TypeParam[G4, S4],
        tp5: _TypeParam[G5, S5], tp6: _TypeParam[G6, S6],
        /, *,
        default: Init[S1 | S2 | S3 | S4 | S5 | S6] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3, G4, S4, G5, S5, G6, S6, G7, S7](
        self: Either[G1 | G2 | G3 | G4 | G5 | G6 | G7, S1 | S2 | S3 | S4 | S5 | S6 | S7],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3], tp4: _TypeParam[G4, S4],
        tp5: _TypeParam[G5, S5], tp6: _TypeParam[G6, S6], tp7: _TypeParam[G7, S7],
        /, *,
        default: Init[S1 | S2 | S3 | S4 | S5 | S6 | S7] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__[G1, S1, G2, S2, G3, S3, G4, S4, G5, S5, G6, S6, G7, S7, G8, S8](
        self: Either[G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8, S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8],
        tp1: _TypeParam[G1, S1], tp2: _TypeParam[G2, S2], tp3: _TypeParam[G3, S3], tp4: _TypeParam[G4, S4],
        tp5: _TypeParam[G5, S5], tp6: _TypeParam[G6, S6], tp7: _TypeParam[G7, S7], tp8: _TypeParam[G8, S8],
        /, *,
        default: Init[S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__(
        self,
        type_param0: TypeOrInst[Property[Any]],
        *type_params: TypeOrInst[Property[Any]],
        default: Init[S] = ...,  # pyright: ignore[reportInvalidTypeVarUse]
        help: str | None = ...,
    ) -> None: ...
    def __init__(
        self,
        type_param0: TypeOrInst[Property[Any]],
        *type_params: TypeOrInst[Property[Any]],
        default: Init[Any] = _NotGiven,
        help: str | None = None,
    ) -> None:
        super().__init__(type_param0, *type_params, default=default, help=help)
        for tp in self.type_params:
            self.alternatives.extend(tp.alternatives)

    def transform(self, value: Any) -> G:
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

        from ...util.strings import nice_join

        msg = "" if not detail else f"expected an element of either {nice_join([ str(param) for param in self.type_params ])}, got {value!r}"
        raise ValidationError(msg)

    def wrap(self, value: G) -> G:
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
def _sphinx_type_link(obj: Either[Any]) -> str:
    subtypes = ", ".join(type_link(x) for x in obj.type_params)
    return f"{property_link(obj)}({subtypes})"
