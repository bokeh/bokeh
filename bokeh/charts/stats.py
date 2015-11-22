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

    def get_data(self):
        """Returns the available columnlabel/source values or column values."""
        if self.source is not None and self.column is not None:
            return self.source._data[self.column]
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
    label = String()
    start = Float()
    stop = Float()

    start_label = String()
    stop_label = String()

    center = Float()

    stat = Instance(Stat, default=Count())

    def __init__(self, bin_label, values, **properties):
        properties['label'] = bin_label
        properties['start'], properties['stop'] = self.binstr_to_list(bin_label)
        properties['center'] = (properties['start'] + properties['stop'])/2.0
        properties['values'] = values
        super(Bin, self).__init__(**properties)

    @staticmethod
    def binstr_to_list(bins):
        """Produce a consistent display of a bin of data."""
        value_chunks = bins.split(',')
        value_chunks = [val.replace('[', '').replace(']', '').replace('(', '').replace(')', '') for val in value_chunks]
        bin_values = [float(value) for value in value_chunks]
        return bin_values[0], bin_values[1]

    def update(self):
        self.stat.set_data(self.values)

    def calculate(self):
        self.value = self.stat.value


class Bins(Stat):
    """A set of many individual Bin stats.

    Bin counts using: https://en.wikipedia.org/wiki/Freedman%E2%80%93Diaconis_rule
    """
    bin_count = Either(Int, Float)
    bin_width = Float(default=None, help='Use Freedman-Diaconis rule if None.')
    bins = List(Instance(Bin))
    q1 = Quantile(interval=0.25)
    q3 = Quantile(interval=0.75)
    labels = List(String)

    def __init__(self, values=None, column=None, bins=None, **properties):
        properties['values'] = values
        properties['column'] = column
        properties['bins'] = bins
        super(Bins, self).__init__(**properties)

    def update(self):
        values = self.get_data()
        self.q1.set_data(values)
        self.q3.set_data(values)
        if self.bin_count is None:
            self.calc_num_bins(values)

    def calculate(self):
        binned, bin_edges = pd.cut(self.get_data(), self.bin_count,
                                   retbins=True, precision=0)

        df = pd.DataFrame(dict(values=self.get_data(), bins=binned))
        bins = []
        for name, group in df.groupby('bins'):
            bins.append(Bin(bin_label=name, values=group['values']))
        self.bins = bins

    def calc_num_bins(self, values):
        iqr = self.q3.value - self.q1.value
        self.bin_width = 2 * iqr * (len(values) ** -(1. / 3.))
        self.bin_count = np.ceil((self.values.max() - self.values.min())/self.bin_width)


def bin(values, num_bins=5, bins=None, labels=None):
    """Specify binning or bins to be used for column or values."""

    if isinstance(values, str):
        column = values
        values = None
    else:
        column = None

    if bins is None:
        bins = num_bins

    return Bins(values=values, column=column, bins=bins, num_bins=num_bins, labels=labels)


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
