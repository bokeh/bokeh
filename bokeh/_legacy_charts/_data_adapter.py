"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the ChartObject class, a minimal prototype class to build more chart
types on top of it. It provides the mechanisms to support the shared chained
methods.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from six import string_types
from collections import OrderedDict
from ..properties import bokeh_integer_types, Datetime

try:
    import numpy as np

except ImportError:
    np = None

try:
    import pandas as pd

except ImportError:
    pd = None
try:
    import blaze
except ImportError:
    blaze=None
#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

DEFAULT_INDEX_ALIASES = list('abcdefghijklmnopqrstuvz1234567890')
DEFAULT_INDEX_ALIASES += list(zip(DEFAULT_INDEX_ALIASES, DEFAULT_INDEX_ALIASES))

class DataAdapter(object):
    """
    Adapter object used to normalize Charts inputs to a common interface.
    Supported inputs are dict, list, tuple, np.ndarray and pd.DataFrame.
    """
    def __init__(self, data, index=None, columns=None, force_alias=True):
        self.__values = data
        self._values = self.validate_values(data)

        self.convert_index_to_int = False
        self._columns_map = {}
        self.convert_items_to_dict = False

        if columns is None and force_alias:
            # no column 'labels' defined for data... in this case we use
            # default names
            keys = getattr(self._values, 'keys', None)
            if callable(keys):
                columns = list(keys())
            elif keys is None:
                columns = list(map(str, range(len(data))))
            else:
                columns = list(keys)

        if columns:
            self._columns = columns

            # define a mapping between the real keys to access data and the aliases
            # we have defined using 'columns'
            self._columns_map = dict(zip(columns, self.keys()))

        if index is not None:
            self._index = index
            self.convert_items_to_dict = True

        elif force_alias:
            _index = getattr(self._values, 'index', None)

            # check because if it is a callable self._values is not a
            # dataframe (probably a list)
            if _index is None:
                indexes = self.index

                if isinstance(indexes[0], int):
                    self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                    self.convert_items_to_dict = True

            elif not callable(_index):
                self._index = list(_index)
                self.convert_items_to_dict = True

            else:
                self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                self.convert_items_to_dict = True

    @staticmethod
    def is_number(value):
        numbers = (float, ) + bokeh_integer_types
        return isinstance(value, numbers)

    @staticmethod
    def is_datetime(value):
        try:
            dt = Datetime(value)
            dt # shut up pyflakes
            return True

        except ValueError:
            return False

    @staticmethod
    def validate_values(values):
        if np and isinstance(values, np.ndarray):
            if len(values.shape) == 1:
                return np.array([values])
            else:
                return values

        elif pd and isinstance(values, pd.DataFrame):
            return values

        elif isinstance(values, (dict, OrderedDict)):
            if all(DataAdapter.is_number(x) for x in values.values()):
                return values

            return values

        elif isinstance(values, (list, tuple)):
            if all(DataAdapter.is_number(x) for x in values):
                return [values]

            return values

        elif hasattr(values, '__array__'):
            values = pd.DataFrame(np.asarray(values))
            return values

        # TODO: Improve this error message..
        raise TypeError("Input type not supported! %s" % values)


    def index_converter(self, x):
        key = self._columns_map.get(x, x)
        if self.convert_index_to_int:
            key = int(key)
        return key

    def keys(self):
        # assuming it's a dict or dataframe
        keys = getattr(self._values, "keys", None)

        if callable(keys):
            return list(keys())

        elif keys is None:
            self.convert_index_to_int = True
            indexes = range(len(self._values))
            return list(map(str, indexes))

        else:
            return list(keys)

    def __len__(self):
        return len(self.values())

    def __iter__(self):
        for k in self.keys():
            yield k

    def __getitem__(self, key):
        val = self._values[self.index_converter(key)]

        # if we have "index aliases" we need to remap the values...
        if self.convert_items_to_dict:
            val = dict(zip(self._index, val))

        return val

    def values(self):
        return self.normalize_values(self._values)

    @staticmethod
    def normalize_values(values):
        _values = getattr(values, "values", None)

        if callable(_values):
            return list(_values())

        elif _values is None:
            return values

        else:
            # assuming it's a dataframe, in that case it returns transposed
            # values compared to it's dict equivalent..
            return list(_values.T)

    def items(self):
        return [(key, self[key]) for key in self]

    def iterkeys(self):
        return iter(self)

    def itervalues(self):
        for k in self:
            yield self[k]

    def iteritems(self):
        for k in self:
            yield (k, self[k])

    @property
    def columns(self):
        try:
            return self._columns

        except AttributeError:
            return list(self.keys())

    @property
    def index(self):
        try:
            return self._index

        except AttributeError:
            index = getattr(self._values, "index", None)

            if not callable(index) and index is not None:
                # guess it's a pandas dataframe..
                return index

        # no, it's not. So it's probably a list so let's get the
        # values and check
        values = self.values()

        if isinstance(values, dict):
            return list(values.keys())

        else:
            first_el = self.values()[0]

            if isinstance(first_el, dict):
                indexes = list(first_el.keys())

            else:
                indexes = range(0, len(self.values()[0]))
                self._index = indexes
            return indexes

    #-----------------------------------------------------------------------------
    # Convenience methods
    #-----------------------------------------------------------------------------
    @staticmethod
    def get_index_and_data(values, index=None):
        """Parse values (that must be one of the DataAdapter supported
        input types) and create an separate/create index and data
        depending on values type and index.

        Args:
            values (iterable): container that holds data to be plotted using
                on the Chart classes

        Returns:
            A tuple of (index, values), where: ``index`` is an iterable that
            represents the data index and ``values`` is an iterable containing
            the values to be plotted.

        """
        _values = DataAdapter(values, force_alias=False)
        if hasattr(values, 'keys'):
            if index is not None:
                if isinstance(index, string_types):
                    xs = _values[index]
                else:
                    xs = index
            else:
                try:
                    xs = _values.index
                except AttributeError:
                    xs = values.index
        else:
            if index is None:
                xs = _values.index
            elif isinstance(index, string_types):
                xs = _values[index]
            else:
                xs = index

        return xs, _values
