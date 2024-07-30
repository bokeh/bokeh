#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Enum property.

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
from typing import (
    Any,
    Literal,
    get_args,
    overload,
)

# Bokeh imports
from ...util.strings import nice_join
from .. import enums
from ._sphinx import model_link, property_link, register_type_link
from .bases import Init
from .primitive import String
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Enum',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Enum(String):
    """ Accept values from enumerations.

    The first value in enumeration is used as the default value, unless the
    ``default`` keyword argument is used.

    See :ref:`bokeh.core.enums` for more information.

    """

    _enum: enums.Enumeration

    @overload
    def __init__(self, enum: type[Literal[""]], *, default: Init[str] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__(self, enum: enums.Enumeration, *, default: Init[str] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__(self, enum: str, *values: str, default: Init[str] = ..., help: str | None = ...) -> None: ...

    def __init__(self, enum: str | type[Literal[""]] | enums.Enumeration, *values: str, default: Init[str] = Intrinsic, help: str | None = None) -> None:
        if isinstance(enum, str):
            self._enum = enums.enumeration(enum, *values)
        elif values:
            raise ValueError("unexpected enum values")
        elif isinstance(enum, enums.Enumeration):
            self._enum = enum
        else:
            self._enum = enums.enumeration(*get_args(enum))

        default = default if default is not Intrinsic else self._enum._default
        super().__init__(default=default, help=help)

    def __call__(self, *, default: Init[str] = Intrinsic, help: str | None = None) -> Enum:
        """ Clone this property and allow to override ``default`` and ``help``. """
        default = self._default if default is Intrinsic else default
        help = self._help if help is None else help
        prop = self.__class__(self._enum, default=default, help=help)
        prop.alternatives = list(self.alternatives)
        prop.assertions = list(self.assertions)
        return prop

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        allowed_values = ", ".join(repr(x) for x in self.allowed_values)
        return f"{class_name}({allowed_values})"

    @property
    def allowed_values(self) -> list[str]:
        return self._enum._values

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if value in self._enum:
            return

        msg = "" if not detail else f"invalid value: {value!r}; allowed values are {nice_join(self.allowed_values)}"
        raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Enum)
def _sphinx_type(obj: Enum) -> str:
    # try to return a link to a proper enum in bokeh.core.enums if possible
    if obj._enum in enums.__dict__.values():
        for name, value in enums.__dict__.items():
            if obj._enum is value:
                fullname = f"{obj._enum.__module__}.{name}"
                return f"{property_link(obj)}({model_link(fullname)})"

    # otherwise just a basic str name format
    return f"{property_link(obj)}({obj._enum})"
