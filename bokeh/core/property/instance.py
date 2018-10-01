#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from importlib import import_module

# External imports
from six import iteritems, string_types

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



    '''
    def __init__(self, instance_type, default=None, help=None):
        if not isinstance(instance_type, (type,) + string_types):
            raise ValueError("expected a type or string, got %s" % instance_type)

        from ..has_props import HasProps
        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError("expected a subclass of HasProps, got %s" % instance_type)

        self._instance_type = instance_type

        super(Instance, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.instance_type.__name__)

    @property
    def has_ref(self):
        return True

    @property
    def instance_type(self):
        if isinstance(self._instance_type, string_types):
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

                for name, value in iteritems(json):
                    prop_descriptor = self.instance_type.lookup(name).property
                    attrs[name] = prop_descriptor.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

    def validate(self, value, detail=True):
        super(Instance, self).validate(value, detail)

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
