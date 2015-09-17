"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the ChartObject class, a minimal prototype class to build more chart
types on top of it. It provides the mechanisms to support the shared chained
methods.
"""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import absolute_import

from six import iteritems
from six.moves import zip
from copy import copy
from operator import itemgetter
from itertools import islice, product, chain
import numpy as np
import pandas as pd

from ..properties import bokeh_integer_types, Datetime, List, HasProps
from ..models.sources import ColumnDataSource

from ._properties import ColumnLabel
from .utils import collect_attribute_columns, special_columns

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
        labels = [''.join(item) for item in
                  take(n_left, product(DEFAULT_COLUMN_NAMES, DEFAULT_COLUMN_NAMES))]
        col_names.extend(labels)
        return col_names


class DataOperator(HasProps):
    columns = List(ColumnLabel(), default=None,
                   help="""List of columns to perform operation on.""")

    def apply(self, data):
        raise NotImplementedError('Each data operator must implement the apply method.')

    def __repr__(self):
        col_str = ', '.join(self.columns)
        return '%s(%s)' % (self.__class__.__name__, col_str)


class DataGroup(object):
    """Contains subset of data and metadata about it."""

    def __init__(self, label, data, attr_specs):
        self.label = label
        self.data = data.reset_index()
        self.attr_specs = attr_specs

    def get_values(self, selection):
        if selection in special_columns:
            return special_columns[selection](self.data)
        elif isinstance(selection, str):
            return self.data[selection]
        elif isinstance(selection, list) and len(selection) == 1:
            return self.data[selection[0]]
        elif isinstance(selection, list) and len(selection) > 1:
            return self.data[selection]
        else:
            return None

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

    spec_cols = collect_attribute_columns(**specs)

    # if there was any input for chart attributes, which require grouping
    if spec_cols:
        # df = df.sort(columns=spec_cols)

        for name, data in df.groupby(spec_cols):

            attrs = {}
            for spec_name, spec in iteritems(specs):
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
        for spec_name, spec in iteritems(specs):
            attrs[spec_name] = spec[None]

        yield DataGroup(label='all', data=df, attr_specs=attrs)


DEFAULT_DIMS = ['x', 'y']
DEFAULT_REQ_DIMS = [['x'], ['y'], ['x', 'y']]


class ChartDataSource(object):
    """Validates, normalizes, groups, and assigns Chart attributes to groups.

    Supported inputs are:
        Array-like - list, tuple, np.ndarray, pd.Series
        Table-like - records: list(dict), columns: dict(list), pd.DataFrame, blaze resource

    Converts inputs that could be treated as table-like data to pandas
    DataFrame, which is used for assigning attributes to data groups.
    """

    def __init__(self, df, dims=None, required_dims=None, selections=None, **kwargs):

        if dims is None:
            dims = DEFAULT_DIMS

        if required_dims is None:
            required_dims = DEFAULT_REQ_DIMS

        self._data = df
        self._dims = dims
        self._required_dims = required_dims
        self._selections = self.get_selections(selections, **kwargs)
        self.apply_operations()
        self.meta = self.collect_metadata(df)
        self._validate_selections()

    def get_selections(self, selections, **kwargs):
        """Maps chart dimensions to selections and checks that required dim requirements are met."""
        select_map = {}

        # extract selections from kwargs using dimension list
        for dim in self._dims:
            dim_select = kwargs.pop(dim, None)
            if dim_select is not None:
                select_map[dim] = dim_select

        # handle case where dimension kwargs were not provided
        if len(select_map.keys()) == 0:
            if selections is None:
                # if no selections are provided, we assume they were provided in order
                select_map = {dim: sel for dim, sel in
                              zip(self._dims, self._data.columns)}
            elif isinstance(selections, dict):
                if len(selections.keys()) != 0:
                    # selections were specified in inputs
                    select_map = selections
            else:
                # selection input type isn't valid
                raise ValueError(
                    'selections input must be provided as: dict(dimension: column) or None')

        # make sure each dimension is represented in the selection map
        for dim in self._dims:
            if dim not in select_map:
                select_map[dim] = None

        # # make sure we have enough dimensions as required either way
        # unmatched = list(set(self._required_dims) - set(select_map.keys()))
        # if len(unmatched) > 0:
        #     raise ValueError('You must provide all required columns assigned to dimensions, no match for: %s'
        #                      % ', '.join(unmatched))
        # else:
        return select_map

    def apply_operations(self):
        # ToDo: Handle order of operation application, see GoG pg. 71
        for dim, select in iteritems(self._selections):
            if isinstance(select, DataOperator):
                self._data = select.apply(self)

    def __getitem__(self, dim):
        """Get the columns selected for the given dimension name.

        e.g. dim='x'
        """
        if dim in self._selections:
            return self._selections[dim]
        else:
            return None

    def stack_measures(self, measures, ids=None, var_name='variable', value_name='value'):
        for dim in self._dims:
            # find the dimension the measures are associated with

            selection = self._selections[dim]
            if isinstance(selection, DataOperator):
                dim_cols = selection.columns
            else:
                dim_cols = selection

            if measures == dim_cols:
                self._selections[dim] = value_name
                if ids is not None:
                    self._data = pd.melt(self._data, id_vars=ids, value_vars=measures,
                                         var_name=var_name, value_name=value_name)
                else:
                    ids = list(set(self._data.columns) - set(measures))
                    self._data = pd.melt(self._data, id_vars=ids, value_vars=measures,
                                         var_name=var_name, value_name=value_name)

    def groupby(self, **specs):
        """Iterable of chart attribute specifications, associated with columns.

        Iterates over DataGroup, which represent the lowest level of data that is assigned
        to the attributes for plotting.
        """
        if len(specs) == 0:
            raise ValueError(
                'You must provide one or more Attribute Specs to support iteration.')

        return groupby(self._data, **specs)

    @classmethod
    def from_data(cls, *args, **kwargs):
        """Automatically handle all valid inputs."""
        arrays = [arg for arg in args if cls.is_array(arg)]
        tables = [arg for arg in args if cls.is_table(arg) or cls.is_list_dicts(arg)]

        # only accept array-like or table-like input for simplicity
        if len(arrays) > 0 and len(tables) > 0:
            raise TypeError('Only input either array or table data.')

        # kwarg data
        if len(arrays) == 0 and len(tables) == 0:

            # handle list of lists
            list_dims = [k for k, v in iteritems(kwargs) if (cls.is_list_arrays(v) or
                                                             cls.is_array(v)) and
                         k is not 'dims' and k is not 'required_dims']
            if len(list_dims) > 0:
                arrays = [kwargs[dim] for dim in list_dims]
                if cls.is_list_arrays(arrays):
                    arrays = list(chain.from_iterable(arrays))
                col_names = gen_column_names(len(arrays))

                # reassign kwargs to new columns
                new_kwargs = kwargs.copy()
                for dim in list_dims:
                    dim_cols = []
                    dim_inputs = kwargs[dim]
                    if not cls.is_list_arrays(dim_inputs) and not all([cls.is_array(
                            dim_input) for dim_input in dim_inputs]):
                        dim_inputs = [dim_inputs]

                    # if we passed one to many literal array/list, match to cols
                    for dim_input in dim_inputs:
                        for array, col_name in zip(arrays, col_names):
                            if pd.Series.all(pd.Series(array) == pd.Series(dim_input)):
                                # add col to all cols and
                                dim_cols.append(col_name)

                    # if only single column selected, pull it out of list
                    if len(dim_cols) == 1:
                        dim_cols = dim_cols[0]

                    new_kwargs[dim] = dim_cols

                # setup kwargs to process as if we received arrays as args
                kwargs = new_kwargs
                kwargs['columns'] = col_names
            else:
                raise ValueError(
                    'No data found for inputs %s' % ', '.join(kwargs['dims']))

        # handle array-like
        if len(arrays) > 0:
            return cls.from_arrays(arrays, **kwargs)

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
                raise TypeError(
                    'Unable to recognize inputs for conversion to dataframe for %s'
                    % type(table))

    @staticmethod
    def is_list_arrays(data):
        valid = False

        # ToDo: handle groups of arrays types, list of lists of arrays
        # avoid case where we have a list with one list of values in it
        if (isinstance(data, list) and len(data) == 1 and isinstance(data[0], list) and
                not isinstance(data[0][0], list) and not ChartDataSource.is_array(data[0][0])):
            return valid

        # really want to check for nested lists, where each list might have lists
        if isinstance(data, list):
            if all([ChartDataSource.is_array(col) for col in data]):
                valid = True

        return valid

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

        # handle list of arrays
        if any(cls.is_list_arrays(array) for array in arrays):
            list_of_arrays = copy(arrays)
            arrays = list(chain.from_iterable(arrays))
            column_names = column_names or gen_column_names(len(arrays))
            cols = copy(column_names)
            dims = kwargs.get('dims', None) or DEFAULT_DIMS

            # derive column selections
            for dim, list_of_array in zip(dims, list_of_arrays):
                sel = [cols.pop(0) for _ in list_of_array]
                kwargs[dim] = sel
        else:
            column_names = column_names or gen_column_names(len(arrays))

        # try to replace auto names with Series names
        for i, array in enumerate(arrays):
            if isinstance(array, pd.Series):
                name = array.name
                if name not in column_names:
                    column_names[i] = name

        table = {column_name: array for column_name, array in zip(column_names, arrays)}
        return cls(df=pd.DataFrame.from_dict(data=table), **kwargs)

    @classmethod
    def from_dict(cls, data, **kwargs):
        return cls(df=pd.DataFrame.from_dict(data), **kwargs)

    @staticmethod
    def is_table(data):
        return ChartDataSource._is_valid(data,
                                         TABLE_TYPES) or ChartDataSource.is_list_dicts(
            data)

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
        dims = [dim for dim, sel in iteritems(selections) if sel is not None]

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
            selection_str = ['%s = %s' % (str(dim), str(sel)) for dim, sel in
                             iteritems(selections) if sel is not None]

            raise ValueError(error_str % (
            ' or '.join(req_str), ', '.join(selection_str), ', '.join(self.columns)))
        else:
            # if we have no dimensional requirements, they all pass
            return

    @staticmethod
    def is_number(value):
        numbers = (float,) + bokeh_integer_types
        return isinstance(value, numbers)

    @staticmethod
    def is_datetime(value):
        try:
            dt = Datetime(value)
            dt  # shut up pyflakes
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
