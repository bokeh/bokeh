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

from six import string_types
from collections import OrderedDict
import itertools
from ._charts import Chart
from ..properties import bokeh_integer_types, Datetime
from ..models import ColumnDataSource, GlyphRenderer
from ..models.glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                             DiamondCross, InvertedTriangle, Line, Rect, Segment,
                             Square, SquareCross, SquareX, Triangle, X, Quad, Patch,
                             Wedge, AnnularWedge, Text)

try:
    import numpy as np

except ImportError:
    np = None

try:
    import pandas as pd

except ImportError:
    pd = None

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

    # whether to show the xgrid
    xgrid = True

    # whether to show the ygrid
    ygrid = True

    def __init__(self, legend=False, palette=None, **kws):
        """Common arguments to be used by all the inherited classes.

        Args:
            title (str): the title of your plot.
            xlabel (str): the x-axis label of your plot.
            ylabel (str): the y-axis label of your plot.
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
            xscale (str): the x-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
            yscale (str): the y-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
            width (int): the width of your plot in pixels.
            height (int): the height of you plot in pixels.
            tools (bool): to enable or disable the tools in your plot.
            filename (str or bool): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
            server (str or bool): the name of your plot in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
            notebook (bool):if you want to output (or not) your plot into the
                IPython notebook.
            palette(list, optional): a list containing the colormap as hex values.
            xgrid (bool, optional): defines if x-grid of your plot is visible or not
            ygrid (bool, optional): defines if y-grid of your plot is visible or not
        .. note::
            These Args are assigned to private attributes that will be used
            by default at the time of chart instantiation, except in the case
            we call any of the chained methods available, in that case the
            value used with the chained method will overwrite the default one.
        """
        # self.__title = title
        # self.__xlabel = xlabel
        # self.__ylabel = ylabel
        self._legend = legend
        # self.__xscale = xscale
        # self.__yscale = yscale
        # self.__width = width
        # self.__height = height
        # self.__tools = tools
        # self.__filename = filename
        # self.__server = server
        # self.__notebook = notebook
        # self.__facet = facet
        self._palette = palette or DEFAULT_PALETTE
        # self.__xgrid = xgrid
        # self.__ygrid = ygrid
        # self.doc = _doc
        # self.session = _session

        # self.chart = None

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

    def make_segment(self, source, x0, y0, x1, y1, color, width):
        """ Create a segment glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing segment refereces.
            x0 (str or list[float]) : values or field names of starting ``x`` coordinates
            y0 (str or list[float]) : values or field names of starting ``y`` coordinates
            x1 (str or list[float]) : values or field names of ending ``x`` coordinates
            y1 (str or list[float]) : values or field names of ending ``y`` coordinates
            color (str): the segment color
            width (int): the segment width

        Return:
            segment: Segment instance
        """
        glyph = Segment(
            x0=x0, y0=y0, x1=x1, y1=y1, line_color=color, line_width=width
        )
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_line(self, source, x, y, color):
        """Create a line glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing line refereces.
            x (str or list[float]) : values or field names of line ``x`` coordinates
            y (str or list[float]) : values or field names of line ``y`` coordinates
            color (str): the line color

        Return:
            line: Line instance
        """
        glyph = Line(x=x, y=y, line_color=color)
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_quad(self, source, top, bottom, left, right, color, line_color):
        """Create a quad glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing quad refereces.
            left (str or list[float]) : values or field names of left edges
            right (str or list[float]) : values or field names of right edges
            top (str or list[float]) : values or field names of top edges
            bottom (str or list[float]) : values or field names of bottom edges
            color (str): the fill color
            line_color (str): the line color

        Return:
            quad: Quad instance
        """
        glyph = Quad(
            top=top, bottom=bottom, left=left, right=right, fill_color=color,
            fill_alpha=0.7, line_color=line_color, line_alpha=1.0
        )
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_rect(self, source, x, y, width, height, color, line_color, line_width):
        """Create a rect glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            x (str or list[float]) : values or field names of center ``x`` coordinates
            y (str or list[float]) : values or field names of center ``y`` coordinates
            width (str or list[float]) : values or field names of widths
            height (str or list[float]) : values or field names of heights
            color (str): the fill color
            line_color (str): the line color
            line_width (int): the line width

        Return:
            rect: Rect instance
        """
        glyph = Rect(
            x=x, y=y, width=width, height=height, fill_color=color,
            fill_alpha=0.7, line_color=line_color, line_alpha=1.0,
            line_width=line_width
        )
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_patch(self, source, x, y, color):
        """Create a patch glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            x (str or list[float]) : values or field names of center ``x`` coordinates
            y (str or list[float]) : values or field names of center ``y`` coordinates
            color (str): the fill color

        Return:
            patch: Patch instance
        """
        glyph = Patch(x=x, y=y, fill_color=color, fill_alpha=0.9)
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_wedge(self, source, **kws):
        """Create a wedge glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect references.
            **kws (refer to glyphs.Wedge for arguments specification details)

        Return:
            glyph: Wedge instance
        """
        glyph = Wedge(**kws)
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_annular(self, source, **kws):
        """Create a annular wedge glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            **kws (refer to glyphs.AnnularWedge for arguments specification details)

        Return:
            rect: AnnularWedge instance
        """
        glyph = AnnularWedge(**kws)
        return GlyphRenderer(data_source=source, glyph=glyph)

    def make_text(self, source, **kws):
        """Create a text glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect references.
            **kws (refer to glyphs.Text for arguments specification details)

        Return:
            glyph: Text instance
        """
        glyph = Text(**kws)
        return GlyphRenderer(data_source=source, glyph=glyph)

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


DEFAULT_INDEX_ALIASES = list('abcdefghijklmnopqrstuvz1234567890')
DEFAULT_INDEX_ALIASES += list(zip(DEFAULT_INDEX_ALIASES, DEFAULT_INDEX_ALIASES))

class DataAdapter(object):
    """
    Adapter object used to normalize Charts inputs to a common interface.
    Supported inputs are dict, list, tuple, np.ndarray and pd.DataFrame.
    """
    def __init__(self, data, index=None, columns=None, force_alias=True):
        self._values = self.validate_values(data)

        self.convert_index_to_int = False
        self._columns_map = {}
        self.convert_items_to_dict = False

        if columns is None and force_alias:
            # no column 'labels' defined for data... in this case we use
            # default names
            keys = getattr(self._values, 'keys', None)
            if callable(keys):
                columns = list(keys())

            elif keys is None:
                columns = list(map(str, range(len(data))))

            else:
                columns = list(keys)

        if columns:
            self._columns = columns

            # define a mapping between the real keys to access data and the aliases
            # we have defined using 'columns'
            self._columns_map = dict(zip(columns, self.keys()))

        if index is not None:
            self._index = index
            self.convert_items_to_dict = True

        elif force_alias:
            _index = getattr(self._values, 'index', None)

            # check because if it is a callable self._values is not a
            # dataframe (probably a list)
            if _index is None:
                indexes = self.index

                if isinstance(indexes[0], int):
                    self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                    self.convert_items_to_dict = True

            elif not callable(_index):
                self._index = list(_index)
                self.convert_items_to_dict = True

            else:
                self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                self.convert_items_to_dict = True

    @staticmethod
    def is_number(value):
        numbers = (float, ) + bokeh_integer_types
        return isinstance(value, numbers)

    @staticmethod
    def is_datetime(value):
        try:
            dt = Datetime(value)
            return True

        except ValueError:
            return False

    @staticmethod
    def validate_values(values):
        if np and isinstance(values, np.ndarray):
            if len(values.shape) == 1:
                return np.array([values])

            else:
                return values

        elif pd and isinstance(values, pd.DataFrame):
            return values

        elif isinstance(values, (dict, OrderedDict)):
            if all(DataAdapter.is_number(x) for x in values.values()):
                return values

            return values

        elif isinstance(values, (list, tuple)):
            if all(DataAdapter.is_number(x) for x in values):
                return [values]

            return values

        # TODO: Improve this error message..
        raise TypeError("Input type not supported! %s" % values)


    def index_converter(self, x):
        key = self._columns_map.get(x, x)
        if self.convert_index_to_int:
            key = int(key)
        return key

    def keys(self):
        # assuming it's a dict or dataframe
        keys = getattr(self._values, "keys", None)

        if callable(keys):
            return list(keys())

        elif keys is None:
            # assuming that only non-dict like objects can raise this error
            # it's probably because we have an iterable instead of a mapper
            # in this case let's use indices as groups keys
            self.convert_index_to_int = True
            indexes = range(len(self._values))
            return list(map(str, indexes))

        else:
            return list(keys)

    def __len__(self):
        return len(self.values())

    def __iter__(self):
        for k in self.keys():
            yield k

    def __getitem__(self, key):
        val = self._values[self.index_converter(key)]

        # if we have "index aliases" we need to remap the values...
        if self.convert_items_to_dict:
            val = dict(zip(self._index, val))

        return val

    def values(self):
        values = getattr(self._values, "values", None)

        if callable(values):
            return list(values())

        elif values is None:
            return self._values

        else:
            # assuming it's a dataframe, in that case it returns transposed
            # values compared to it's dict equivalent..
            return list(values.T)

    def items(self):
        return [(key, self[key]) for key in self]

    def iterkeys(self):
        return iter(self)

    def itervalues(self):
        for k in self:
            yield self[k]

    def iteritems(self):
        for k in self:
            yield (k, self[k])

    @property
    def columns(self):
        try:
            return self._columns

        except AttributeError:
            return list(self.keys())

    @property
    def index(self):
        try:
            return self._index

        except AttributeError:
            index = getattr(self._values, "index", None)

            if not callable(index) and index is not None:
                # guess it's a pandas dataframe..
                return index

        # no, it's not. So it's probably a list so let's get the
        # values and check
        values = self.values()

        if isinstance(values, dict):
            return list(values.keys())

        else:
            first_el = self.values()[0]

            if isinstance(first_el, dict):
                indexes = list(first_el.keys())

            else:
                indexes = range(0, len(self.values()[0]))
                self._index = indexes
            return indexes

    #-----------------------------------------------------------------------------
    # Convenience methods
    #-----------------------------------------------------------------------------
    @staticmethod
    def get_index_and_data(values, index=None):
        """Parse values (that must be one of the DataAdapter supported
        input types) and create an separate/create index and data
        depending on values type and index.

        Args:
            values (iterable): container that holds data to be plotted using
                on the Chart classes

        Returns:
            xs: iterable that represents the data index
            values: iterable containing the values to be plotted
        """
        if hasattr(values, 'keys'):
            if index is not None:
                if isinstance(index, string_types):
                    xs = values[index]

                else:
                    xs = index

            else:
                try:
                    xs = values.index

                except AttributeError:
                    values = DataAdapter(values, force_alias=False)
                    xs = values.index

        else:
            if index is None:
                values = DataAdapter(values, force_alias=False)
                xs = values.index

            elif isinstance(index, string_types):
                msg = "String indexes are only supported for DataFrame and dict inputs"
                raise TypeError(msg)

            else:
                xs = index
                values = DataAdapter(values, force_alias=False)

        return xs, values
