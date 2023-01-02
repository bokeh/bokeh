#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from typing import Any, overload

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

    @overload
    def __init__(self, enum: enums.Enumeration, *, default: Init[str] = ..., help: str | None = ...) -> None: ...
    @overload
    def __init__(self, enum: str, *values: str, default: Init[str] = ..., help: str | None = ...) -> None: ...

    def __init__(self, enum: str | enums.Enumeration, *values: str, default: Init[str] = Intrinsic, help: str | None = None) -> None:
        if not (not values and isinstance(enum, enums.Enumeration)):
            enum = enums.enumeration(enum, *values)
        self._enum = enum

        default = default if default is not Intrinsic else enum._default
        super().__init__(default=default, help=help)

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
