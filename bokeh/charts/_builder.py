"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Builder class, a minimal prototype class to build more chart
types on top of it.
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

from ._chart import Chart
from ._data_source import ChartDataSource
from ..models.ranges import Range, Range1d
from ..properties import Color, HasProps, Instance, Seq, List, String, Property

DEFAULT_PALETTE = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def create_and_build(builder_class, *data, **kws):

    if isinstance(builder_class.dimensions, Property):
        raise NotImplementedError('Each builder must specify its dimensions.')

    builder_props = set(builder_class.properties())

    for dim in builder_class.dimensions:
        builder_props.add(dim)

    # create the new builder
    builder_kws = { k:v for k,v in kws.items() if k in builder_props}
    builder = builder_class(*data, **builder_kws)

    # create a chart to return, since there isn't one already
    chart_kws = { k:v for k,v in kws.items() if k not in builder_props}
    chart = Chart(**chart_kws)
    chart.add_builder(builder)

    return chart


class Builder(HasProps):
    """ A prototype class to inherit each new chart Builder type.

    It provides useful methods to be used by the inherited builder classes,
    in order to automate most of the charts creation tasks and leave the
    core customization to specialized builder classes. In that pattern
    inherited builders just need to provide:

     - the following methods:
        * _yield_renderers: yields the glyphs to be rendered into the plot (and
            eventually create the self._legends attribute to be used to
            create the proper legends when builder is called to build
            the glyphs on a Chart object
        * _process_data(optional): Get the input data and calculates the 'data'
            attribute to be used to calculate the source data
        * _set_sources(optional): Push data into the self.source attribute
            (of type ColumnDataSource) and build the proper ranges
            (self.x_range and self.y_range).

    - the following attributes:
        x_range:
        y_range:
        _legends:


    so Builder can use it all to _yield_renderers on a chart when called with the
    create method.

    """

    x_range = Instance(Range)
    y_range = Instance(Range)

    # Dimensional Modeling
    dimensions = List(String, help="""The dimension
        labels that drive the position of the glyphs.""")
    req_dimensions = List(String, help="""The dimension
        labels that must exist to produce the glyphs.""")

    palette = Seq(Color, default=DEFAULT_PALETTE)

    def __init__(self, *args, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            data (iterable): iterable 2d representing the data series
                values matrix.
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
            palette(list, optional): a list containing the colormap as hex values.


        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            x_range (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            y_range (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list(AttrSpec)): to be filled with the new attributes created after
                loading the data dict.
        """
        super(Builder, self).__init__(**kws)
        if len(args) == 0:
            data = None
        else:
            kws['dims'] = tuple(self.dimensions)
            kws['required_dims'] = tuple(self.req_dimensions)
            data = ChartDataSource.from_data(*args, **kws)

        self._data = data
        self._legends = []
        self._attr = []

    def _adapt_values(self):
        """Prepare the input data.

        Converts data input (self._values) to a DataGrouper and creates
        instance index if needed
        """
        pass
        # ToDo: Is this still needed?

    def _process_data(self):
        """Make any global data manipulations before grouping.

        It has to be implemented by any of the inherited class
        representing each different chart type. It is the place
        where we make specific calculations for each chart.
        """
        pass

    def _set_sources(self):
        """Push data into the ColumnDataSource and build the
        proper ranges.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass
        # ToDo: Is this still needed? Should be set in yield_renderers?

    def _yield_renderers(self):
        """ Generator that yields the glyphs to be draw on the plot

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def create(self, chart=None):
        self._adapt_values()
        self._process_data()
        self._set_sources()
        renderers = self._yield_renderers()

        chart.add_renderers(self, renderers)

        # create chart ranges..
        if not chart.x_range:
            chart.x_range = self.x_range
        if not chart.y_range:
            chart.y_range = self.y_range

        # always contribute legends, let Chart sort it out
        #legends = self.legends
        #chart.add_legend(legends)

        return chart


class XYBuilder(Builder):
    """Implements common functionality for XY Builders."""

    x = String()
    y = String()
    dimensions = ['x', 'y']
    req_dimensions = ['x']

    def _set_sources(self):
        """Push the Scatter data into the ColumnDataSource and
        calculate the proper ranges."""
        # ToDo: handle when only single dimension is provided

        x = self._data['x']
        y = self._data['y']

        endx = self._data.df[x].max()
        startx = self._data.df[x].min()
        self.x_range = Range1d(
            start=startx - 0.1 * (endx - startx),
            end=endx + 0.1 * (endx - startx)
        )

        endy = self._data.df[y].max()
        starty = self._data.df[y].min()
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )
