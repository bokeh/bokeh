''' Properties for modeling Chart inputs, constraints, and dependencies.

selection spec:
    [['x'], ['x', 'y']]
    [{'x': categorical, 'y': numerical}]

'''
from __future__ import absolute_import

import numpy as np
import pandas as pd

from bokeh.core.has_props import HasProps
from bokeh.core.property.bases import PrimitiveProperty
from bokeh.core.properties import Array, bokeh_integer_types, Bool, Either, Int, List, String

from .utils import special_columns, title_from_columns

class Column(Array):
    """Represents column-oriented data.

    This property is used to provide a consistent interface for column-like data. The
    property both validates the data types set, and transforms all column-like data into
    `pd.Series` data.
    """
    def _is_seq(self, value):
        is_array = super(Column, self)._is_seq(value)
        return (isinstance(value, pd.Series) or isinstance(value, pd.Index) or
                isinstance(value, list) or is_array)

    def _new_instance(self, value):
        return pd.Series(value)

    def transform(self, value):
        if value is None:
            return None

        if isinstance(value, pd.Series):
            arr = value.values
        else:
            arr = pd.Series(value).values

        trans_array = super(Column, self).transform(arr)
        try:
            return pd.Series(trans_array)
        except ValueError:

            raise ValueError("Could not transform %r" % value)


class Logical(Bool):
    """A boolean like data type.

    This property is valid for both python and numpy boolean types.
    """
    def validate(self, value):
        try:
            super(Logical, self).validate(value)
        except ValueError:
            if isinstance(value, list):
                value = np.array(value)

            # If not a Bool, then look for pseudo-logical types
            if isinstance(value, np.ndarray):
                values = np.unique(value)
                if len(values) == 2:
                    return

                raise ValueError('expected a Bool or array with 2 unique values, got %s' % value)


class ColumnLabel(Either):
    """Specify a column by name or index."""

    def __init__(self, columns=None, default=None, help=None):
        # ToDo: make sure we can select by integer
        types = (String, Int)
        self.columns = columns
        super(ColumnLabel, self).__init__(*types, default=default, help=help)

    def validate(self, value):
        """If we are given a column list, make sure that the column provided is valid."""
        super(ColumnLabel, self).validate(value)

        if self.columns:
            if type(value) in bokeh_integer_types:
                if len(self.columns) > value:
                    return
                else:
                    raise ValueError("Not a valid column selection.")
            else:
                if value not in self.columns and value not in special_columns:
                    raise ValueError("Column provided is not in the list of valid columns: %s" % self.columns)

    def __str__(self):
        return "Column Name or Column String"


class Dimension(HasProps):
    """Configures valid Chart column selections.

    A dimension is Chart property that is assigned one or more columns names or indices.
    Each column can match one or more column types, which are important to charts,
    because the type of column selection can greatly affect the behavior of generalized
    Charts.

    The Dimension also provides convenient utilities for accessing information
    about the current provided configuration at the global, non-grouped level.

    The dimension configuration does not require the data, but when the data is
    added using the `set_data` method, then validation can occur of the settings
    by using the `valid` and `invalid` types identified by the selection.
    """

    name = String()
    alt_names = Either(String, List(String), default=None)
    columns = Either(ColumnLabel, List(ColumnLabel), default=None)

    valid = Either(PrimitiveProperty, List(PrimitiveProperty), default=None)
    invalid = Either(PrimitiveProperty, List(PrimitiveProperty), default=None)

    selection = Either(ColumnLabel, List(ColumnLabel), default=None)

    def __init__(self, name, **properties):
        properties['name'] = name
        super(Dimension, self).__init__(**properties)
        self._data = pd.DataFrame()
        self._chart_source = None

    def get_valid_types(self, col_data):
        """Returns all property types that are matched."""
        valid_types = list(self.valid)
        matches = []

        # validate each type on the provided column
        for valid_type in valid_types:
            prop = valid_type()

            # if valid, append to the output
            try:
                prop.validate(col_data)
                matches.append(valid_type)
            except ValueError:
                pass

        return matches

    @property
    def data(self):
        """The data selected for the Dimension.

        Returns pd.Series(1) if data is empty or no selection.
        """
        if self._data.empty or self.selection is None:
            return pd.Series(1)
        else:
            # return special column type if available
            if self.selection in list(special_columns.keys()):
                return special_columns[self.selection](self._data)

            return self._data[self.selection]

    def __len__(self):
        return len(self.data.index)

    def set_data(self, data):
        """Set data property so that builders has access to configuration metadata.

        Args:
            data (`ChartDataSource`): the data source associated with the chart
        """
        self.selection = data[self.name]
        self._chart_source = data
        self._data = data.df
        self.columns = list(self._data.columns.values)

    @property
    def min(self):
        """The minimum of one to many column selections."""
        if isinstance(self.data, pd.Series):
            return self.data.min()
        else:
            return self.data.min(axis=1).min()

    @property
    def max(self):
        """The maximum of one to many column selections."""
        if isinstance(self.data, pd.Series):
            return self.data.max()
        else:
            return self.data.max(axis=1).max()

    @property
    def dtype(self):
        if isinstance(self.data, pd.DataFrame):
            return self.data.dtypes[self.selection[0]]
        else:
            return self.data.dtype

    @property
    def computed(self):
        """Check the `ChartDataSource` to see if the selection is a derived column."""
        if self._chart_source is None:
            return False
        else:
            return self._chart_source.is_computed(self.selection)

    @property
    def selected_title(self):
        """A title formatted representation of selected columns."""
        return title_from_columns(self.selection)


class EitherColumn(Either):
    """Allow providing option of column types."""

    # ToDo: incorporate fix into Either
    def matches(self, new, old):
        comparison = super(EitherColumn, self).matches(new, old)
        if isinstance(comparison, bool):
            return comparison
        elif isinstance(comparison, pd.Series):
            return comparison.all()
        else:
            raise ValueError('Failed when comparing Columns')
