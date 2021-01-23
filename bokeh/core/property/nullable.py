#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``Nullable`` and ``NonNullable`` properties. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from .bases import SingleParameterizedProperty
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "NonNullable",
    "Nullable",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Nullable(SingleParameterizedProperty):
    """ A property accepting ``None`` or a value of some other type. """

    def __init__(self, type_param, *, default=None, help=None, serialized=None, readonly=False):
        super().__init__(type_param, default=default, help=help, serialized=serialized, readonly=readonly)

    def from_json(self, json, models=None):
        return None if json is None else super().from_json(json, models=models)

    def transform(self, value):
        return None if value is None else super().transform(value)

    def wrap(self, value):
        return None if value is None else super().wrap(value)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail=detail)

        if value is None or self.type_param.is_valid(value):
            return

        msg = "" if not detail else f"expected either None or a value of type {self.type_param}, got {value!r}"
        raise ValueError(msg)

class NonNullable(SingleParameterizedProperty):
    """ A property accepting a value of some other type while having undefined default. """

    def __init__(self, type_param, *, default=Undefined, help=None, serialized=None, readonly=False):
        super().__init__(type_param, default=default, help=help, serialized=serialized, readonly=readonly)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail=detail)
        self.type_param.validate(value, detail=detail)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
