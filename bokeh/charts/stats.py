''' Statistical methods used to define or modify position of glyphs.

References:
    Wilkinson L. The Grammer of Graphics, sections 7, 7.1

Method Types:
    - Bin: Partitions a space before statistical calculation
    - Summary: Produces a single value comprising a statistical summary
    - Region: Produces two values bounding an interval.
    - Smooth: Produces values representing smoothed versions of the input data.
    - Link: Produces edges from pairs of nodes in a graph.

'''
from __future__ import absolute_import

import numpy as np
import pandas as pd

from bokeh.models.sources import ColumnDataSource
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Bool, Date, Datetime, Either, Float, Instance, Int, List, String

from .properties import Column, ColumnLabel, EitherColumn

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
    width = Float()

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
    bins = Either(Int, Float, List(Float), default=None, help="""
    If bins is an int, it defines the number of equal-width bins in the
    given range. If bins is a sequence, it defines the
    bin edges, including the rightmost edge, allowing for non-uniform
    bin widths.

    (default: None, use Freedman-Diaconis rule)
    """)
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
        if self.bins is None:
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

        self.bins = int(np.ceil((values.max() - values.min()) / self.bin_width))

        if self.bins <= 1:
            self.bins = 3

    def calculate(self):
        pass


class BinnedStat(Stat):
    """ Base class for shared functionality accross bins and aggregates
    dimensions for plotting.

    """
    bin_stat = Instance(BinStats, help="""
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

    bin_column = String()
    centers_column = String()

    aggregate = Bool(default=True)

    bin_values = Bool(default=False)

    bin_width = Float()

    def __init__(self, values=None, column=None, bins=None,
                 stat='count', source=None, **properties):

        if isinstance(stat, str):
            stat = stats[stat]()

        properties['column'] = column or 'vals'
        properties['stat'] = stat
        properties['values'] = values
        properties['source'] = source
        self._bins = bins
        super(BinnedStat, self).__init__(**properties)


    def _get_stat(self):
        stat_kwargs = {}

        if self.source is not None:
            stat_kwargs['source'] = self.source
            stat_kwargs['column'] = self.column

        elif self.values is not None:
            stat_kwargs['values'] = self.values

        stat_kwargs['bins'] = self._bins

        return BinStats(**stat_kwargs)

    def update(self):
        self.bin_stat = self._get_stat()
        self.bin_stat.update()


class Bins(BinnedStat):
    """Bins and aggregates dimensions for plotting.

    Takes the inputs and produces a list of bins that can be iterated over and
    inspected for their metadata. The bins provide easy access to consistent labeling,
    bounds, and values.
    """

    def calculate(self):

        bin_str = '_bin'
        self.bin_column = self.column + bin_str
        bin_models = []

        data = self.bin_stat.get_data()
        bins = self.bin_stat.bins

        # Choose bin bounds when data range is ill-defined; pd.cut()
        # does not handle this well for values that are <= 0
        if data.size < 2:
            raise ValueError('Histogram data must have at least two elements.')
        if data.ndim == 1 and data.std() == 0:
            margin = 0.01 * abs(float(data[0])) or 0.01
            bins = np.linspace(data[0] - margin, data[0] + margin, bins+1)

        binned, bin_bounds = pd.cut(data, bins,
                                    retbins=True, include_lowest=True, precision=0)

        self.bin_width = np.round(bin_bounds[2] - bin_bounds[1], 1)

        if self.source is not None:
            # add bin column to data source
            self.source.add(binned.tolist(), name=self.bin_column)
            df = self.source.to_df()
        else:
            df = pd.DataFrame({self.column: self.values, self.bin_column: binned})

        for name, group in df.groupby(self.bin_column):
            bin_models.append(Bin(bin_label=name, values=group[self.column],
                                  stat=self.stat))

        self.bins = bin_models

        centers = binned.copy()
        centers = centers.astype(str)
        for bin in self.bins:
            centers[binned == bin.label] = bin.center

        self.centers_column = self.column + '_center'
        if self.source is not None:
            self.source.add(centers.tolist(), name=self.centers_column)
        else:
            df[self.centers_column] = centers

    def __getitem__(self, item):
        return self.bins[item]

    def apply(self, data):
        self.set_data(data.source)
        return self.source.to_df()

    def sort(self, ascending=True):
        if self.bins is not None:
            self.bins = list(sorted(self.bins, key=lambda x: x.center,
                                    reverse=~ascending))


class Histogram(BinnedStat):
    """Bins and aggregates dimensions for plotting.

    Takes the inputs and produces a list of bins that can be iterated over and
    inspected for their metadata. The bins provide easy access to consistent labeling,
    bounds, and values.
    """

    density = Bool(False, help="""
    Whether to normalize the histogram.

    If True, the result is the value of the probability *density* function
    at the bin, normalized such that the *integral* over the range is 1. If
    False, the result will contain the number of samples in each bin.

    For more info check ``numpy.histogram`` function documentation.

    (default: False)
    """)

    def calculate(self):
        bin_str = '_bin'
        self.bin_column = self.column + bin_str

        data = self.bin_stat.get_data()
        bins = self.bin_stat.bins

        binned, bin_bounds = np.histogram(
                        np.array(data), density=self.density, bins=bins
                    )

        self.bin_width = np.round(bin_bounds[2] - bin_bounds[1], 1)
        self.bins = []

        for i, b in enumerate(binned):
            width = bin_bounds[i+1] - bin_bounds[i]
            if i == 0:
                lbl = "[%f, %f]" % (bin_bounds[i], bin_bounds[i+1])
            else:
                lbl = "(%f, %f]" % (bin_bounds[i], bin_bounds[i+1])
            self.bins.append(Bin(bin_label=lbl, values=[binned[i]], stat=Max(),
                width=width))


def bins(data, values=None, column=None, bins=None, labels=None,
         **kwargs):
    """Specify binning or bins to be used for column or values."""

    if isinstance(data, str):
        column = data
        values = None
    else:
        column = None

    return Bins(values=values, column=column, bins=bins, **kwargs)


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
