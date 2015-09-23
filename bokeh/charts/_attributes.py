from __future__ import absolute_import

from itertools import cycle
from copy import copy

from bokeh.properties import (HasProps, String, List, Instance, Either, Any, Dict,
                              Color)
from bokeh.models.sources import ColumnDataSource
from bokeh.charts import DEFAULT_PALETTE
from bokeh.charts._properties import ColumnLabel
from bokeh.charts.utils import marker_types
from bokeh.enums import DashPattern


class AttrSpec(HasProps):
    """A container for assigning attributes to values and retrieving them as needed.

    A special function this provides is automatically handling cases where the provided
    iterator is too short compared to the distinct values provided.

    Once created as attr_spec, you can do attr_spec[data_label], where data_label must
    be a one dimensional tuple of values, representing the unique group in the data.
    """

    id = Any()
    data = Instance(ColumnDataSource)
    name = String(help='Name of the attribute the spec provides.')
    columns = Either(ColumnLabel, List(ColumnLabel))

    default = Any(default=None)
    attr_map = Dict(Any, Any)
    iterable = List(Any, default=None)
    items = List(Any)

    def __init__(self, columns=None, df=None, iterable=None, default=None, **properties):

        properties['columns'] = self._ensure_list(columns)

        if df is not None:
            properties['data'] = ColumnDataSource(df)

        if default is None and iterable is not None:
            default_iter = copy(iterable)
            properties['default'] = next(iter(default_iter))
        elif default is not None:
            properties['default'] = default

        if iterable is not None:
            properties['iterable'] = iterable

        super(AttrSpec, self).__init__(**properties)

    @staticmethod
    def _ensure_list(attr):
        if isinstance(attr, str):
            return [attr]
        elif isinstance(attr, tuple):
            return list(attr)
        else:
            return attr

    @staticmethod
    def _ensure_tuple(attr):
        if not isinstance(attr, tuple):
            return (attr,)
        else:
            return attr

    def _setup_default(self):
        self.default = next(self._setup_iterable())

    def _setup_iterable(self):
        """Default behavior is to copy and cycle the provided iterable."""
        return cycle(copy(self.iterable))

    def _generate_items(self, df, columns):
        """Produce list of unique tuples that identify each item."""
        df = df.sort(columns=columns)
        items = df[columns].drop_duplicates()
        self.items = [tuple(x) for x in items.to_records(index=False)]

    def _create_attr_map(self, df, columns):
        """Creates map between unique values and available attributes."""

        self._generate_items(df, columns)
        iterable = self._setup_iterable()

        iter_map = {}
        for item in self.items:
            item = self._ensure_tuple(item)
            iter_map[item] = next(iterable)
        return iter_map

    def set_columns(self, columns):
        columns = self._ensure_list(columns)
        if all([col in self.data.column_names for col in columns]):
            self.columns = columns
        else:
            # we have input values other than columns
            # assume this is now the iterable at this point
            self.iterable = columns
            self._setup_default()

    def setup(self, data=None, columns=None):
        if data is not None:
            self.data = data

            if columns is not None:
                self.set_columns(columns)

        if self.columns is not None and self.data is not None:
            self.attr_map = self._create_attr_map(self.data.to_df(), self.columns)

    def __getitem__(self, item):
        """Lookup the attribute to use for the given unique group label."""

        if not self.columns or not self.data or item is None:
            return self.default
        elif self._ensure_tuple(item) not in self.attr_map.keys():

            # make sure we have attr map
            self.setup()

        return self.attr_map[self._ensure_tuple(item)]


class ColorAttr(AttrSpec):
    name = 'color'
    iterable = List(Color, default=DEFAULT_PALETTE)

    def __init__(self, **kwargs):
        iterable = kwargs.pop('palette', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(ColorAttr, self).__init__(**kwargs)


class MarkerAttr(AttrSpec):
    name = 'marker'
    iterable = List(String, default=list(marker_types.keys()))

    def __init__(self, **kwargs):
        iterable = kwargs.pop('markers', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(MarkerAttr, self).__init__(**kwargs)


dashes = DashPattern._values


class DashAttr(AttrSpec):
    name = 'dash'
    iterable = List(String, default=dashes)

    def __init__(self, **kwargs):
        iterable = kwargs.pop('dash', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(DashAttr, self).__init__(**kwargs)


class GroupAttr(AttrSpec):
    name = 'nest'

    def __init__(self, **kwargs):
        super(GroupAttr, self).__init__(**kwargs)

    def _setup_iterable(self):
        return iter(self.items)

    def get_levels(self, columns):
        """Provides a list of levels the attribute represents."""
        if self.columns is not None:
            levels = [columns.index(col) for col in self.columns]
            return levels
        else:
            return []


""" Attribute Spec Functions

Convenient functions for producing attribute specifications. These would be
the interface used by end users when providing attribute specs as inputs
to the Chart.
"""


def color(columns=None, palette=None, **kwargs):
    """Produces a ColorAttr specification for coloring groups of data based on columns."""
    if palette is not None:
        kwargs['palette'] = palette

    kwargs['columns'] = columns
    return ColorAttr(**kwargs)


def marker(columns=None, markers=None, **kwargs):

    if markers is not None:
        kwargs['markers'] = markers

    kwargs['columns'] = columns
    return MarkerAttr(**kwargs)
