from __future__ import absolute_import

from itertools import cycle
from copy import copy

from bokeh.properties import HasProps, String, List, Instance
from bokeh.models.sources import ColumnDataSource
from bokeh.charts import DEFAULT_PALETTE
from bokeh.charts.utils import marker_types


class AttrSpec(HasProps):
    """A container for assigning attributes to values and retrieving them as needed.

    A special function this provides is automatically handling cases where the provided
    iterator is too short compared to the distinct values provided.

    Once created as attr_spec, you can do attr_spec[data_label], where data_label must
    be a one dimensional tuple of values, representing the unique group in the data.
    """

    data = Instance(ColumnDataSource)
    name = String(help='Name of the attribute the spec provides.')
    columns = List(String)

    def __init__(self, columns=None, df=None, iterable=None, default=None, **properties):

        columns = self._ensure_list(columns)

        if df is not None:
            self.data = ColumnDataSource(df)

        if not default and iterable:
            default_iter = copy(iterable)
            default = next(iter(default_iter))

        self._default = default
        self._attr_map = {}
        self._iterable = iterable

        properties['columns'] = columns
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

    def _create_attr_map(self, df, columns):
        """Creates map between unique values and available attributes."""
        iterable = cycle(copy(self._iterable))

        df = df.sort(columns=columns)
        items = df[columns].drop_duplicates()
        items = [tuple(x) for x in items.to_records(index=False)]

        iter_map = {}
        for item in items:
            item = self._ensure_tuple(item)
            iter_map[item] = next(iterable)
        return iter_map

    def setup(self):
        if self.columns is not None and self.data is not None:
            self._attr_map = self._create_attr_map(self.data.to_df(), self.columns)

    def __getitem__(self, item):
        """Lookup the attribute to use for the given unique group label."""

        if not self.columns or not self.data or item is None:
            return self._default
        elif self._ensure_tuple(item) not in self._attr_map.keys():

            # make sure we have attr map
            self.setup()

        return self._attr_map[self._ensure_tuple(item)]


class ColorAttr(AttrSpec):
    name = 'color'

    def __init__(self, **kwargs):
        kwargs['iterable'] = kwargs.pop('palette', DEFAULT_PALETTE)
        super(ColorAttr, self).__init__(**kwargs)


class MarkerAttr(AttrSpec):
    name = 'marker'

    def __init__(self, **kwargs):
        kwargs['iterable'] = kwargs.pop('markers', marker_types.keys())
        super(MarkerAttr, self).__init__(**kwargs)

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
