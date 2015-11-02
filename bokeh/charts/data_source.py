"""The classes and functionality used to transform data inputs to consistent types."""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import absolute_import

from copy import copy
from itertools import chain
from operator import itemgetter

import numpy as np
import pandas as pd
from six import iteritems
from six.moves import zip

from .properties import ColumnLabel
from .utils import collect_attribute_columns, special_columns, gen_column_names
from ..models.sources import ColumnDataSource
from ..properties import bokeh_integer_types, Datetime, List, HasProps, String


COMPUTED_COLUMN_NAMES = ['_charts_ones']
ARRAY_TYPES = [tuple, list, np.ndarray, pd.Series]
TABLE_TYPES = [dict, pd.DataFrame]
DEFAULT_DIMS = ['x', 'y']
DEFAULT_REQ_DIMS = [['x'], ['y'], ['x', 'y']]


class ColumnAssigner(HasProps):
    """Defines behavior for assigning columns to dimensions.

    This class is used to collect assignments between columns and :class:`Builder`
    dimensions when none are provided. The :class:`ChartDataSource` receives a
    ColumnAssigner from each :class:`Builder`, which can implement custom behavior.

    Each subclass must implement the :meth:`get_assignment` method, which returns
    a `dict` mapping between each dimension in `dims` and one or more column names,
    or `None` if no assignment is made for the associated dimension.
    """
    dims = List(String, help="""
        The list of dimension names that are associated with the :class:`Builder`. The
        ColumnAssigner should return a dict with each dimension as a key when the
        :meth:`get_assignment` method is called.
        """)
    attrs = List(String, help="""
        This list of attribute names that are associated with the :class:`Builder`. These
        can be used to alter which dimensions are assigned which columns, versus which
        attributes are assigned which columns.
        """)

    def __init__(self, df=None, **properties):
        """Create the assigner.

        Args:
            df (:class:`pandas.DataFrame`, optional): the data source to use for
                assigning columns from
            **properties: any attribute of the ColumnAssigner
        """
        if df is not None:
            self._df = df
        super(ColumnAssigner, self).__init__(**properties)

    def get_assignment(self):
        raise NotImplementedError('You must return map between each dim and selection.')


class OrderedAssigner(ColumnAssigner):
    """Assigns one column for each dimension that is not an attribute, in order.

    This is the default column assigner for the :class:`Builder`.
    """

    def get_assignment(self):
        """Get a mapping between dimension and selection when none are provided."""
        dims = [dim for dim in self.dims if dim not in self.attrs]
        return {dim: sel for dim, sel in
                zip(dims, self._df.columns.tolist())}


class NumericalColumnsAssigner(ColumnAssigner):
    """Assigns all numerical columns to the y dimension."""

    def get_assignment(self):
        # filter down to only the numerical columns
        df = self._df._get_numeric_data()
        return {'y': df.columns.tolist()}


class DataOperator(HasProps):
    """An operation that transforms data before it is used for plotting."""
    columns = List(ColumnLabel(), default=None, help="""
        List of columns to perform operation on.""")

    def apply(self, data):
        raise NotImplementedError('Each data operator must implement the apply method.')

    def __repr__(self):
        col_str = ', '.join(self.columns)
        return '%s(%s)' % (self.__class__.__name__, col_str)


class DataGroup(object):
    """Contains subset of data and metadata about it.

    The DataGroup contains a map from the labels of each attribute
    associated with an :class:`AttrSpec` to the value of the attribute assigned to the
    DataGroup.

    .. note::
        resets the index on the input data
    """

    def __init__(self, label, data, attr_specs):
        """Create a DataGroup for the data, with a label and assoicated attributes.

        Args:
            label (str): the label for the group based on unique values of each column
            data (:class:`pandas.DataFrame`): the subset of data associated with the group
            attr_specs dict(str, :class:`AttrSpec`): mapping between attribute name and
              the associated :class:`AttrSpec`.
        """
        self.label = label
        self.data = data.reset_index()
        self.attr_specs = attr_specs

    def get_values(self, selection):
        """Get the data associated with the selection of columns.

        Args:
            selection (List(Str) or Str): the column or columns selected

        Returns:
            :class:`pandas.DataFrame`
        """
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
        """The :class:`ColumnDataSource` representation of the DataFrame."""
        return ColumnDataSource(self.data)

    def __getitem__(self, spec_name):
        """Get the value of the :class:`AttrSpec` associated with `spec_name`."""
        return self.attr_specs[spec_name]

    def __repr__(self):
        return '<DataGroup(%s) - attributes: %s>' % (str(self.label), self.attr_specs)

    def __len__(self):
        return len(self.data.index)


def groupby(df, **specs):
    """Convenience iterator around pandas groupby and attribute specs.

    Args:
        df (:class:`~pandas.DataFrame`): The entire data source being
            used for the Chart.
        **specs: Name, :class:`AttrSpec` pairing, used to identify the lowest
            level where the data is grouped.

    Yields:
        :class:`DataGroup`: each unique group of data to be used to produce glyphs

    """

    spec_cols = collect_attribute_columns(**specs)

    # if there was any input for chart attributes, which require grouping
    if spec_cols:
        # df = df.sort(columns=spec_cols)

        for name, data in df.groupby(spec_cols, sort=False):

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

        yield DataGroup(label='None', data=df, attr_specs=attrs)


class ChartDataSource(object):
    """Validates, normalizes, groups, and assigns Chart attributes to groups.

    Supported inputs are:

    - **Array-like**: list, tuple, :class:`numpy.ndarray`, :class:`pandas.Series`
    - **Table-like**:
        - records: list(dict)
        - columns: dict(list), :class:`pandas.DataFrame`, or blaze resource

    Converts inputs that could be treated as table-like data to pandas DataFrame,
    which is used for assigning attributes to data groups.
    """

    def __init__(self, df, dims=None, required_dims=None, selections=None,
                 column_assigner=OrderedAssigner, **kwargs):
        """Create a :class:`ChartDataSource`.

        Args:
            df (:class:`pandas.DataFrame`): the original data source for the chart
            dims (List(Str), optional): list of valid dimensions for the chart.
            required_dims (List(List(Str)), optional): list of list of valid dimensional
                selections for the chart.
            selections (Dict(dimension, List(Column)), optional): mapping between a
                dimension and the column name(s) associated with it. This represents what
                the user selected for the current chart.
            column_assigner (:class:`ColumnAssigner`, optional): a reference to a
                ColumnAssigner class, which is used to collect dimension column
                assignment when keyword arguments aren't provided. The default value is
                :class:`OrderedAssigner`, which assumes you want to assign each column
                or array to each dimension of the chart in order that they are received.
            **kwargs:
                attrs (list(str)): list of attribute names the chart uses
        """
        if dims is None:
            dims = DEFAULT_DIMS

        if required_dims is None:
            required_dims = DEFAULT_REQ_DIMS

        self.input_type = kwargs.pop('input_type', None)
        self.attrs = kwargs.pop('attrs', [])
        self._data = df
        self._dims = dims
        self._required_dims = required_dims
        self.column_assigner = column_assigner(df=df, dims=list(self._dims),
                                               attrs=self.attrs)
        self._selections = self.get_selections(selections, **kwargs)
        self.setup_derived_columns()
        self.apply_operations()
        self.meta = self.collect_metadata(df)
        self._validate_selections()

    def get_selections(self, selections, **kwargs):
        """Maps chart dimensions to selections and checks input requirements.

        Returns:
            mapping between each dimension and the selected columns. If no selection is
                made for a dimension, then the dimension will be associated with `None`.
        """
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
                select_map = self.column_assigner.get_assignment()

            elif isinstance(selections, dict):
                if len(selections.keys()) != 0:
                    # selections were specified in inputs
                    select_map = selections
            else:
                # selection input type isn't valid
                raise ValueError('selections input must be provided as: \
                                 dict(dimension: column) or None')

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
        """Applies each data operation."""
        # ToDo: Handle order of operation application, see GoG pg. 71
        for dim, select in iteritems(self._selections):
            if isinstance(select, DataOperator):
                self._data = select.apply(self)

    def setup_derived_columns(self):
        """Attempt to add special case columns to the DataFrame for the builder."""
        for dim in self._dims:
            dim_selection = self[dim]
            if dim_selection is not None and isinstance(dim_selection, str) and \
                dim_selection in special_columns and dim_selection not in \
                    self.df.columns.tolist():
                        self._data[dim_selection] = special_columns[dim_selection](
                            self._data)

    def __getitem__(self, dim):
        """Get the columns selected for the given dimension name.

        e.g. dim='x'

        Returns:
            the columns selected as a str or list(str). If the dimension is not in
              `_selections`, `None` is returned.
        """
        if dim in self._selections:
            return self._selections[dim]
        else:
            return None

    def __setitem__(self, dim, value):
        self._selections[dim] = value
        self.setup_derived_columns()

    def stack_measures(self, measures, ids=None, var_name='variable',
                       value_name='value'):
        """De-pivots `_data` from a 'wide' to 'tall' layout.

        A wide table is one where the column names represent a categorical variable
        and each contains only the values associated with each unique value of the
        categorical variable.

        This method uses the :func:`pandas.melt` function with additional logic
        to make sure that the same data source can have multiple operations applied,
        and so all other columns are maintained through the stacking process.

        Example:

            .. note::

                This example is fairly low level and is not something the typical
                user should worry about. The interface for data transformations from
                the user perspective are the :ref:`bokeh_charts_functions`.

            >>> data = {'a': [1, 2, 3, 4],
            ...         'b': [2, 3, 4, 5],
            ...         'month': ['jan', 'jan', 'feb', 'feb']
            ...         }

            >>> ds = ChartDataSource.from_data(data)
            >>> ds['x'] =['a', 'b'] # say we selected a and b for dimension x

            We may want to combine 'a' and 'b' together. The final
            data would look like the following:

            >>> ds.stack_measures(['c', 'd'], var_name='c_d_variable',
            ...                   value_name='c_d_value')
            >>> ds.df
            Out[35]:
                  month a_b_variable  a_b_value
                0   jan            a          1
                1   jan            a          2
                2   feb            a          3
                3   feb            a          4
                4   jan            b          2
                5   jan            b          3
                6   feb            b          4
                7   feb            b          5

            The transformed data will use the `var_name` and `value_name` inputs to
            name the columns. These derived columns can then be used as a single column
            to reference the values and the labels of the data. In the example, I could
            plot a_b_value vs month, and color by a_b_variable.

            What this does for you over the :meth:`pandas.melt` method is that it will
            apply the :class:`DataOperator` for a dimension if it exists (e.g.
            :class:`Blend`, generated by :func:`blend`), and it will try to handle the id
            columns for you so you don't lose other columns with the melt transformation.

        Returns:
            None
        """
        # ToDo: Handle multiple blend operations
        for dim in self._dims:

            # find the dimension the measures are associated with
            selection = self._selections[dim]

            # because a user can generate data operators assigned to dimensions,
            # the columns must be gathered from the data operator
            if isinstance(selection, DataOperator):
                dim_cols = selection.columns
            else:
                dim_cols = selection

            # handle case where multiple stacking operations create duplicate cols
            if var_name in self.df.columns.tolist():
                var_name += '_'

            if measures == dim_cols:
                self._selections[dim] = value_name
                if ids is not None:

                    # handle case where we already stacked by one dimension/attribute
                    if all([measure in self.df.columns.tolist() for measure in measures]):
                        self._data = pd.melt(self._data, id_vars=ids, value_vars=measures,
                                             var_name=var_name, value_name=value_name)
                else:
                    ids = list(set(self._data.columns) - set(measures))
                    self._data = pd.melt(self._data, id_vars=ids, value_vars=measures,
                                         var_name=var_name, value_name=value_name)

    def groupby(self, **specs):
        """ Iterable of chart attribute specifications, associated with columns.

        Iterates over DataGroup, which represent the lowest level of data that is assigned
        to the attributes for plotting.

        Yields:
            a DataGroup, which contains metadata and attributes
                assigned to the group of data
        """
        if len(specs) == 0:
            raise ValueError(
                'You must provide one or more Attribute Specs to support iteration.')

        return groupby(self._data, **specs)

    @classmethod
    def from_data(cls, *args, **kwargs):
        """Automatically handle all valid inputs.

        Attempts to use any data that can be represented in a Table-like format,
        along with any generated requirements, to produce a
        :class:`ChartDataSource`. Internally, these data types are generated, so that a
        :class:`pandas.DataFrame` can be generated.

        Identifies inputs that are array vs table like, handling them accordingly. If
        possible, existing column names are used, otherwise column names are generated.

        Returns:
            :class:`ColumnDataSource`
        """

        # make sure the attributes are not considered for data inputs
        attrs = kwargs.pop('attrs', None)

        if attrs is not None:
            # look at each arg, and keep it if it isn't a string, or if it is a string,
            #  make sure that it isn't the name of an attribute
            args = [arg for arg in args if (not isinstance(arg, str) or
                                            isinstance(arg, str) and arg not in attrs)]

        arrays = [arg for arg in args if cls.is_array(arg)]
        tables = [arg for arg in args if cls.is_table(arg) or cls.is_list_dicts(arg)]

        # only accept array-like or table-like input for simplicity
        if len(arrays) > 0 and len(tables) > 0:
            raise TypeError('Only input either array or table data.')

        # kwarg or list of arrays data
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
                # non-kwargs list of lists
                arrays = [arg for arg in args if cls.is_list_arrays(arg)]

        if attrs is not None:
            kwargs['attrs'] = attrs

        # handle array-like
        if len(arrays) > 0:
            kwargs['input_type'] = 'iter_array'
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
                    kwargs['input_type'] = 'dict_array'
                    return cls(df=pd.DataFrame.from_dict(data=table), **kwargs)
                else:
                    raise TypeError('Input of table-like dict must be column-oriented.')

            # list of dicts
            elif cls.is_list_dicts(table):
                kwargs['input_type'] = 'list_dicts'
                return cls(df=pd.DataFrame.from_records(data=table), **kwargs)

            # blaze data source
            # elif string or datasource
            # Todo: implement handling of blaze data sources if available

            # pandas dataframe
            elif isinstance(table, pd.DataFrame):
                kwargs['input_type'] = 'DataFrame'
                return cls(df=table, **kwargs)

            # unrecognized input type
            else:
                raise TypeError(
                    'Unable to recognize inputs for conversion to dataframe for %s'
                    % type(table))

    @staticmethod
    def is_list_arrays(data):
        """Verify if input data is a list of array-like data.

        Returns:
            bool
        """
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

        # equivalent of list of arrays is a table-like numpy ndarray
        elif isinstance(data, np.ndarray):
            if len(data.shape) == 2:
                valid = True

        return valid

    @property
    def df(self):
        return self._data

    @staticmethod
    def _collect_dimensions(**kwargs):
        """Returns dimensions by name from kwargs.

        Returns:
            iterable(str): iterable of dimension names as strings
        """
        dims = kwargs.pop(kwargs, None)
        if not dims:
            return 'x', 'y'
        else:
            return dims

    @classmethod
    def from_arrays(cls, arrays, column_names=None, **kwargs):
        """Produce :class:`ColumnDataSource` from array-like data.

        Returns:
            :class:`ColumnDataSource`
        """
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
        """Produce :class:`ColumnDataSource` from table-like dict.

        Returns:
            :class:`ColumnDataSource`
        """
        return cls(df=pd.DataFrame.from_dict(data), **kwargs)

    @staticmethod
    def is_table(data):
        """Verify if data is table-like.

        Inspects the types and structure of data.

        Returns:
            bool
        """
        return (ChartDataSource._is_valid(data, TABLE_TYPES) or
                ChartDataSource.is_list_dicts(data))

    @staticmethod
    def is_list_dicts(data):
        """Verify if data is row-oriented, table-like data.

        Returns:
            bool
        """
        return isinstance(data, list) and all([isinstance(row, dict) for row in data])

    @staticmethod
    def is_array(data):
        """Verify if data is array-like.

        Returns:
            bool
        """
        if ChartDataSource.is_list_dicts(data):
            # list of dicts is table type
            return False
        else:
            return ChartDataSource._is_valid(data, ARRAY_TYPES)

    @staticmethod
    def _is_valid(data, types):
        """Checks for each type against data.

        Args:
            data: a generic source of data
            types: a list of classes

        Returns:
            bool
        """
        return any([isinstance(data, valid_type) for valid_type in types])

    def _validate_selections(self):
        """Raises selection error if selections are not valid compared to requirements.

        Returns:
            None
        """

        required_dims = self._required_dims
        selections = self._selections
        dims = [dim for dim, sel in iteritems(selections) if sel is not None]
        if self.attrs is not None:
            dims = [dim for dim in dims if dim not in self.attrs]

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

            # If we reach this point, nothing was validated, let's
            # construct useful error messages
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
        """Verifies that value is a numerical type.

        Returns:
            bool
        """
        numbers = (float,) + bokeh_integer_types
        return isinstance(value, numbers)

    @staticmethod
    def is_datetime(value):
        """Verifies that value is a valid Datetime type, or can be converted to it.

        Returns:
            bool
        """
        try:
            dt = Datetime(value)
            dt  # shut up pyflakes
            return True

        except ValueError:
            return False

    @staticmethod
    def collect_metadata(data):
        """Introspect which columns match to which types of data."""
        # ToDo: implement column metadata collection
        return {}

    @property
    def columns(self):
        """All column names associated with the data.

        Returns:
            List(Str)
        """
        return self._data.columns

    @property
    def index(self):
        """The index for the :class:`pandas.DataFrame` data source."""
        return self._data.index

    @property
    def values(self):
        return self._data.values

    @staticmethod
    def is_computed(column):
        """Verify if the column provided matches to known computed columns.

        Returns:
            bool
        """
        if column in COMPUTED_COLUMN_NAMES:
            return True
        else:
            return False
