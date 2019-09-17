#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from bokeh.util.future import collections_abc # goes away with py2

# External imports
from six import string_types, iteritems

# Bokeh imports
from ...util.serialization import decode_base64_dict, transform_column_source_data
from .bases import ContainerProperty, DeserializationError
from .descriptors import ColumnDataPropertyDescriptor
from .enum import Enum
from .numeric import Int
from .wrappers import PropertyValueColumnData, PropertyValueDict, PropertyValueList

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Array',
    'ColumnData',
    'Dict',
    'List',
    'RelativeDelta',
    'Seq',
    'Tuple',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Seq(ContainerProperty):
    ''' Accept non-string ordered sequences of values, e.g. list, tuple, array.

    '''

    def __init__(self, item_type, default=None, help=None):
        self.item_type = self._validate_type_param(item_type)
        super(Seq, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.item_type)

    @property
    def type_params(self):
        return [self.item_type]

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return self._new_instance([ self.item_type.from_json(item, models) for item in json ])
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

    def validate(self, value, detail=True):
        super(Seq, self).validate(value, True)

        if value is not None:
            if not (self._is_seq(value) and all(self.item_type.is_valid(item) for item in value)):
                if self._is_seq(value):
                    invalid = []
                    for item in value:
                        if not self.item_type.is_valid(item):
                            invalid.append(item)
                    msg = "" if not detail else "expected an element of %s, got seq with invalid items %r" % (self, invalid)
                    raise ValueError(msg)
                else:
                    msg = "" if not detail else "expected an element of %s, got %r" % (self, value)
                    raise ValueError(msg)

    @classmethod
    def _is_seq(cls, value):
        return ((isinstance(value, collections_abc.Sequence) or cls._is_seq_like(value)) and
                not isinstance(value, string_types))

    @classmethod
    def _is_seq_like(cls, value):
        return (isinstance(value, (collections_abc.Container, collections_abc.Sized, collections_abc.Iterable))
                and hasattr(value, "__getitem__") # NOTE: this is what makes it disallow set type
                and not isinstance(value, collections_abc.Mapping))

    def _new_instance(self, value):
        return value

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % self.item_type._sphinx_type()

class List(Seq):
    ''' Accept Python list values.

    '''

    def __init__(self, item_type, default=[], help=None):
        # todo: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super(List, self).__init__(item_type, default=default, help=help)

    @classmethod
    def wrap(cls, value):
        ''' Some property types need to wrap their values in special containers, etc.

        '''
        if isinstance(value, list):
            if isinstance(value, PropertyValueList):
                return value
            else:
                return PropertyValueList(value)
        else:
            return value

    @classmethod
    def _is_seq(cls, value):
        return isinstance(value, list)

class Array(Seq):
    ''' Accept NumPy array values.

    '''

    @classmethod
    def _is_seq(cls, value):
        import numpy as np
        return isinstance(value, np.ndarray)

    def _new_instance(self, value):
        import numpy as np
        return np.array(value)


class Dict(ContainerProperty):
    ''' Accept Python dict values.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    '''

    def __init__(self, keys_type, values_type, default={}, help=None):
        self.keys_type = self._validate_type_param(keys_type)
        self.values_type = self._validate_type_param(values_type)
        super(Dict, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s, %s)" % (self.__class__.__name__, self.keys_type, self.values_type)

    @property
    def type_params(self):
        return [self.keys_type, self.values_type]

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, dict):
            return { self.keys_type.from_json(key, models): self.values_type.from_json(value, models) for key, value in iteritems(json) }
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

    def validate(self, value, detail=True):
        super(Dict, self).validate(value, detail)

        if value is not None:
            if not (isinstance(value, dict) and \
                    all(self.keys_type.is_valid(key) and self.values_type.is_valid(val) for key, val in iteritems(value))):
                msg = "" if not detail else "expected an element of %s, got %r" % (self, value)
                raise ValueError(msg)

    @classmethod
    def wrap(cls, value):
        ''' Some property types need to wrap their values in special containers, etc.

        '''
        if isinstance(value, dict):
            if isinstance(value, PropertyValueDict):
                return value
            else:
                return PropertyValueDict(value)
        else:
            return value

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s, %s )" % (self.keys_type._sphinx_type(), self.values_type._sphinx_type())

class ColumnData(Dict):
    ''' Accept a Python dictionary suitable as the ``data`` attribute of a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    This class is a specialization of ``Dict`` that handles efficiently
    encoding columns that are NumPy arrays.

    '''

    def make_descriptors(self, base_name):
        ''' Return a list of ``ColumnDataPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            base_name (str) : the name of the property these descriptors are for

        Returns:
            list[ColumnDataPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        '''
        return [ ColumnDataPropertyDescriptor(base_name, self) ]


    def from_json(self, json, models=None):
        ''' Decodes column source data encoded as lists or base64 strings.
        '''
        if json is None:
            return None
        elif not isinstance(json, dict):
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))
        new_data = {}
        for key, value in json.items():
            key = self.keys_type.from_json(key, models)
            if isinstance(value, dict) and '__ndarray__' in value:
                new_data[key] = decode_base64_dict(value)
            elif isinstance(value, list) and any(isinstance(el, dict) and '__ndarray__' in el for el in value):
                new_list = []
                for el in value:
                    if isinstance(el, dict) and '__ndarray__' in el:
                        el = decode_base64_dict(el)
                    elif isinstance(el, list):
                        el = self.values_type.from_json(el)
                    new_list.append(el)
                new_data[key] = new_list
            else:
                new_data[key] = self.values_type.from_json(value, models)
        return new_data

    def serialize_value(self, value):
        return transform_column_source_data(value)

    @classmethod
    def wrap(cls, value):
        ''' Some property types need to wrap their values in special containers, etc.

        '''
        if isinstance(value, dict):
            if isinstance(value, PropertyValueColumnData):
                return value
            else:
                return PropertyValueColumnData(value)
        else:
            return value

class Tuple(ContainerProperty):
    ''' Accept Python tuple values.

    '''
    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        super(Tuple, self).__init__(default=kwargs.get("default"), help=kwargs.get("help"))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return tuple(type_param.from_json(item, models) for type_param, item in zip(self.type_params, json))
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

    def validate(self, value, detail=True):
        super(Tuple, self).validate(value, detail)

        if value is not None:
            if not (isinstance(value, (tuple, list)) and len(self.type_params) == len(value) and \
                    all(type_param.is_valid(item) for type_param, item in zip(self.type_params, value))):
                msg = "" if not detail else "expected an element of %s, got %r" % (self, value)
                raise ValueError(msg)

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

class RelativeDelta(Dict):
    ''' Accept RelativeDelta dicts for time delta values.

    '''

    def __init__(self, default={}, help=None):
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super(RelativeDelta, self).__init__(keys, values, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
