""" Statistical methods used to define or modify position of glyphs.

References:
    Wilkinson L. The Grammer of Graphics, sections 7, 7.1

Method Types:
    - Bin: Partitions a space before statistical calculation
    - Summary: Produces a single value comprising a statistical summary
    - Region: Produces two values bounding an interval.
    - Smooth: Produces values representing smoothed versions of the input data.
    - Link: Produces edges from pairs of nodes in a graph.

"""

from __future__ import absolute_import

import numpy as np
import pandas as pd
from six import iteritems

from bokeh.models.sources import ColumnDataSource
from bokeh.properties import (HasProps, Float, Either, String, Date, Datetime, Int,
                              Bool, List, Instance, Dict)
from .properties import Column, EitherColumn, ColumnLabel


class Stat(HasProps):
    """Represents a statistical operation to summarize a column of data.

    Can be computed from either a ColumnLabel with a ColumnDataSource, *or*, a
    discrete column of data.
    """

    # inputs
    column = ColumnLabel(help="""A column to use for the stat calculation. Required
        when providing a ColumnDataSource as input.""")
    source = Instance(ColumnDataSource, help="""One option for providing the data
        source for stat calculation.""")
    values = EitherColumn(Column(Float), Column(Int), Column(String),
                  Column(Date), Column(Datetime), Column(Bool), default=None, help="""
                  Second option for providing values for stat calculation is by
                  passing the actual column of data.""")

    # output
    value = Float(help="""The value calculated for the stat. Some stats could use
        multiple properties to provide the calculation if required.""")

    def __init__(self, **properties):

        source = properties.pop('source', None)
        if source is not None:
            if isinstance(source, pd.DataFrame):
                source = ColumnDataSource(source)
            properties['source'] = source

        super(Stat, self).__init__(**properties)
        self._refresh()

    def _refresh(self):
        """Lazy update of properties, used for initial transform init."""
        if self.get_data() is not None:
            self.update()
            self.calculate()

    def set_data(self, data, column=None):
        """Set data properties and update all dependent properties."""
        if isinstance(data, pd.DataFrame):
            data = ColumnDataSource(data)

        if isinstance(data, ColumnDataSource):
            self.source = data
            if column is not None:
                self.column = column
        else:
            self.values = data

        self.update()
        self.calculate()

    def get_data(self, column=None):
        """Returns the available columnlabel/source values or column values."""
        if self.source is not None and (self.column is not None or column is not None):
            if column is not None:
                col = column
            else:
                col = self.column

            return pd.Series(self.source.data[col])
        elif self.values is None and self.source is not None:
            return pd.Series(self.source.to_df().index)
        elif self.values is not None:
            return self.values
        else:
            return None

    def calculate(self):
        """Return transformed value from column label/source or column-like data."""
        raise NotImplementedError('You must implement the calculate method '
                                  'for each stat type.')

    def update(self):
        """Perform any initial work before the actual calculation is performed."""
        pass


class Sum(Stat):
    def calculate(self):
        self.value = self.get_data().sum()


class Mean(Stat):
    def calculate(self):
        self.value = self.get_data().mean()


class Count(Stat):
    def calculate(self):
        self.value = self.get_data().count()


class CountDistinct(Stat):
    def calculate(self):
        self.value = self.get_data().nunique()


class Median(Stat):
    def calculate(self):
        self.value = self.get_data().median()


class StdDeviation(Stat):
    def calculate(self):
        self.value = self.get_data().std()


class Min(Stat):
    def calculate(self):
        self.value = self.get_data().min()


class Max(Stat):
    def calculate(self):
        self.value = self.get_data().max()


class Quantile(Stat):
    """Produces the cutpoint that divides the input data by the interval.

    Quartiles are a special case of quartiles that divide a dataset into four
    equal-size groups. (https://en.wikipedia.org/wiki/Quantile)
    """
    interval = Float(default=0.5)

    def calculate(self):
        self.value = self.get_data().quantile(self.interval)


class Bin(Stat):
    """Represents a single bin of data values and attributes of the bin."""
    label = Either(String, List(String))
    start = Either(Float, List(Float))
    stop = Either(Float, List(Float))

    start_label = String()
    stop_label = String()

    center = Either(Float, List(Float))

    stat = Instance(Stat, default=Count())

    def __init__(self, bin_label, values=None, source=None, **properties):
        if isinstance(bin_label, tuple):
            bin_label = list(bin_label)
        else:
            bin_label = [bin_label]
        properties['label'] = bin_label

        bounds = self.process_bounds(bin_label)

        starts, stops = zip(*bounds)
        centers = [(start + stop)/2.0 for start, stop in zip(starts, stops)]
        if len(starts) == 1:
            starts = starts[0]
            stops = stops[0]
            centers = centers[0]
        else:
            starts = list(starts)
            stops = list(stops)
            centers = list(centers)

        properties['start'] = starts
        properties['stop'] = stops
        properties['center'] = centers
        properties['values'] = values
        super(Bin, self).__init__(**properties)

    @staticmethod
    def binstr_to_list(bins):
        """Produce a consistent display of a bin of data."""
        value_chunks = bins.split(',')
        value_chunks = [val.replace('[', '').replace(']', '').replace('(', '').replace(')', '') for val in value_chunks]
        bin_values = [float(value) for value in value_chunks]

        return bin_values[0], bin_values[1]

    def process_bounds(self, bin_label):
        if isinstance(bin_label, list):
            return [self.binstr_to_list(dim) for dim in bin_label]
        else:
            return [self.binstr_to_list(bin_label)]

    def update(self):
        self.stat.set_data(self.values)

    def calculate(self):
        self.value = self.stat.value


class BinStats(Stat):
    """A set of statistical calculations for binning values.

    Bin counts using: https://en.wikipedia.org/wiki/Freedman%E2%80%93Diaconis_rule
    """
    bin_count = Either(Int, Float)
    bin_width = Float(default=None, help='Use Freedman-Diaconis rule if None.')
    q1 = Quantile(interval=0.25)
    q3 = Quantile(interval=0.75)
    labels = List(String)

    def __init__(self, values=None, column=None, **properties):
        properties['values'] = values
        properties['column'] = column or 'values'
        super(BinStats, self).__init__(**properties)

    def update(self):
        values = self.get_data()
        self.q1.set_data(values)
        self.q3.set_data(values)
        if self.bin_count is None:
            self.calc_num_bins(values)

    def calc_num_bins(self, values):
        """Calculate optimal number of bins using IQR.

        From: http://stats.stackexchange.com/questions/114490/optimal-bin-width-for-two-dimensional-histogram

        """
        iqr = self.q3.value - self.q1.value

        if iqr == 0:
            self.bin_width = np.sqrt(values.size)
        else:
            self.bin_width = 2 * iqr * (len(values) ** -(1. / 3.))

        self.bin_count = int(np.ceil((values.max() - values.min()) / self.bin_width))

        if self.bin_count == 1:
            self.bin_count = 3

    def calculate(self):
        pass


class Bins(Stat):
    """Bins and aggregates dimensions for plotting.

    Takes the inputs and produces a list of bins that can be iterated over and
    inspected for their metadata. The bins provide easy access to consistent labeling,
    bounds, and values.
    """
    dimensions = Dict(String, ColumnLabel, help="""
        A mapping between dimensions name (e.g., 'x') and the column
        that the dimension is associated with (e.g., 'mpg').
        """)

    stats = Dict(String, Instance(BinStats), default={}, help="""
        A mapping between each dimension and associated binning calculations.
        """)

    bins = List(Instance(Bin), help="""
        A list of the `Bin` instances that were produced as result of the inputs.
        Iterating over `Bins` will iterate over this list. Each `Bin` can be inspected
        for metadata about the bin and the values associated with it.
        """)

    stat = Instance(Stat, default=Count(), help="""
        The statistical operation to be used on the values in each bin.
        """)

    bin_count = List(Int, default=[], help="""
        An optional list of the number of bins to use for each dimension. If a single
        value is provided, then the same number of bins will be used for each.
        """)

    aggregate = Bool(default=True)

    bin_values = Bool(default=False)

    value_stat = Instance(BinStats)
    value_bins = List(Instance(Bin))

    value_labels = List(String)

    dim_labels = List(String)

    _df = None

    def __init__(self, values=None, column=None, dimensions=None, bins=None,
                 stat='count', source=None, **properties):
        if isinstance(stat, str):
            stat = stats[stat]()

        bin_count = properties.get('bin_count')
        if bin_count is not None and not isinstance(bin_count, list):
            properties['bin_count'] = [bin_count]
        else:
            properties['bin_count'] = []

        properties['dimensions'] = dimensions
        properties['column'] = column
        properties['bins'] = bins
        properties['stat'] = stat
        properties['values'] = values
        properties['source'] = source

        super(Bins, self).__init__(**properties)

    def _get_stat(self, dim):
        stat_kwargs = {}

        if self.source is not None:
            stat_kwargs['source'] = self.source

            if len(self.dimensions.keys()) > 0:
                stat_kwargs['column'] = self.dimensions[dim]
            elif self.column is not None:
                stat_kwargs['column'] = self.column
            else:
                stat_kwargs['column'] = 'values'
        elif self.values is not None:
            stat_kwargs['values'] = self.values
        else:
            raise ValueError('Could not identify bin stat for %s' % dim)

        # ToDo: handle multiple bin count inputs for each dimension
        if len(self.bin_count) == 1:
           stat_kwargs['bin_count'] = self.bin_count[0]

        return BinStats(**stat_kwargs)

    def update(self):
        self.stats = {dim: self._get_stat(dim) for dim in self.dimensions}
        if len(list(self.stats.keys())) == 0:
            self.stats = {'values': self._get_stat('values')}

        if len(list(self.stats.keys())) > 0:
            for stat in self.stats.values():
                stat.update()

    def calculate(self):

        values = self.get_data()
        if self.column is not None:
            val_col = self.column
        else:
            val_col = 'values'

        # if we are aggregating, we replace existing columns, otherwise add bins as new
        if self.aggregate:
            bin_str = ''
        else:
            bin_str = '_bin'

        data = {val_col: values}
        bin_cols = []
        bins = []

        # if we aren't binning by different column, we bin the values array instead
        for stat in self.stats.values():
            binned, _ = pd.cut(stat.get_data(), stat.bin_count,
                               retbins=True, precision=0)
            bin_col = stat.column
            data[bin_col + bin_str] = binned
            if not self.aggregate:
                data[bin_col] = stat.get_data()
            bin_cols.append(bin_col + bin_str)

        self._df = pd.DataFrame(data)

        # ToDo: should each bin have access to the dimension values?
        for name, group in self._df.groupby(bin_cols):
            bins.append(Bin(bin_label=name, values=group[val_col], stat=self.stat))

        if self.aggregate:
            data = {}

            if len(bin_cols) == 1:
                data[bin_cols[0]] = [bin.center for bin in bins]
            else:
                # build up data based on number of bin_cols/dims and if we are only using values
                for idx, bin_col in enumerate(bin_cols):
                    data[bin_col] = [bin.center[idx] for bin in bins]

            if val_col in data:
                val_col = 'values'

            data[val_col] = [bin.value for bin in bins]

            self._df = pd.DataFrame(data)

        self.bins = bins

    def __getitem__(self, item):
        return self.bins[item]

    def apply(self, data):
        self.set_data(data.source)
        self.dim_labels = list(data._dims)

        for dim in data._dims:
            if dim in self.dimensions:
                data[dim] = self.dimensions[dim]

        if self.column is not None:
            data['values'] = self.column

        return self._df

    def get_dim_width(self, dim):

        dims = list(self.dimensions.keys())
        idx = dims.index(dim)

        return self.bins[0].stop[idx] - self.bins[0].start[idx]

    def sort(self, ascending=True):
        if self.bins is not None and len(self.bins) > 0:
            self.bins = list(sorted(self.bins, key=lambda x: x.center,
                                    reverse=~ascending))


def bins(data, values=None, column=None, dimensions=None, bins=None, labels=None,
         **kwargs):
    """Specify binning or bins to be used for column or values."""

    if isinstance(data, str):
        column = data
        values = None
    else:
        column = None

    return Bins(values=values, column=column, bin_count=bins,
                dimensions=dimensions, **kwargs)


stats = {
    'sum': Sum,
    'mean': Mean,
    'count': Count,
    'nunique': CountDistinct,
    'median': Median,
    'stddev': StdDeviation,
    'min': Min,
    'max': Max,
    'quantile': Quantile
}