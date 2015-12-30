"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the main Chart class which is able to build several plots using the low
level Bokeh API. It setups all the plot characteristics and lets you plot
different chart types, taking OrderedDict as the main input. It also supports
the generation of several outputs (file, server, notebook).
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

import warnings
from six import iteritems
from collections import defaultdict
import numpy as np

from ..core.enums import enumeration, LegendLocation
from ..document import Document
from ..embed import file_html
from ..models import (
    CategoricalAxis, DatetimeAxis, Grid, Legend, LinearAxis, Plot,
    HoverTool, FactorRange
)
from ..plotting import DEFAULT_TOOLS
from ..plotting.helpers import _process_tools_arg
from ..core.properties import (Auto, Bool, Either, Enum, Int, Float,
                          String, Tuple, Override)
from ..resources import INLINE
from ..util.browser import view
from ..util.notebook import publish_display_data
from ..util.deprecate import deprecated

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

Scale = enumeration('linear', 'categorical', 'datetime')

class ChartDefaults(object):
    def apply(self, chart):
        """Apply this defaults to a chart."""

        if not isinstance(chart, Chart):
            raise ValueError("ChartsDefaults should be only used on Chart \
            objects but it's being used on %s instead." % chart)

        for k in chart.properties_with_values(include_defaults=True):
            if k == 'tools':
                value = getattr(self, k, True)
                if getattr(chart, '_tools', None) is None:
                    chart._tools = value
            else:
                if hasattr(self, k):
                    setattr(chart, k, getattr(self, k))

defaults = ChartDefaults()

class Chart(Plot):
    """ The main Chart class, the core of the ``Bokeh.charts`` interface.

    """

    __view_model__ = "Plot"
    __subtype__ = "Chart"

    legend = Either(Bool, Enum(LegendLocation), Tuple(Float, Float), help="""
    A location where the legend should draw itself.
    """)

    xgrid = Bool(True, help="""
    Whether to draw an x-grid.
    """)

    ygrid = Bool(True, help="""
    Whether to draw an y-grid.
    """)

    xlabel = String(None, help="""
    A label for the x-axis. (default: None)
    """)

    ylabel = String(None, help="""
    A label for the y-axis. (default: None)
    """)

    xscale = Either(Auto, Enum(Scale), help="""
    What kind of scale to use for the x-axis.
    """)

    yscale = Either(Auto, Enum(Scale), help="""
    What kind of scale to use for the y-axis.
    """)

    width = Int(600, help="""
    Width of the rendered chart, in pixels.
    """)

    height = Int(400, help="""
    Height of the rendered chart, in pixels.
    """)

    title_text_font_size = Override(default={ 'value' : '14pt' })

    responsive = Override(default=False)

    _defaults = defaults

    __deprecated_attributes__ = ('filename', 'server', 'notebook')

    def __init__(self, *args, **kwargs):
        # pop tools as it is also a property that doesn't match the argument
        # supported types
        tools = kwargs.pop('tools', None)
        super(Chart, self).__init__(*args, **kwargs)
        defaults.apply(self)
        if tools is not None:
            self._tools = tools

        # TODO (bev) have to force serialization of overriden defaults on subtypes for now
        self.title_text_font_size = "10pt"
        self.title_text_font_size = "14pt"

        self._glyphs = []
        self._built = False

        self._builders = []
        self._renderer_map = []
        self._ranges = defaultdict(list)
        self._labels = defaultdict(list)
        self._scales = defaultdict(list)
        self._tooltips = []

        self.create_tools(self._tools)

    def add_renderers(self, builder, renderers):
        self.renderers += renderers
        self._renderer_map.extend({ r._id : builder for r in renderers })

    def add_builder(self, builder):
        self._builders.append(builder)
        builder.create(self)

    def add_ranges(self, dim, range):
        self._ranges[dim].append(range)

    def add_labels(self, dim, label):
        self._labels[dim].append(label)

    def add_scales(self, dim, scale):
        self._scales[dim].append(scale)

    def add_tooltips(self, tooltips):
        self._tooltips += tooltips

    def _get_labels(self, dim):
        if not getattr(self, dim + 'label') and len(self._labels[dim]) > 0:
            return self._labels[dim][0]
        else:
            return getattr(self, dim + 'label')

    def create_axes(self):
        self._xaxis = self.make_axis('x', "below", self._scales['x'][0], self._get_labels('x'))
        self._yaxis = self.make_axis('y', "left", self._scales['y'][0], self._get_labels('y'))

    def create_grids(self, xgrid=True, ygrid=True):
        if xgrid:
            self.make_grid(0, self._xaxis.ticker)
        if ygrid:
            self.make_grid(1, self._yaxis.ticker)

    def create_tools(self, tools):
        """Create tools if given tools=True input.

        Only adds tools if given boolean and does not already have
        tools added to self.
        """

        if isinstance(tools, bool) and tools:
            tools = DEFAULT_TOOLS
        elif isinstance(tools, bool):
            # in case tools == False just exit
            return

        if len(self.tools) == 0:
            # if no tools customization let's create the default tools
            tool_objs = _process_tools_arg(self, tools)
            self.add_tools(*tool_objs)

    def start_plot(self):
        """Add the axis, grids and tools
        """
        self.create_axes()
        self.create_grids(self.xgrid, self.ygrid)

        # Add tools if supposed to
        if self.tools:
            self.create_tools(self.tools)

        if len(self._tooltips) > 0:
            self.add_tools(HoverTool(tooltips=self._tooltips))

    def add_legend(self, legends):
        """Add the legend to your plot, and the plot to a new Document.

        It also add the Document to a new Session in the case of server output.

        Args:
            legends(List(Tuple(String, List(GlyphRenderer)): A list of
                tuples that maps text labels to the legend to corresponding
                renderers that should draw sample representations for those
                labels.
        """
        location = None
        if self.legend is True:
            location = "top_left"
        else:
            location = self.legend

        if location:
            legend = Legend(location=location, legends=legends)
            self.add_layout(legend)

    def make_axis(self, dim, location, scale, label):
        """Create linear, date or categorical axis depending on the location,
        scale and with the proper labels.

        Args:
            location(str): the space localization of the axis. It can be
                ``left``, ``right``, ``above`` or ``below``.
            scale (str): the scale on the axis. It can be ``linear``, ``datetime``
                or ``categorical``.
            label (str): the label on the axis.

        Return:
            axis: Axis instance
        """

        # ToDo: revisit how to handle multiple ranges
        # set the last range to the chart's range
        if len(self._ranges[dim]) == 0:
            raise ValueError('Ranges must be added to derive axis type.')

        data_range = self._ranges[dim][-1]
        setattr(self, dim + '_range', data_range)

        if scale == "auto":
            if isinstance(data_range, FactorRange):
                scale = 'categorical'
            else:
                scale = 'linear'

        if scale == "linear":
            axis = LinearAxis(axis_label=label)
        elif scale == "datetime":
            axis = DatetimeAxis(axis_label=label)
        elif scale == "categorical":
            axis = CategoricalAxis(
                major_label_orientation=np.pi / 4, axis_label=label
            )
        else:
            axis = LinearAxis(axis_label=label)

        self.add_layout(axis, location)
        return axis

    def make_grid(self, dimension, ticker):
        """Create the grid just passing the axis and dimension.

        Args:
            dimension(int): the dimension of the axis, ie. xaxis=0, yaxis=1.
            ticker (obj): the axis.ticker object

        Return:
            grid: Grid instance
        """

        grid = Grid(dimension=dimension, ticker=ticker)
        self.add_layout(grid)

        return grid


    @property
    def filename(self):
        warnings.warn("Chart property 'filename' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_file
        output_file("default.html")

    @filename.setter
    def filename(self, filename):
        warnings.warn("Chart property 'filename' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_file
        output_file(filename)

    @property
    def server(self):
        warnings.warn("Chart property 'server' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_server
        output_server("default")

    @server.setter
    def server(self, session_id):
        warnings.warn("Chart property 'server' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_server
        if session_id:
            if isinstance(session_id, bool):
                session_id='default'
            output_server(session_id)

    @property
    def notebook(self):
        warnings.warn("Chart property 'notebook' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_notebook
        output_notebook()

    @notebook.setter
    def notebook(self, flag):
        warnings.warn("Chart property 'notebook' was deprecated in 0.11 \
            and will be removed in the future.")
        from bokeh.io import output_notebook
        output_notebook()

    @deprecated("Bokeh 0.11", "bokeh.io.show")
    def show(self):
        import bokeh.io
        bokeh.io.show(self)
