"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the GMap class which lets you build your Google Map charts just
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

from ._chartobject import Builder
from ..models import (Range1d, GMapPlot, GMapOptions)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class GMap(Builder):
    """This is the GMap class and it is in charge of plotting
    GMap charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.

    """
    def __init__(self, lat, lng, zoom=12, map_type='hybrid',
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 xgrid=False, ygrid=False):
        """
        Args:
            lat (float): latitude
            lng (float): longitude
            zoom (int, optional): zoom level. Default: 12
            map_type (str, optional): type of map visualization.
                Valid values: "satellite", "roadmap", "terrain",
                "hybrid".
                Default: "hybrid"
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
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.

        """
        self.lat = lat
        self.lng = lng
        self.zoom = zoom
        self.map_type = map_type

        # self.source = None
        self.xdr = None
        self.ydr = None

        # list to save all the groups available in the incoming input
        self.groups = []

        super(GMap, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet=False, xgrid=xgrid,
            ygrid=ygrid
        )

    def get_source(self):
        """ calculate the proper ranges.
        """
        self.xdr = Range1d()
        self.ydr = Range1d()

    def draw(self):
        """ Set GMapPlot as plot instance of the underlaying chart object
        """
        options = GMapOptions(
            lat=self.lat, lng=self.lng, zoom=self.zoom, map_type=self.map_type
        )
        gmap = GMapPlot(
            x_range=self.xdr,
            y_range=self.ydr,
            map_options=options,
            title = self.chart.title,
            plot_width=self.chart.plot_width,
            plot_height=self.chart.plot_height
        )
        # TODO: This is an ugly patch and should be replaced adding some
        #       injection to the Chart class or with some other pattern
        #       when/if charts inherit from Plot
        gmap.tools = self.chart.plot.tools
        self.chart._plots = [gmap]
        for tool in gmap.tools:
            tool.plot = gmap

    def prepare_values(self):
        """ Overwrites the original ChartObject values preparation as
         GMap have no values to prepare
        """
        pass