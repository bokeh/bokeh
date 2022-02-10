#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Instance property.

The Instance property is used to construct object graphs of Bokeh models,
where one Bokeh model refers to another.

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
from importlib import import_module
from typing import (
    Any,
    Callable,
    Type,
    TypeVar,
)

# Bokeh imports
from ..serialization import Serializable
from ._sphinx import model_link, property_link, register_type_link
from .bases import Init, Property
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Instance',
)

T = TypeVar("T", bound=Serializable)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Instance(Property[T]):
    """ Accept values that are instances of serializable types (e.g. |HasProps|).

    Args:
        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    """
    _instance_type: Type[T] | Callable[[], Type[T]] | str

    def __init__(self, instance_type: Type[T] | Callable[[], Type[T]] | str, default: Init[T] = Undefined,
            help: str | None = None, readonly: bool = False, serialized: bool | None = None):
        if not (isinstance(instance_type, (type, str)) or callable(instance_type)):
            raise ValueError(f"expected a type, fn() -> type, or string, got {instance_type}")

        if isinstance(instance_type, type):
            self._assert_serializable(instance_type)

        self._instance_type = instance_type

        super().__init__(default=default, help=help, readonly=readonly, serialized=serialized)

    @staticmethod
    def _assert_serializable(instance_type: Type[Any]) -> None:
        if not (isinstance(instance_type, type) and issubclass(instance_type, Serializable)):
            raise ValueError(f"expected a subclass of Serializable (e.g. HasProps), got {instance_type}")

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        instance_type = self.instance_type.__name__
        return f"{class_name}({instance_type})"

    @property
    def has_ref(self) -> bool:
        return True

    @property
    def instance_type(self) -> Type[Serializable]:
        instance_type: Type[Serializable]
        if isinstance(self._instance_type, type):
            instance_type = self._instance_type
        elif isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            instance_type = getattr(import_module(module, "bokeh"), name)
            self._assert_serializable(instance_type)
            self._instance_type = instance_type
        else:
            instance_type = self._instance_type()
            self._assert_serializable(instance_type)
            self._instance_type = instance_type

        return instance_type

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, self.instance_type):
            return

        instance_type = self.instance_type.__name__
        value_type = type(value).__name__
        msg = "" if not detail else f"expected an instance of type {instance_type}, got {value} of type {value_type}"
        raise ValueError(msg)

    def _may_have_unstable_default(self):
        # because the instance value is mutable
        return self._default is not Undefined

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Instance)
def _sphinx_type_link(obj):
    fullname = f"{obj.instance_type.__module__}.{obj.instance_type.__name__}"
    return f"{property_link(obj)}({model_link(fullname)})"
