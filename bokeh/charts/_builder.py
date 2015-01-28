"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the ChartObject class, a minimal prototype class to build more chart
types on top of it. It provides the mechanisms to support the shared chained
methods.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from collections import OrderedDict
import itertools
from ._charts import Chart
from ._data_adapter import DataAdapter
from ..models import GlyphRenderer
from ..models.glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                             DiamondCross, InvertedTriangle,
                             Square, SquareCross, SquareX, Triangle, X)

DEFAULT_PALETTE = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def create_and_build(builder_class, values, **kws):
    # create the new builder
    builder = builder_class(values, **kws)

    # create a chart to return, since there isn't one already
    chart = Chart(**kws)
    chart.add_builder(builder)

    return chart


class Builder(object):
    """A prototype class to inherit each new chart type.

    It provides useful methods to be used by the inherited chart classes,
    such as:
        * chained methods
        * dynamically chart cration attributes, ie. `self.chart`
        * composition to easily use Chart clase methods
    """
    def __init__(self, legend=False, palette=None, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
            palette(list, optional): a list containing the colormap as hex values.

        """
        self._legend = legend
        self._palette = palette or DEFAULT_PALETTE
        self._legends = []
        self.data = {}
        self.groups = []
        self.attr = []
        self.groups = []

    def prepare_values(self):
        """Prepare the input data.

        Converts data input (self.values) to a DataAdapter and creates
        instance index if needed
        """
        if hasattr(self, 'index'):
            self.values_index, self.values = DataAdapter.get_index_and_data(
                self.values, self.index
            )
        else:
            if not isinstance(self.values, DataAdapter):
                self.values = DataAdapter(self.values, force_alias=False)

    def get_data(self):
        """Get the input data.

        It has to be implemented by any of the inherited class
        representing each different chart type. It is the place
        where we make specific calculations for each chart.
        """
        pass

    def get_source(self):
        """Push data into the ColumnDataSource and build the proper ranges.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def draw(self):
        """Draw the glyphs into the plot.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def _pre_create(self):
        """ Hook method that can be overwritten to inject chart logic to
        be executed before make renderers method"""

    def make_renderers(self):
        """
        Executes chart show core operations:

         - checks for chain methods
         - prepare chart data & source
         - create indexes
         - create glyphs
         - draw glyphs
        """
        # prepare values to for the specific chart type
        self.prepare_values()
        # we get the data from the incoming input
        self.get_data()
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we add the glyphs into the plot
        return self.draw()


    def create(self, chart=None):
        self._pre_create()

        # pass these renderers to the chart and then forget about the chart
        renderers = self.make_renderers()
        chart.add_renderers(self, renderers)

        # create chart ranges..
        if not chart.x_range:
            chart.x_range = self.x_range

        if not chart.y_range:
            chart.y_range = self.y_range

        if self._legend:
            if self._legend is True:
                orientation = "top_right"
            else:
                orientation = self._legend

            legends = self._legends
            chart.add_legend(orientation, legends)

        return chart

    #***************************
    # Some helper methods
    #***************************
    def _chunker(self, l, n):
        """Yield successive n-sized chunks from l.

        Args:
            l (list: the incomming list to be chunked
            n (int): lenght of you chucks
        """
        for i in range(0, len(l), n):
            yield l[i:i + n]

    def _set_colors(self, chunk):
        """Build a color list just cycling through a defined palette.

        Args:
            chuck (list): the chunk of elements to generate the color list.
        """
        colors = []

        pal = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]
        import itertools
        g = itertools.cycle(pal)
        for i in range(len(chunk)):
            colors.append(next(g))

        return colors

    def _set_and_get(self, data, prefix, attr, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            data (dict): where to store the new attribute content
            attr (list): where to store the new attribute names
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        setattr(self, prefix + val, content)
        data[prefix + val] = getattr(self, prefix + val)
        attr.append(prefix + val)

    def set_and_get(self, prefix, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            prefix (str): prefix of the new attribute
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        self._set_and_get(self.data, prefix, self.attr, val, content)

    @property
    def palette(self):
        """Build a color list just cycling through a defined palette.

        """
        if not self._palette:
            self._palette = self._set_colors(self.groups)

        return self._palette

    def make_scatter(self, source, x, y, markertype, color, line_color=None,
                     size=10, fill_alpha=0.2, line_alpha=1.0):
        """Create a marker glyph and appends it to the renderers list.

        Args:
            source (obj): datasource object containing markers references.
            x (str or list[float]) : values or field names of line ``x`` coordinates
            y (str or list[float]) : values or field names of line ``y`` coordinates
            markertype (int or str): Marker type to use (e.g., 2, 'circle', etc.)
            color (str): color of the points
            size (int) : size of the scatter marker
            fill_alpha(float) : alpha value of the fill color
            line_alpha(float) : alpha value of the line color

        Return:
            scatter: Marker Glyph instance
        """
        if line_color is None:
            line_color = color

        _marker_types = OrderedDict(
            [
                ("circle", Circle),
                ("square", Square),
                ("triangle", Triangle),
                ("diamond", Diamond),
                ("inverted_triangle", InvertedTriangle),
                ("asterisk", Asterisk),
                ("cross", Cross),
                ("x", X),
                ("circle_cross", CircleCross),
                ("circle_x", CircleX),
                ("square_x", SquareX),
                ("square_cross", SquareCross),
                ("diamond_cross", DiamondCross),
            ]
        )

        g = itertools.cycle(_marker_types.keys())
        if isinstance(markertype, int):
            for i in range(markertype):
                shape = next(g)
        else:
            shape = markertype
        glyph = _marker_types[shape](
            x=x, y=y, size=size, fill_color=color, fill_alpha=fill_alpha,
            line_color=line_color, line_alpha=line_alpha
        )

        return GlyphRenderer(data_source=source, glyph=glyph)

