"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Scatter class which lets you build your Scatter charts
just passing the arguments to the Chart class and calling the proper
functions.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import pandas as pd

from bokeh.charts.builder import create_and_build
from bokeh.charts.glyphs import HorizonGlyph
from .line_builder import LineBuilder
from ...properties import Float, Int, List
from ..attributes import ColorAttr, DashAttr, MarkerAttr, CatAttr, IdAttr
from ...models.sources import ColumnDataSource

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Horizon(data=None, x=None, y=None, **kws):
    """ Create a scatter chart using :class:`ScatterBuilder <bokeh.charts.builders.scatter_builder.ScatterBuilder>`
    to render the geometry from values.

    Args:
        data (:ref:`userguide_charts_data_types`): table-like data
        x (str or list(str), optional): the column label to use for the x dimension
        y (str or list(str), optional): the column label to use for the y dimension

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the scatter points

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.sampledata.autompg import autompg as df
        from bokeh.charts import Scatter, output_file, show

        scatter = Scatter(df, x='mpg', y='hp', color='cyl', marker='origin',
                          title="Auto MPG", xlabel="Miles Per Gallon",
                          ylabel="Horsepower")

        output_file('scatter.html')
        show(scatter)

    """
    kws['x'] = x
    kws['y'] = y
    return create_and_build(HorizonBuilder, data, **kws)


class HorizonBuilder(LineBuilder):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    glyph = HorizonGlyph
    series_max = Float()
    series_count = Int()
    num_folds = Int(default=3)
    bins = List(Float)

    default_attributes = {'color': ColorAttr(sort=False),
                          'dash': DashAttr(),
                          'marker': MarkerAttr(),
                          'bin_num': IdAttr(sort=False),
                          'series_num': IdAttr(sort=False)}

    def process_data(self):
        super(HorizonBuilder, self).process_data()

        df = self._data.df
        values = self.y.data.copy()

        # add zero to end temporarily so initial bin includes it
        values[len(values)] = 0
        series_cols = self.attributes['color'].columns[0]
        series = [item[0] for item in self.attributes['color']._items]
        self.series_max = values.max()
        self.series_count = len(series)

        bin_idx, bin_array = pd.cut(values, bins=self.num_folds, labels=False,
                              retbins=True)
        self.bins = bin_array.tolist()[1:]

        # remove dummy value to force binning from 0
        values = values[:-1]
        bin_idx = bin_idx[:-1]

        new_cols = []
        #norm_values = ((values - 0) / (self.series_max - 0)) * self.bins[0]
        for idx, bin in enumerate(self.bins):
            temp_vals = values.copy() - (idx * self.bins[0])
            temp_vals[bin_idx > idx] = self.bins[0]
            temp_vals[bin_idx < idx] = 0
            new_col = series_cols + '_bin' + str(idx)
            df[new_col] = temp_vals
            new_cols.append(new_col)

        self.y.selection = new_cols
        self._data['y'] = new_cols

        id_cols = self.get_id_cols(self.stack_flags)
        self._stack_measures(ids=id_cols)


        df = self._data.df
        for idx, serie in enumerate(series[1:]):
            df.ix[df.ix[:, series_cols] == serie, 'value'] += ((idx + 1) *
                                                                  self.bins[0])

        # norm_values = norm_values + (bin_idx * self.bins[0])


        self.attributes['bin_num'].setup(data=ColumnDataSource(self._data.df),
                                                               columns='variable_')
        self.attributes['series_num'].setup(data=ColumnDataSource(self._data.df),
                                            columns=series_cols)
