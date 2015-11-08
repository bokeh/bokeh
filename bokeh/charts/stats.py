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

from bokeh.models.sources import ColumnDataSource
from bokeh.properties import HasProps, Float, Either, String, Date, Datetime, Int, Bool, List, Instance
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
            self.source = ColumnDataSource(data)
            if column is None:
                raise ValueError('When providing a table of data, '
                                 'you must also provide a column label')
            else:
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
    """A set of many individual Bin stats.

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
        iqr = self.q3.value - self.q1.value
        self.bin_width = 2 * iqr * (len(values) ** -(1. / 3.))
        self.bin_count = int(np.ceil((values.max() - values.min())/self.bin_width))

    def calculate(self):
        pass


class Bins(Stat):
    dimensions = List(ColumnLabel)
    stats = List(Instance(BinStats), default=[])
    bins = List(Instance(Bin))
    stat = Instance(Stat, default=Count())
    bin_count = List(Int, default=[])

    bin_values = Bool(default=False)

    value_stat = Instance(BinStats)
    value_bins = List(Instance(Bin))

    value_labels = List(String)

    _df = None

    def __init__(self, values=None, column=None, dimensions=None, bins=None,
                 stat='count', **properties):
        if isinstance(stat, str):
            stat = stats[stat]()

        bin_count = properties.get('bin_count')
        if bin_count is not None and not isinstance(bin_count, list):
            properties['bin_count'] = [bin_count]
        else:
            properties['bin_count'] = []

        properties['dimensions'] = dimensions or []
        properties['column'] = column
        properties['bins'] = bins
        properties['stat'] = stat
        properties['values'] = values
        super(Bins, self).__init__(**properties)

    def _get_stat(self, idx):
        stat_kwargs = {}
        if self.source is not None:
            stat_kwargs['source'] = self.source

            if len(self.dimensions) > 0:
                stat_kwargs['column'] = self.dimensions[idx]
            else:
                stat_kwargs['column'] = self.column
        else:
            stat_kwargs['values'] = self.values

        if len(self.bin_count) > idx:
            stat_kwargs['bin_count'] = self.bin_count[idx]

        return BinStats(**stat_kwargs)

    def update(self):
        self.stats = [self._get_stat(idx) for idx in range(0, len(self.dimensions))]
        if len(self.stats) == 0:
            self.stats = [self._get_stat(0)]

        if len(self.stats) > 0:
            for stat in self.stats:
                stat.update()

    def calculate(self):

        values = self.get_data()
        data = {'values': values}
        bin_cols = []
        bins = []

        # if we aren't binning by different column, we bin the values array instead

        for stat in self.stats:
            binned, _ = pd.cut(stat.get_data(), stat.bin_count,
                               retbins=True, precision=0)
            bin_col = stat.column + '_bin'
            data[bin_col] = binned
            bin_cols.append(bin_col)

        self._df = pd.DataFrame(data)

        # ToDo: should each bin have access to the dimension values?
        for name, group in self._df.groupby(bin_cols):
            bins.append(Bin(bin_label=name, values=group['values'], stat=self.stat))

        self.bins = bins

    def __getitem__(self, item):
        return self.bins[item]

def bin(values=None, column=None, bins=None, labels=None):
    """Specify binning or bins to be used for column or values."""

    if isinstance(values, str):
        column = values
        values = None
    else:
        column = None

    return Bins(values=values, column=column, bin_count=bins,
                labels=labels)


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