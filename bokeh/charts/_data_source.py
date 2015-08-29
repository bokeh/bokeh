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

from __future__ import absolute_import

from six.moves import zip
from itertools import chain
from operator import itemgetter
from itertools import islice, product
import numpy as np
import pandas as pd

from ..properties import bokeh_integer_types, Datetime
from ..models.sources import ColumnDataSource

try:
    import blaze
except ImportError:
    blaze = None

DEFAULT_COLUMN_NAMES = 'abcdefghijklmnopqrstuvwxyz'
COMPUTED_COLUMN_NAMES = ['_charts_ones']
ARRAY_TYPES = [tuple, list, np.ndarray, pd.Series]
TABLE_TYPES = [dict, pd.DataFrame]


def take(n, iterable):
    """Return first n items of the iterable as a list."""
    return islice(iterable, n)


def gen_column_names(n):
    """Produces list of unique column names of length n."""
    col_names = list(DEFAULT_COLUMN_NAMES)

    # a-z
    if n < len(col_names):
        return list(take(n, col_names))
    # a-z and aa-zz (500+ columns)
    else:
        n_left = n - len(col_names)
        labels = [''.join(item) for item in take(n_left, product(DEFAULT_COLUMN_NAMES, DEFAULT_COLUMN_NAMES))]
        col_names.extend(labels)
        return col_names


def ordered_set(iterable):
    """Creates an ordered list from strings, tuples or other hashable items."""

    mmap = {}
    ord_set = []

    for item in iterable:
        # Save unique items in input order
        if item not in mmap:
            mmap[item] = 1
            ord_set.append(item)
    return ord_set


class DataGroup(object):
    """Contains subset of data and metadata about it."""

    def __init__(self, label, data, attr_specs):
        self.label = label
        self.data = data
        self.attr_specs = attr_specs

    @property
    def source(self):
        return ColumnDataSource(self.data)

    def __getitem__(self, key):
        return self.attr_specs[key]

    def __repr__(self):
        return '<DataGroup(%s) - attributes: %s>' % (str(self.label), self.attr_specs)

    def __len__(self):
        return len(self.data.index)


def groupby(df, **specs):
    """Convenience iterator around pandas groupby and attribute specs."""

    selected_specs = {spec_name: spec for spec_name, spec in specs.iteritems() if spec.columns}
    spec_cols = ordered_set(list(chain.from_iterable([spec.columns for spec in selected_specs.values()])))

    # if there was any input for chart attributes, which require grouping
    if spec_cols:
        df = df.sort(columns=spec_cols)

        for name, data in df.groupby(spec_cols):

            attrs = {}
            for spec_name, spec in specs.iteritems():
                if spec.columns is not None:
                    # get index of the unique column values grouped on for this spec
                    name_idx = tuple([spec_cols.index(col) for col in spec.columns])

                    if isinstance(name, tuple):
                        # this handles the case of utilizing one or more and overlapping
                        # column names for different attrs
                        # name (label) is a tuple of the column values
                        # we extract only the data associated with the columns that this attr spec was configured with
                        label = itemgetter(*name_idx)(name)
                    else:
                        label = name
                else:
                    label = None

                # get attribute value for this spec, given the unique column values associated with it
                attrs[spec_name] = spec[label]

            yield DataGroup(label=name, data=data, attr_specs=attrs)

    # collect up the defaults from the attribute specs
    else:
        attrs = {}
        for spec_name, spec in specs.iteritems():
            attrs[spec_name] = spec[None]

        yield DataGroup(label='all', data=df, attr_specs=attrs)


class ChartDataSource(object):
    """Validates, normalizes, groups, and assigns Chart attributes to groups.

    Supported inputs are:
        Array-like - list, tuple, np.ndarray, pd.Series
        Table-like - records: list(dict), columns: dict(list), pd.DataFrame, blaze resource

    Converts inputs that could be treated as table-like data to pandas
    DataFrame, which is used for assigning attributes to data groups.
    """
    def __init__(self, df, dims=('x', 'y'), required_dims=('x',), selections=None, **kwargs):
        self._data = df
        self._dims = dims
        self._required_dims = required_dims
        self._selections = self.get_selections(selections, **kwargs)
        self.meta = self.collect_metadata(df)
        self._validate_selections()
        self._add_chart_columns()

    def _add_chart_columns(self):
        # ToDo: reconsider how to get these values into each group
        self._data['_charts_ones'] = 1

    def get_selections(self, selections, **kwargs):
        """Maps chart dimensions to selections and checks that required dim requirements are met."""
        select_map = {}

        # extract selections from kwargs using dimension list
        for dim in self._dims:
            dim_select = kwargs.pop(dim, None)
            select_map[dim] = dim_select

        # handle case where dimension kwargs were not provided
        if len(select_map.keys()) == 0:
            if selections is None:
                # if no selections are provided, we assume they were provided in order
                select_map = {dim: sel for dim, sel in zip(self._dims, self._data.columns)}
            elif isinstance(selections, dict):
                if len(selections.keys()) != 0:
                    # selections were specified in inputs
                    select_map = selections
            else:
                # selection input type isn't valid
                raise ValueError('selections input must be provided as: dict(dimension: column) or None')

        # # make sure we have enough dimensions as required either way
        # unmatched = list(set(self._required_dims) - set(select_map.keys()))
        # if len(unmatched) > 0:
        #     raise ValueError('You must provide all required columns assigned to dimensions, no match for: %s'
        #                      % ', '.join(unmatched))
        # else:
        return select_map

    def __getitem__(self, dim):
        """Get the columns selected for the given dimension name.

        e.g. dim='x'
        """
        if self._selections[dim] is not None:
            return self._selections[dim]
        else:
            return '_charts_ones'

    def groupby(self, **specs):
        """Iterable of chart attribute specifications, associated with columns.

        Iterates over DataGroup, which represent the lowest level of data that is assigned
        to the attributes for plotting.
        """
        if len(specs) == 0:
            raise ValueError('You must provide one or more Attribute Specs to support iteration.')

        return groupby(self._data, **specs)

    @classmethod
    def from_data(cls, *args, **kwargs):
        """Automatically handle all valid inputs."""
        arrays = [arg for arg in args if cls.is_array(arg)]
        tables = [arg for arg in args if cls.is_table(arg) or cls.is_list_dicts(arg)]

        # only accept array-like or table-like input for simplicity
        if len(arrays) > 0 and len(tables) > 0:
            raise TypeError('Only input either array or table data.')

        # handle array-like
        if len(arrays) > 0:
            columns = kwargs.pop('columns', gen_column_names(len(arrays)))
            return cls.from_arrays(arrays, column_names=columns, **kwargs)

        # handle table-like
        elif len(tables) > 0:

            # single table input only
            if len(tables) != 1:
                raise TypeError('Input a single table data type.')
            else:
                table = tables[0]

            # dict of arrays
            if isinstance(table, dict):
                if all([cls.is_array(col) for col in table.values()]):
                    return cls(df=pd.DataFrame.from_dict(data=table), **kwargs)
                else:
                    raise TypeError('Input of table-like dict must be column-oriented.')

            # list of dicts
            elif cls.is_list_dicts(table):
                return cls(df=pd.DataFrame.from_records(data=table), **kwargs)

            # blaze data source
            # elif string or datasource
            # Todo: implement handling of blaze data sources if available

            # pandas dataframe
            elif isinstance(table, pd.DataFrame):
                return cls(df=table, **kwargs)

            # unrecognized input type
            else:
                raise TypeError('Unable to recognize inputs for conversion to dataframe for %s'
                                % type(table))

    @property
    def df(self):
        return self._data

    @staticmethod
    def _collect_dimensions(**kwargs):
        dims = kwargs.pop(kwargs, None)
        if not dims:
            return 'x', 'y'
        else:
            return dims

    @classmethod
    def from_arrays(cls, arrays, column_names=None, **kwargs):
        if not column_names:
            column_names = gen_column_names(len(arrays))
        table = {column_name: array for column_name, array in zip(column_names, arrays)}
        return cls(df=pd.DataFrame.from_dict(data=table), **kwargs)

    @classmethod
    def from_dict(cls, data, **kwargs):
        return cls(df=pd.DataFrame.from_dict(data), **kwargs)

    @staticmethod
    def is_table(data):
        return ChartDataSource._is_valid(data, TABLE_TYPES) or ChartDataSource.is_list_dicts(data)

    @staticmethod
    def is_list_dicts(data):
        return isinstance(data, list) and all([isinstance(row, dict) for row in data])

    @staticmethod
    def is_array(data):
        if ChartDataSource.is_list_dicts(data):
            # list of dicts is table type
            return False
        else:
            return ChartDataSource._is_valid(data, ARRAY_TYPES)

    @staticmethod
    def _is_valid(data, types):
        return any([isinstance(data, valid_type) for valid_type in types])

    def _validate_selections(self):
        """Raises selection error if selections are not valid compared to requirements."""

        required_dims = self._required_dims
        selections = self._selections
        dims = [dim for dim, sel in selections.iteritems() if sel is not None]

        # look for a match for selections to dimensional requirements
        if len(required_dims) > 0:
            for req in required_dims:
                # ToDo: handle column type specifications

                if len(dims) < len(req):
                    # not an exact match
                    continue

                if all([dim in req for dim in dims]):
                    # found a match to the requirements
                    return

            # If we reach this point, nothing was validated, let's construct useful error messages
            error_str = 'Did not receive a valid combination of selections.\n\nValid configurations are: %s' + \
                        '\nReceived inputs are: %s' + \
                        '\n\nAvailable columns are: %s'
            req_str = [' and '.join(['%s = <Any Column>' % dim for dim in required_dim])
                       for required_dim in required_dims]
            selection_str = ['%s = %s' % (str(dim), str(sel)) for dim, sel in selections.iteritems() if sel is not None]

            raise ValueError(error_str % (' or '.join(req_str), ', '.join(selection_str), ', '.join(self.columns)))
        else:
            # if we have no dimensional requirements, they all pass
            return

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
    def collect_metadata(data):
        # ToDo: implement column metadata collection
        return {}

    @property
    def columns(self):
        return self._data.columns

    @property
    def index(self):
        return self._data.index

    @property
    def values(self):
        return self._data.values

    @staticmethod
    def is_computed(column):
        if column in COMPUTED_COLUMN_NAMES:
            return True
        else:
            return False

