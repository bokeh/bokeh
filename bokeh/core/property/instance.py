#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
    Dict,
    Type,
    TypeVar,
)

# Bokeh imports
from ._sphinx import model_link, property_link, register_type_link
from .bases import DeserializationError, Init, Property
from .singletons import Undefined

if TYPE_CHECKING:
    from ..has_props import HasProps
    from ..types import JSON

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
    _instance_type: Type[T] | str

    def __init__(self, instance_type: Type[T] | str, default: Init[T] = Undefined,
            help: str | None = None, readonly: bool = False, serialized: bool | None = None):
        if not isinstance(instance_type, (type, str)):
            raise ValueError(f"expected a type or string, got {instance_type}")

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
        if isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)

        return self._instance_type

    def from_json(self, json: JSON, *, models: Dict[str, HasProps] | None = None) -> T:
        if isinstance(json, dict):
            from ...model import Model
            if issubclass(self.instance_type, Model):
                if models is None:
                    raise DeserializationError(f"{self} can't deserialize without models")
                else:
                    model = models.get(json["id"])

                    if model is not None:
                        return model
                    else:
                        raise DeserializationError(f"{self} failed to deserialize reference to {json}")
            else:
                attrs = {}

                for name, value in json.items():
                    prop_descriptor = self.instance_type.lookup(name).property
                    attrs[name] = prop_descriptor.from_json(value, models=models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError(f"{self} expected a dict, got {json}")

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
        return True

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
    return f"{property_link(obj)}({model_link(fullname)}"
