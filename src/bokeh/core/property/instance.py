#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import types
from importlib import import_module
from typing import (
    Any,
    Callable,
    Generic,
    TypeVar,
)

# Bokeh imports
from ..has_props import HasProps
from ..serialization import Serializable
from ._sphinx import model_link, property_link, register_type_link
from .bases import Init, Property
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Instance',
    'InstanceDefault',
    'Object',
)

T = TypeVar("T", bound=object)
S = TypeVar("S", bound=Serializable)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Object(Property[T]):
    """ Accept values that are instances of any class.

        .. note::
            This is primarily useful for validation purpose. Non-serializable
            objects will fail regardless during the serialization process.

    """

    _instance_type: type[T] | Callable[[], type[T]] | str

    def __init__(self, instance_type: type[T] | Callable[[], type[T]] | str, default: Init[T] = Undefined, help: str | None = None):
        if not (isinstance(instance_type, (type, str)) or callable(instance_type)):
            raise ValueError(f"expected a type, fn() -> type, or string, got {instance_type}")

        if isinstance(instance_type, type):
            self._assert_type(instance_type)

        self._instance_type = instance_type

        super().__init__(default=default, help=help)

    @staticmethod
    def _assert_type(instance_type: type[Any]) -> None:
        pass

    def __str__(self) -> str:
        class_name = self.__class__.__name__
        instance_type = self.instance_type.__name__
        return f"{class_name}({instance_type})"

    @property
    def has_ref(self) -> bool:
        return True

    @property
    def instance_type(self) -> type[T]:
        instance_type: type[Serializable]
        if isinstance(self._instance_type, type):
            instance_type = self._instance_type
        elif isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            instance_type = getattr(import_module(module, "bokeh"), name)
            self._assert_type(instance_type)
            self._instance_type = instance_type
        else:
            instance_type = self._instance_type()
            self._assert_type(instance_type)
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

class Instance(Object[S]):
    """ Accept values that are instances of serializable types (e.g. |HasProps|). """

    @staticmethod
    def _assert_type(instance_type: type[Any]) -> None:
        if not (isinstance(instance_type, type) and issubclass(instance_type, Serializable)):
            raise ValueError(f"expected a subclass of Serializable (e.g. HasProps), got {instance_type}")

I = TypeVar("I", bound=HasProps)

class InstanceDefault(Generic[I]):
    """ Provide a deferred initializer for Instance defaults.

    This is useful for Bokeh models with Instance properties that should have
    unique default values for every model instance. Using an InstanceDefault
    will afford better user-facing documentation than a lambda initializer.

    """
    def __init__(self, model: type[I], **kwargs: Any) -> None:
        self._model = model
        self._kwargs = kwargs

    def __call__(self) -> I:
        return self._model(**self._kwargs)

    def __repr__(self) -> str:
        kwargs = ", ".join(f"{key}={val}" for key, val in self._kwargs.items())
        return f"<Instance: {self._model.__qualified_model__}({kwargs})>"

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
def _sphinx_type_link(obj: Instance[Any]) -> str:
    # Sphinx links may be generated during docstring processing which means
    # we can't necessarily evaluate pure function (e.g. lambda) Instance
    # initializers, since they may contain circular references to the (not
    # yet fully defined at this point) Model
    if isinstance(obj._instance_type, types.FunctionType):
        return f"{property_link(obj)}"
    if isinstance(obj._instance_type, str):
        return f"{property_link(obj)}({obj._instance_type!r})"

    model = obj.instance_type
    model_name = f"{model.__module__}.{model.__name__}"
    return f"{property_link(obj)}({model_link(model_name)})"
