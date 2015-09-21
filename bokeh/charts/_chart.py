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

from six import iteritems
import numpy as np
from collections import defaultdict

from ._chart_options import ChartOptions
from . import defaults
from ..browserlib import view
from ..document import Document
from ..embed import file_html
from ..models import (
    CategoricalAxis, DatetimeAxis, Grid, Legend, LinearAxis, Plot)
from ..models.ranges import FactorRange
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
class Chart(Plot):
    """ The main Chart class, the core of the ``Bokeh.charts`` interface.

    """

    __view_model__ = "Plot"
    __subtype__ = "Chart"

    def __init__(self):

        # Initializes then gets default properties
        super(Chart, self).__init__(id=self._options.id or make_id())
        default_props = ChartOptions().properties_with_values()
        option_props = ChartOptions.properties_with_values(defaults)
        option_props.pop('id')

        # sets overridden defaults
        # ToDo: allow Chart/Plot properties as well as ChartOptions
        for option, value in iteritems(option_props):
            if value != default_props[option]:
                setattr(self._options, option, value)

        self.title = self._options.title
        self.plot_height = self._options.height
        self.plot_width = self._options.width
        self.responsive = self._options.responsive
        self.title_text_font_size = self._options.title_text_font_size
        self.title_text_font_style = 'bold'

        self._glyphs = []
        self._built = False

        self._builders = []
        self._renderer_map = []
        self._ranges = defaultdict(list)
        self._labels = defaultdict(list)
        self._scales = defaultdict(list)

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

        self.create_tools(self._options.tools)

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

    def _get_labels(self, dim):
        if not getattr(self._options, dim + 'label') and len(self._labels[dim]) > 0:
            return self._labels[dim][0]
        else:
            return getattr(self._options, dim + 'label')

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
        if len(self.tools) == 0:
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
