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

from collections import defaultdict

import numpy as np
from six import iteritems

from ..core.enums import enumeration, LegendLocation
from ..document import Document
from ..embed import file_html
from ..model import Viewable
from ..models import (
    CategoricalAxis, DatetimeAxis, Grid, Legend, LinearAxis, Plot,
    HoverTool, FactorRange
)
from ..plotting import DEFAULT_TOOLS
from ..plotting.helpers import _process_tools_arg
from ..core.properties import (HasProps, Auto, Bool, Either, Enum, Int, Float,
                          String, Tuple, Override)
from ..resources import INLINE
from ..util.browser import view
from ..util.notebook import publish_display_data
from ..util.serialization import make_id
from ..util.future import with_metaclass
from ..themes import Theme

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

Scale = enumeration('linear', 'categorical', 'datetime')

class ChartDefaults(object):
    def apply(self, chart):
        """Apply this defaults to a chart."""

        if not isinstance(chart, Chart):
            raise ValueError("ChartsTheme should be only used on Chart objects \
            but it's being used on %s instead." % chart)

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

    filename = Either(Bool(False), String, help="""
    A name for the file to save this chart to.
    """)

    server = Either(Bool(False), String, help="""
    A name to use to save this chart to on server.
    """)

    notebook = Either(Bool(False), String, help="""
    Whether to display the plot inline in an IPython/Jupyter
    notebook.
    """)

    title_text_font_size = Override(default={ 'value' : '14pt' })

    responsive = Override(default=False)

    _defaults = defaults

    def __init__(self, *args, **kwargs):
        # pop tools as it is also a property that doesn't match the argument
        # supported types
        tools = kwargs.pop('tools', None)
        super(Chart, self).__init__(*args, **kwargs)
        defaults.apply(self)
        if tools is not None:
            self._tools = tools

        self._glyphs = []
        self._built = False

        self._builders = []
        self._renderer_map = []
        self._ranges = defaultdict(list)
        self._labels = defaultdict(list)
        self._scales = defaultdict(list)
        self._tooltips = []

        # Add to document and session if server output is asked
        _doc = None
        if _doc:
            self._doc = _doc
        else:
            self._doc = Document()

        # if self._options.server:
        #     _session = None
        #     if _session:
        #         self._session = _session
        #     else:
        #         self._session = Session()

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

    def show(self):
        """Main show function.

        It shows the plot in file, server and notebook outputs.
        """
        # Add to document and session
        if self.server:
            if self.server is True:
                self._servername = "untitled_chart"
            else:
                self._servername = self.server

            self._session.use_doc(self._servername)
            self._session.load_document(self._doc)

        if not self._doc._current_plot == self:
            self._doc._current_plot = self
            self._doc.add_root(self)

        if self.filename:
            if self.filename is True:
                filename = "untitled"
            else:
                filename = self.filename

            with open(filename, "w") as f:
                f.write(file_html(self._doc, INLINE, self.title))
            print("Wrote %s" % filename)
            view(filename)
        elif self.filename is False and \
                        self.server is False and \
                        self.notebook is False:
            print("You must provide a filename (filename='foo.html' or"
                  " .filename('foo.html')) to save your plot.")

        if self.server:
            self.session.store_document(self._doc)
            link = self._session.object_link(self._doc.context)
            view(link)

        if self.notebook:
            from bokeh.embed import notebook_div
            publish_display_data({'text/html': notebook_div(self)})
