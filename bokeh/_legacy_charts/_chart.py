"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the main LegacyChart class which is able to build several plots using the low
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

from warnings import warn

import numpy as np

from ._chart_options import ChartOptions
from ..browserlib import view
from ..document import Document
from ..embed import file_html
from ..models import (
    CategoricalAxis, DatetimeAxis, Grid, Legend, LinearAxis, Plot)
from ..plotting import DEFAULT_TOOLS
from ..plotting_helpers import _process_tools_arg
from ..resources import INLINE
from ..session import Session
from ..util.notebook import publish_display_data
from ..util.serialization import make_id

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def _make_method(prop_name):
    def method(self, value):
        setattr(self._options, prop_name, value)
        return self
    method.__doc__ = """ Chained method for %s option.
    """ % prop_name
    return method

def _chained_options(opts_type):
    def wrapper(cls):
        orig_init = cls.__init__

        cls_props = set(cls.properties())

        def __init__(self, *args, **kwargs):
            self._options = opts_type(**kwargs)
            orig_init(self)

        cls.__init__ = __init__

        for prop_name in opts_type.properties():
            if prop_name not in cls_props:
                setattr(cls, prop_name, _make_method(prop_name))

        return cls
    return wrapper

@_chained_options(ChartOptions)
class LegacyChart(Plot):
    """ The main Chart class, the core of the ``Bokeh.charts`` interface.

    """

    __view_model__ = "Plot"
    __subtype__ = "LegacyChart"

    def __init__(self):
        """

        """
        super(LegacyChart, self).__init__(
            title=self._options.title,
            plot_height=self._options.height,
            plot_width=self._options.width,
            responsive=self._options.responsive,
            id=self._options.id or make_id()
        )

        warn("Instantiating a Legacy Chart from bokeh._legacy_charts")

        self._glyphs = []
        self._built = False

        self._builders = []
        self._renderer_map = []

        # Add to document and session if server output is asked
        _doc = None
        if _doc:
            self._doc = _doc
        else:
            self._doc = Document()

        if self._options.server:
            _session = None
            if _session:
                self._session = _session
            else:
                self._session = Session()

        # create chart axis, grids and tools
        self.start_plot()

    def add_renderers(self, builder, renderers):
        self.renderers += renderers
        self._renderer_map.extend({ r._id : builder for r in renderers })

    def add_builder(self, builder):
        self._builders.append(builder)
        builder.create(self)

        # Add tools if supposed to
        if self._options.tools:
            # reset tools so a categorical builder can add only the
            # supported tools
            self.tools = []
            self.create_tools(self._options.tools)

    def create_axes(self):
        self._xaxis = self.make_axis("below", self._options.xscale, self._options.xlabel)
        self._yaxis = self.make_axis("left", self._options.yscale, self._options.ylabel)

    def create_grids(self, xgrid=True, ygrid=True):
        if xgrid:
            self.make_grid(0, self._xaxis.ticker)
        if ygrid:
            self.make_grid(1, self._yaxis.ticker)

    def create_tools(self, tools):
        # if no tools customization let's create the default tools
        if isinstance(tools, bool) and tools:
            tools = DEFAULT_TOOLS
        elif isinstance(tools, bool):
            # in case tools == False just exit
            return

        tool_objs = _process_tools_arg(self, tools)
        self.add_tools(*tool_objs)

    def start_plot(self):
        """Add the axis, grids and tools
        """
        self.create_axes()
        self.create_grids(self._options.xgrid, self._options.ygrid)

        # Add tools if supposed to
        if self._options.tools:
            self.create_tools(self._options.tools)

    def add_legend(self, legends):
        """Add the legend to your plot, and the plot to a new Document.

        It also add the Document to a new Session in the case of server output.

        Args:
            legends(List(Tuple(String, List(GlyphRenderer)): A list of
                tuples that maps text labels to the legend to corresponding
                renderers that should draw sample representations for those
                labels.
        """
        orientation = None
        if self._options.legend is True:
            orientation = "top_left"
        else:
            orientation = self._options.legend

        if orientation:
            legend = Legend(orientation=orientation, legends=legends)
            self.add_layout(legend)

    def make_axis(self, location, scale, label):
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

        if scale == "linear" or scale == "auto":
            axis = LinearAxis(axis_label=label)
        elif scale == "datetime":
            axis = DatetimeAxis(axis_label=label)
        elif scale == "categorical":
            axis = CategoricalAxis(
                major_label_orientation=np.pi / 4, axis_label=label
            )

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
        if self._options.server:
            if self._options.server is True:
                self._servername = "untitled_chart"
            else:
                self._servername = self._options.server

            self._session.use_doc(self._servername)
            self._session.load_document(self._doc)

        if not self._doc._current_plot == self:
            self._doc._current_plot = self
            self._doc.add(self)

        if self._options.filename:
            if self._options.filename is True:
                filename = "untitled"
            else:
                filename = self._options.filename

            with open(filename, "w") as f:
                f.write(file_html(self._doc, INLINE, self.title))
            print("Wrote %s" % filename)
            view(filename)
        elif self._options.filename is False and \
                        self._options.server is False and \
                        self._options.notebook is False:
            print("You must provide a filename (filename='foo.html' or"
                  " .filename('foo.html')) to save your plot.")

        if self._options.server:
            self.session.store_document(self._doc)
            link = self._session.object_link(self._doc.context)
            view(link)

        if self._options.notebook:
            from bokeh.embed import notebook_div
            publish_display_data({'text/html': notebook_div(self)})
