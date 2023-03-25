#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Struct property.

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
from typing import Any, Generic, TypeVar

# Bokeh imports
from .bases import ParameterizedProperty, Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Struct',
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Optional(Generic[T]):

    def __init__(self, type_param: Property[T]):
        self.type_param = type_param

class Struct(ParameterizedProperty[T]):
    """ Accept values that are structures.


    """

    _fields: dict[str, Property[Any]]
    _optional: set[str]

    def __init__(self, **fields) -> None:
        default = fields.pop("default", None)
        help = fields.pop("help", None)

        self._fields = {}
        self._optional = set()

        for name, type in fields.items():
            if isinstance(type, Optional):
                self._optional.add(name)
                type = type.type_param

            self._fields[name] = self._validate_type_param(type, help_allowed=True) # XXX

        super().__init__(default=default, help=help)

    def __eq__(self, other: object) -> bool:
        if isinstance(other, self.__class__):
            return super().__eq__(other) and self._fields == other._fields and self._optional == other._optional
        else:
            return False

    @property
    def type_params(self):
        return list(self._fields.values())

    def validate(self, value: Any, detail: bool = True):
        super().validate(value, detail)

        if isinstance(value, dict) and len(value) <= len(self._fields):
            for name, type in self._fields.items():
                if name not in value:
                    if name not in self._optional:
                        break
                elif not type.is_valid(value[name]):
                    break
            else:
                for name in value.keys():
                    if name not in self._fields:
                        break
                else:
                    return

        msg = "" if not detail else f"expected an element of {self}, got {value!r}"
        raise ValueError(msg)

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        fields = ", ".join(f"{name}={typ}" for name, typ in self._fields.items())
        return f"{class_name}({fields})"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
