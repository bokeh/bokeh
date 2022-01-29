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
    TYPE_CHECKING,
    Any,
    Callable,
    Type,
    TypeVar,
)

# Bokeh imports
from ._sphinx import model_link, property_link, register_type_link
from .bases import Init, Property
from .singletons import Undefined

if TYPE_CHECKING:
    from ..has_props import HasProps

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Instance',
)

T = TypeVar("T", bound="HasProps")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Instance(Property[T]):
    """ Accept values that are instances of |HasProps|.

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

        from ..has_props import HasProps
        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError(f"expected a subclass of HasProps, got {instance_type}")

        self._instance_type = instance_type

        super().__init__(default=default, help=help, readonly=readonly, serialized=serialized)

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        instance_type = self.instance_type.__name__
        return f"{class_name}({instance_type})"

    @property
    def has_ref(self) -> bool:
        return True

    @property
    def instance_type(self) -> Type[HasProps]:
        if isinstance(self._instance_type, type):
            pass # just type-check, because type is callable (see the last condition)
        elif isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)
        elif callable(self._instance_type):
            self._instance_type = self._instance_type()

        return self._instance_type

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
