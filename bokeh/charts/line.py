"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Line class which lets you build your Line charts just
passing the arguments to the Chart class and calling the proper functions.
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
import numpy as np
from ._chartobject import ChartObject
from ..models import ColumnDataSource, Range1d, DataRange1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Line class which lets you build your Line charts just
passing the arguments to the Chart class and calling the proper functions.
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
import numpy as np
from ._charts import Chart
from ..models import ColumnDataSource, Range1d, DataRange1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Line(Chart):
    """This is the Line class and it is in charge of plotting
    Line charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.

    """
    __subtype__ = "LineChart"
    __view_model__ = "Plot"

    # whether to show the xgrid
    _xgrid = True
    # whether to show the ygrid
    _ygrid = True
    def __init__(self, values, index=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False, xgrid=True, ygrid=True):
        """
        Args:
            values (iterable): iterable 2d representing the data series
                values matrix.
            index (str|1d iterable, optional): can be used to specify a
                common custom index for all data series as follows:
                    - As a 1d iterable of any sort that will be used as
                        series common index
                    - As a string that corresponds to the key of the
                        mapping to be used as index (and not as data
                        series) if area.values is a mapping (like a dict,
                        an OrderedDict or a pandas DataFrame)
            title (str, optional): the title of your chart. Defaults
                to None.
            xlabel (str, optional): the x-axis label of your chart.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your chart.
                Defaults to None.
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.
            xscale (str, optional): the x-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``datetime``.
            yscale (str, optional): the y-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your chart in pixels.
                Defaults to 800.
            height (int, optional): the height of you chart in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in
                your chart. Defaults to True
            filename (str or bool, optional): the name of the file where
                your chart. will be written. If you pass True to this
                argument, it will use ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your chart in
                the server. If you pass True to this argument, it will
                use ``untitled`` as the name in the server.
                Defaults to False.
            notebook (bool, optional): whether to output to IPython notebook
                (default: False)
            facet (bool, optional): generate multiple areas on multiple
                separate charts for each series if True. Defaults to
                False
            xgrid (bool, optional): whether to display x grid lines
                (default: True)
            ygrid (bool, optional): whether to display y grid lines
                (default: True)

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
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
        self._values = values
        self._source = None
        self._xdr = None
        self._ydr = None

        # list to save all the groups available in the incomming input
        self._groups = []
        self._data = dict()
        self._attr = []
        self._index = index

        super(Line, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet
        )

    def get_data(self):
        """Calculate the chart properties accordingly from line.values.
        Then build a dict containing references to all the points to be
        used by the line glyph inside the ``draw`` method.

        """
        self._data = dict()

        # list to save all the attributes we are going to create
        self._attr = []
        xs = self._values_index
        self.set_and_get("x", "", np.array(xs))
        for col in self._values.keys():
            if isinstance(self._index, string_types) and col == self._index:
                continue

            # save every new group we find
            self._groups.append(col)
            values = [self._values[col][x] for x in xs]
            self.set_and_get("y_", col, values)

    def get_source(self):
        """
        Push the Line data into the ColumnDataSource and calculate the
        proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = self._xdr = DataRange1d(sources=[self._source.columns("x")])

        y_names = self._attr[1:]

        endy = max(max(self._data[i]) for i in y_names)
        starty = min(min(self._data[i]) for i in y_names)
        self.y_range = self._ydr = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def draw(self):
        """Use the line glyphs to connect the xy points in the Line.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = self._set_colors(self._attr)

        for i, duplet in enumerate(self._attr[1:], start=1):
            self.make_line(self._source, 'x', duplet, colors[i - 1])

            if i < len(self._attr[1:]):
                self.create_plot_if_facet()
