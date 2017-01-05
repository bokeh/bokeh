'''

'''
from __future__ import absolute_import

from copy import copy
from itertools import cycle

import pandas as pd

from bokeh.core.enums import DashPattern
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Any, Bool, Dict, Either, Instance, List, Override, String
from bokeh.models.sources import ColumnDataSource

from . import DEFAULT_PALETTE
from .data_source import ChartDataSource
from .properties import ColumnLabel
from .utils import marker_types
from .stats import Bins

class AttrSpec(HasProps):
    """A container for assigning attributes to values and retrieving them as needed.

    A special function this provides is automatically handling cases where the provided
    iterator is too short compared to the distinct values provided.

    Once created as attr_spec, you can do attr_spec[data_label], where data_label must
    be a one dimensional tuple of values, representing the unique group in the data.

    See the :meth:`AttrSpec.setup` method for the primary way to provide an existing
    AttrSpec with data and column values and update all derived property values.
    """

    data = Instance(ColumnDataSource)

    iterable = List(Any, default=None)

    attrname = String(help='Name of the attribute the spec provides.')

    columns = Either(ColumnLabel, List(ColumnLabel), help="""
        The label or list of column labels that correspond to the columns that will be
        used to find all distinct values (single column) or combination of values (
        multiple columns) to then assign a unique attribute to. If not enough unique
        attribute values are found, then the attribute values will be cycled.
        """)

    default = Any(default=None, help="""
        The default value for the attribute, which is used if no column is assigned to
        the attribute for plotting. If the default value is not provided, the first
        value in the `iterable` property is used.
        """)

    attr_map = Dict(Any, Any, help="""
        Created by the attribute specification when `iterable` and `data` are
        available. The `attr_map` will include a mapping between the distinct value(s)
        found in `columns` and the attribute value that has been assigned.
        """)

    items = Any(default=None, help="""
        The attribute specification calculates this list of distinct values that are
        found in `columns` of `data`.
        """)

    sort = Bool(default=True, help="""
        A boolean flag to tell the attribute specification to sort `items`, when it is
        calculated. This affects which value of `iterable` is assigned to each distinct
        value in `items`.
        """)

    ascending = Bool(default=True, help="""
        A boolean flag to tell the attribute specification how to sort `items` if the
        `sort` property is set to `True`. The default setting for `ascending` is `True`.
        """)

    bins = Instance(Bins, help="""
        If an attribute spec is binning data, so that we can map one value in the
        `iterable` to one value in `items`, then this attribute will contain an instance
        of the Bins stat. This is used to create unique labels for each bin, which is
        then used for `items` instead of the actual unique values in `columns`.
        """)

    def __init__(self, columns=None, df=None, iterable=None, default=None,
                 items=None, **properties):
        """Create a lazy evaluated attribute specification.

        Args:
            columns: a list of column labels
            df(:class:`~pandas.DataFrame`): the data source for the attribute spec.
            iterable: an iterable of distinct attribute values
            default: a value to use as the default attribute when no columns are passed
            items: the distinct values in columns. If items is provided as input,
                then the values provided are used instead of being calculated. This can
                be used to force a specific order for assignment.
            **properties: other properties to pass to parent :class:`HasProps`
        """
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

        if items is not None:
            properties['items'] = items

        super(AttrSpec, self).__init__(**properties)

        if self.default is None and self.iterable is not None:
            self.default = next(iter(copy(self.iterable)))

        if self.data is not None and self.columns is not None:
            if df is None:
                df = self.data.to_df()

            self._generate_items(df, columns=self.columns)

        if self.items is not None and self.iterable is not None:
            self.attr_map = self._create_attr_map()

    @staticmethod
    def _ensure_list(attr):
        """Always returns a list with the provided value. Returns the value if a list."""
        if isinstance(attr, str):
            return [attr]
        elif isinstance(attr, tuple):
            return list(attr)
        else:
            return attr

    @staticmethod
    def _ensure_tuple(attr):
        """Return tuple with the provided value. Returns the value if a tuple."""
        if not isinstance(attr, tuple):
            return (attr,)
        else:
            return attr

    def _setup_default(self):
        """Stores the first value of iterable into `default` property."""
        self.default = next(self._setup_iterable())

    def _setup_iterable(self):
        """Default behavior is to copy and cycle the provided iterable."""
        return cycle(copy(self.iterable))

    def _generate_items(self, df, columns):
        """Produce list of unique tuples that identify each item."""
        if self.sort:
            # TODO (fpliger):   this handles pandas API change so users do not experience
            #                   the related annoying deprecation warning. This is probably worth
            #                   removing when pandas deprecated version (0.16) is "old" enough
            try:
                df = df.sort_values(by=columns, ascending=self.ascending)
            except AttributeError:
                df = df.sort(columns=columns, ascending=self.ascending)

        items = df[columns].drop_duplicates()
        self.items = [tuple(x) for x in items.to_records(index=False)]

    def _create_attr_map(self, df=None, columns=None):
        """Creates map between unique values and available attributes."""

        if df is not None and columns is not None:
            self._generate_items(df, columns)

        iterable = self._setup_iterable()

        return {item: next(iterable) for item in self._item_tuples()}

    def _item_tuples(self):
        return [self._ensure_tuple(item) for item in self.items]

    def set_columns(self, columns):
        """Set columns property and update derived properties as needed."""
        columns = self._ensure_list(columns)

        if all([col in self.data.column_names for col in columns]):
            self.columns = columns
        else:
            # we have input values other than columns
            # assume this is now the iterable at this point
            self.iterable = columns
            self._setup_default()

    def setup(self, data=None, columns=None):
        """Set the data and update derived properties as needed."""
        if data is not None:
            self.data = data

        if columns is not None and self.data is not None:
            self.set_columns(columns)

        if self.columns is not None and self.data is not None:
            self.attr_map = self._create_attr_map(self.data.to_df(), self.columns)

    def update_data(self, data):
        self.setup(data=data, columns=self.columns)

    def __getitem__(self, item):
        """Lookup the attribute to use for the given unique group label."""

        if not self.attr_map:
            return self.default
        elif self._ensure_tuple(item) not in self.attr_map.keys():

            # make sure we have attr map
            self.setup()

        return self.attr_map[self._ensure_tuple(item)]

    @property
    def series(self):
        if not self.attr_map:
            return pd.Series()
        else:
            index = pd.MultiIndex.from_tuples(self._item_tuples(), names=self.columns)
            return pd.Series(list(self.attr_map.values()), index=index)


class ColorAttr(AttrSpec):
    """An attribute specification for mapping unique data values to colors.

    .. note::
        Should be expanded to support more complex coloring options.
    """
    attrname = Override(default='color')
    iterable = Override(default=DEFAULT_PALETTE)
    bin = Bool(default=False)

    def __init__(self, **kwargs):
        iterable = kwargs.pop('palette', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(ColorAttr, self).__init__(**kwargs)

    def _generate_items(self, df, columns):
        """Produce list of unique tuples that identify each item."""
        if not self.bin:
            super(ColorAttr, self)._generate_items(df, columns)
        else:

            if len(columns) == 1 and ChartDataSource.is_number(df[columns[0]]):

                self.bins = Bins(source=ColumnDataSource(df), column=columns[0],
                                 bins=len(self.iterable), aggregate=False)

                if self.sort:
                    self.bins.sort(ascending=self.ascending)

                self.items = [bin.label[0] for bin in self.bins]
            else:
                raise ValueError('Binned colors can only be created for one column of \
                                 numerical data.')

    def add_bin_labels(self, data):
        col = self.columns[0]
        # save original values into new column
        data._data[col + '_values'] = data._data[col]

        for bin in self.bins:
            # set all rows associated to each bin to the bin label being mapped to colors
            data._data.ix[data._data[col + '_values'].isin(bin.values),
                          col] = bin.label[0]

        data._data[col] = pd.Categorical(data._data[col], categories=list(self.items),
                                         ordered=self.sort)


class MarkerAttr(AttrSpec):
    """An attribute specification for mapping unique data values to markers."""
    attrname = Override(default='marker')
    iterable = Override(default=list(marker_types.keys()))

    def __init__(self, **kwargs):
        iterable = kwargs.pop('markers', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(MarkerAttr, self).__init__(**kwargs)


dashes = DashPattern._values


class DashAttr(AttrSpec):
    """An attribute specification for mapping unique data values to line dashes."""
    attrname = Override(default='dash')
    iterable = Override(default=dashes)

    def __init__(self, **kwargs):
        iterable = kwargs.pop('dash', None)
        if iterable is not None:
            kwargs['iterable'] = iterable
        super(DashAttr, self).__init__(**kwargs)


class IdAttr(AttrSpec):
    """An attribute specification for mapping unique data values to line dashes."""
    attrname = Override(default='id')

    def _setup_iterable(self):
        return iter(range(0, len(self.items)))


class CatAttr(AttrSpec):
    """An attribute specification for mapping unique data values to labels.

    .. note::
        this is a special attribute specification, which is used for defining which
        labels are used for one aspect of a chart (grouping) vs another (stacking or
        legend)
    """
    attrname = Override(default='nest')

    def __init__(self, **kwargs):
        super(CatAttr, self).__init__(**kwargs)

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


def color(columns=None, palette=None, bin=False, **kwargs):
    """Produces a ColorAttr specification for coloring groups of data based on columns.

    Args:
        columns (str or list(str), optional): a column or list of columns for coloring
        palette (list(str), optional): a list of colors to use for assigning to unique
            values in `columns`.
        **kwargs: any keyword, arg supported by :class:`AttrSpec`

    Returns:
        a `ColorAttr` object
    """
    if palette is not None:
        kwargs['palette'] = palette

    kwargs['columns'] = columns
    kwargs['bin'] = bin
    return ColorAttr(**kwargs)


def marker(columns=None, markers=None, **kwargs):

    """ Specifies detailed configuration for a marker attribute.

    Args:
        columns (list or str):
        markers (list(str) or str): a custom list of markers. Must exist within
            :data:`marker_types`.
        **kwargs: any keyword, arg supported by :class:`AttrSpec`

    Returns:
        a `MarkerAttr` object
    """
    if markers is not None:
        kwargs['markers'] = markers

    kwargs['columns'] = columns
    return MarkerAttr(**kwargs)


def cat(columns=None, cats=None, sort=True, ascending=True, **kwargs):
    """ Specifies detailed configuration for a chart attribute that uses categoricals.

    Args:
        columns (list or str): the columns used to generate the categorical variable
        cats (list, optional): overrides the values derived from columns
        sort (bool, optional): whether to sort the categorical values (default=True)
        ascending (bool, optional): whether to sort the categorical values (default=True)
        **kwargs: any keyword, arg supported by :class:`AttrSpec`

    Returns:
        a `CatAttr` object
    """
    if cats is not None:
        kwargs['cats'] = cats

    kwargs['columns'] = columns
    kwargs['sort'] = sort
    kwargs['ascending'] = ascending

    return CatAttr(**kwargs)
