"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the BoxPlot class which lets you build your BoxPlot plots just passing
the arguments to the Chart class and calling the proper functions.
It also add a new chained stacked method.
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

import numpy as np
import pandas as pd

from ._chartobject import ChartObject

from ..models import ColumnDataSource, FactorRange, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class BoxPlot(ChartObject):
    """This is the BoxPlot class and it is in charge of plotting
    scatter plots in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects, lines and markers)
    taking the references from the source.

    Examples:

        from collections import OrderedDict

        import numpy as np

        from bokeh.charts import BoxPlot
        from bokeh.sampledata.olympics2014 import data

        data = {d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

        countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)

        gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
        silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
        bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

        medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

        boxplot = BoxPlot(medals, marker="circle", outliers=True,
                          title="boxplot, dict_input", xlabel="medal type", ylabel="medal count",
                          width=800, height=600, notebook=True)
        boxplot.show()
    """
    # not showing x grid
    xgrid=False

    def __init__(self, values, marker="circle", outliers=True,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """ Initialize a new BoxPlot.

        Args:
            value (DataFrame or OrderedDict/dict): containing the data with names as a key
                and the data as a value.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., `circle`.
            outliers (bool, optional): Whether or not to plot outliers.
            title (str, optional): the title of your plot. Defaults to None.
            xlabel (str, optional): the x-axis label of your plot.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your plot.
                Defaults to None.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            yscale (str, optional): the y-axis type scale of your plot. It can be
                ``linear``, ``date`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your plot in pixels.
                Defaults to 800.
            height (int, optional): the height of you plot in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your plot.
                Defaults to True
            filename (str or bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your plot in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
                Defaults to False.
            notebook (bool, optional):if you want to output (or not) your plot into the
                IPython notebook.
                Defaults to False.

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        self.values = values
        self.__marker = marker
        self.__outliers = outliers
        self.xdr = None
        self.ydr = None
        self.data_segment = dict()
        self.attr_segment = []
        self.data_rect = dict()
        self.attr_rect = []
        self.data_scatter = dict()
        self.attr_scatter = []
        self.data_legend = dict()
        super(BoxPlot, self).__init__(title, xlabel, ylabel, legend,
                                      xscale, yscale, width, height,
                                      tools, filename, server, notebook)

    def marker(self, marker="circle"):
        "marker (str, int): the marker type of your plot outliers."
        self._marker = marker
        return self

    def outliers(self, outliers=True):
        "outliers (bool): to show (or not) the outliers in each group of your plot."
        self._outliers = outliers
        return self

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content by default.
        """
        super(BoxPlot, self).check_attr()

        if not hasattr(self, '_marker'):
            self._marker = self.__marker

        if not hasattr(self, '_outliers'):
            self._outliers = self.__outliers

    def get_data(self):
        """Take the BoxPlot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the quad, segments and markers glyphs inside the ``draw`` method.

        Args:
            cat (list): categories as a list of strings.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., ``circle``.
            outliers (bool, optional): Whether to plot outliers.
            values (dict or pd obj): the values to be plotted as bars.
        """
        self.marker = self._marker
        self.outliers = self._outliers

        if isinstance(self.values, pd.DataFrame):
            self.groups = self.values.columns
        else:
            self.groups = list(self.values.keys())

        # add group to the self.data_segment dict
        self.data_segment["groups"] = self.groups

        # add group and witdh to the self.data_rect dict
        self.data_rect["groups"] = self.groups
        self.data_rect["width"] = [0.8] * len(self.groups)

        # self.data_scatter does not need references to groups now,
        # they will be added later.

        # add group to the self.data_legend dict
        self.data_legend["groups"] = self.groups

        # all the list we are going to use to save calculated values
        q0_points = []
        q2_points = []
        iqr_centers = []
        iqr_lengths = []
        lower_points = []
        upper_points = []
        upper_center_boxes = []
        upper_height_boxes = []
        lower_center_boxes = []
        lower_height_boxes = []
        out_x, out_y, out_color = ([], [], [])

        for i, level in enumerate(self.groups):
            # Compute quantiles, center points, heights, IQR, etc.
            # quantiles
            q = np.percentile(self.values[level], [25, 50, 75])
            q0_points.append(q[0])
            q2_points.append(q[2])

            # IQR related stuff...
            iqr_centers.append((q[2] + q[0]) / 2)
            iqr = q[2] - q[0]
            iqr_lengths.append(iqr)
            lower = q[1] - 1.5 * iqr
            upper = q[1] + 1.5 * iqr
            lower_points.append(lower)
            upper_points.append(upper)

            # rect center points and heights
            upper_center_boxes.append((q[2] + q[1]) / 2)
            upper_height_boxes.append(q[2] - q[1])
            lower_center_boxes.append((q[1] + q[0]) / 2)
            lower_height_boxes.append(q[1] - q[0])

            # Store indices of outliers as list
            outliers = np.where((self.values[level] > upper) | (self.values[level] < lower))[0]
            out = self.values[level][outliers]
            for o in out:
                out_x.append(level)
                out_y.append(o)
                out_color.append(self.palette[i])

        # Store
        self.set_and_get(self.data_scatter, self.attr_scatter, "out_x", out_x)
        self.set_and_get(self.data_scatter, self.attr_scatter, "out_y", out_y)
        self.set_and_get(self.data_scatter, self.attr_scatter, "colors", out_color)

        self.set_and_get(self.data_segment, self.attr_segment, "q0", q0_points)
        self.set_and_get(self.data_segment, self.attr_segment, "lower", lower_points)
        self.set_and_get(self.data_segment, self.attr_segment, "q2", q2_points)
        self.set_and_get(self.data_segment, self.attr_segment, "upper", upper_points)

        self.set_and_get(self.data_rect, self.attr_rect, "iqr_centers", iqr_centers)
        self.set_and_get(self.data_rect, self.attr_rect, "iqr_lengths", iqr_lengths)
        self.set_and_get(self.data_rect, self.attr_rect, "upper_center_boxes", upper_center_boxes)
        self.set_and_get(self.data_rect, self.attr_rect, "upper_height_boxes", upper_height_boxes)
        self.set_and_get(self.data_rect, self.attr_rect, "lower_center_boxes", lower_center_boxes)
        self.set_and_get(self.data_rect, self.attr_rect, "lower_height_boxes", lower_height_boxes)
        self.set_and_get(self.data_rect, self.attr_rect, "colors", self.palette)

    def get_source(self):
        "Push the BoxPlot data into the ColumnDataSource and calculate the proper ranges."
        self.source_segment = ColumnDataSource(self.data_segment)
        self.source_scatter = ColumnDataSource(self.data_scatter)
        self.source_rect = ColumnDataSource(self.data_rect)
        self.source_legend = ColumnDataSource(self.data_legend)
        self.xdr = FactorRange(factors=self.source_segment.data["groups"])

        start_y = min(self.data_segment[self.attr_segment[1]])
        end_y = max(self.data_segment[self.attr_segment[3]])

        ## Expand min/max to encompass outliers
        if self.outliers:
            start_out_y = min(self.data_scatter[self.attr_scatter[1]])
            end_out_y = max(self.data_scatter[self.attr_scatter[1]])
            # it could be no outliers in some sides...
            start_y = min(start_y, start_out_y)
            end_y = max(end_y, end_out_y)
        self.ydr = Range1d(start=start_y - 0.1 * (end_y - start_y),
                           end=end_y + 0.1 * (end_y - start_y))

    def draw(self):
        """Use the several glyphs to display the Boxplot.

        It uses the selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        self.chart.make_segment(self.source_segment, "groups", self.attr_segment[1],
                                "groups", self.attr_segment[0], "black", 2)
        self.chart.make_segment(self.source_segment, "groups", self.attr_segment[2],
                                "groups", self.attr_segment[3], "black", 2)

        self.chart.make_rect(self.source_rect, "groups", self.attr_rect[0],
                             "width", self.attr_rect[1], None, "black", 2)
        self.chart.make_rect(self.source_rect, "groups", self.attr_rect[2],
                             "width", self.attr_rect[3], self.attr_rect[6], "black", None)
        self.chart.make_rect(self.source_rect, "groups", self.attr_rect[4],
                             "width", self.attr_rect[5], self.attr_rect[6], "black", None)

        if self.outliers:
            self.chart.make_scatter(self.source_scatter, self.attr_scatter[0],
                                    self.attr_scatter[1], self.marker, self.attr_scatter[2])

        # We need to build the legend here using dummy glyphs
        indexes = []
        real_glyphs_count = len(self.chart.glyphs)
        for i, level in enumerate(self.groups):
            self.chart.make_rect(self.source_legend, "groups", None, None, None,
                                 self.palette[i], "black", None)

            # need to manually select the proper glyphs to be rendered as legends
            indexes.append(real_glyphs_count+i)

        # reset glyphs tho only contain the dummy
        self.chart.glyphs = [self.chart.glyphs[i] for i in indexes]

    # Some helper methods
    def set_and_get(self, data, attr, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            data (dict): where to store the new attribute content
            attr (list): where to store the new attribute names
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        self._set_and_get(data, "", attr, val, content)
