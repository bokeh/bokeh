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
from ._data_adapter import DataAdapter
from ..models.ranges import Range
from ..models import ColumnDataSource, DataRange1d, GlyphRenderer
from ..properties import Color, HasProps, Instance, Seq, String, Any
from .utils import cycle_colors

DEFAULT_PALETTE = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def create_and_build(builder_class, values, **kws):
    builder_props = set(builder_class.properties())

    # create the new builder
    builder_kws = { k:v for k,v in kws.items() if k in builder_props}
    builder = builder_class(values, **builder_kws)

    # create a chart to return, since there isn't one already
    if 'chart' in kws:
        chart = kws['chart']
    else:
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
    y_names = Seq(String)
    x_names = Seq(String)

    palette = Seq(Color, default=DEFAULT_PALETTE)
    source = Instance(ColumnDataSource)

    index = Any(help="""
    An index to be used for all data series as follows:

    - A 1d iterable of any sort that will be used as
       series common index

    - As a string that corresponds to the key of the
       mapping to be used as index (and not as data
       series) if area.values is a mapping (like a dict,
       an OrderedDict or a pandas DataFrame)

   """)

    source_prefix = ""

    def __init__(self, values=None, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            values (iterable): iterable 2d representing the data series
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
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        super(Builder, self).__init__(**kws)
        if values is None:
            values = []

        self._values = values
        # TODO: No real reason why legends should be *private*, should be
        # legends
        self._legends = []
        self._data = {}
        self._groups = []
        self._attr = []

    def _adapt_values(self):
        """Prepare the input data.

        Converts data input (self._values) to a DataAdapter and creates
        instance index if needed
        """
        if isinstance(self._values, ColumnDataSource):
            self.source = self._values
            self._values = self.source.data
            self._data = self.source.data

        if self.index:
            self._values_index, self._values = DataAdapter.get_index_and_data(
                self._values, self.index
                )
            self.x_names = ["x"]
        else:
            # TODO: This should be modified to support multiple x_names
            self._values_index, self._values = DataAdapter.get_index_and_data(
                self._values, self.x_names
            )
            if not self.x_names:
                self.x_names = ["x"]

        if not self.y_names:
            self.y_names = [k for k in self._values.keys() if k not in self.x_names]

    def _process_data(self):
        """Get the input data.

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
        if not self.source:
            self.source = ColumnDataSource(self._data)

    def _set_ranges(self):
        """Push data into the ColumnDataSource and build the
        proper ranges.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pref = self.source_prefix + "%s"
        if not self.x_range:
            x_sources = [self.source.columns(pref % col) for col in self.x_names]
            self.x_range = DataRange1d(sources=x_sources)

        if not self.y_range:
            y_sources = [self.source.columns(pref % col) for col in self.y_names]
            self.y_range = DataRange1d(sources=y_sources)

    def _yield_renderers(self):
        """Use the line glyphs to connect the xy points in the Line.
        Takes reference points from the data loaded at the ColumnDataSource.
        """
        if len(self.x_names) == len(self.y_names):
            xnames = self.x_names
        else:
            xnames = len(self.y_names) * self.x_names

        for color, xname, yname in zip(self.colors, xnames, self.y_names):
            glyph = self._create_glyph(xname, yname, color)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((yname, [renderer]))
            yield renderer

    def _create_glyph(self, xname, yname, color):
        pass

    def create(self, chart=None):
        self._adapt_values()
        self._process_data()
        self._set_sources()
        self._set_ranges()
        renderers = self._yield_renderers()

        chart.add_renderers(self, renderers)

        # create chart ranges..
        if not chart.x_range:
            chart.x_range = self.x_range
        if not chart.y_range:
            chart.y_range = self.y_range

        # always contribute legends, let Chart sort it out
        legends = self._legends
        chart.add_legend(legends)

        return chart

    #***************************
    # Some helper methods
    #***************************

    @property
    def colors(self):
        return cycle_colors(self.y_names, self.palette)
