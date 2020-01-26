#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the Instance property.

The Instance property is used to construct object graphs of Bokeh models,
where one Bokeh model refers to another.

'''

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
    ''' Accept values that are instances of |HasProps|.

    Args:
        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    '''
    def __init__(self, instance_type, default=None, help=None, readonly=False, serialized=True):
        if not isinstance(instance_type, (type, str)):
            raise ValueError("expected a type or string, got %s" % instance_type)

        from ..has_props import HasProps
        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError("expected a subclass of HasProps, got %s" % instance_type)

        self._instance_type = instance_type

        super().__init__(default=default, help=help, readonly=readonly, serialized=True)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.instance_type.__name__)

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
        if json is None:
            return None
        elif isinstance(json, dict):
            from ...model import Model
            if issubclass(self.instance_type, Model):
                if models is None:
                    raise DeserializationError("%s can't deserialize without models" % self)
                else:
                    model = models.get(json["id"])

                    if model is not None:
                        return model
                    else:
                        raise DeserializationError("%s failed to deserialize reference to %s" % (self, json))
            else:
                attrs = {}

                for name, value in json.items():
                    prop_descriptor = self.instance_type.lookup(name).property
                    attrs[name] = prop_descriptor.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if value is not None:
            if not isinstance(value, self.instance_type):
                msg = "" if not detail else "expected an instance of type %s, got %s of type %s" % (self.instance_type.__name__, value, type(value).__name__)
                raise ValueError(msg)

    def _may_have_unstable_default(self):
        # because the instance value is mutable
        return True

    def _sphinx_type(self):
        fullname = "%s.%s" % (self.instance_type.__module__, self.instance_type.__name__)
        return self._sphinx_prop_link() + "( %s )" % self._sphinx_model_link(fullname)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
