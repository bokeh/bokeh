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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from importlib import import_module

# Bokeh imports
from .bases import DeserializationError, Property
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Instance',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Instance(Property):
    """ Accept values that are instances of |HasProps|.

    Args:
        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    """
    def __init__(self, instance_type, default=Undefined, help=None, readonly=False, serialized=None):
        if not isinstance(instance_type, (type, str)):
            raise ValueError(f"expected a type or string, got {instance_type}")

        from ..has_props import HasProps
        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError(f"expected a subclass of HasProps, got {instance_type}")

        self._instance_type = instance_type

        super().__init__(default=default, help=help, readonly=readonly, serialized=serialized)

    def __str__(self):
        class_name = self.__class__.__name__
        instance_type = self.instance_type.__name__
        return f"{class_name}({instance_type})"

    @property
    def has_ref(self):
        return True

    @property
    def instance_type(self):
        if isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)

        return self._instance_type

    def from_json(self, json, models=None):
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
                    attrs[name] = prop_descriptor.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError(f"{self} expected a dict, got {json}")

    def validate(self, value, detail=True):
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

    def _sphinx_type(self):
        fullname = f"{self.instance_type.__module__}.{self.instance_type.__name__}"
        return f"{self._sphinx_prop_link()}({self._sphinx_model_link(fullname)})"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
