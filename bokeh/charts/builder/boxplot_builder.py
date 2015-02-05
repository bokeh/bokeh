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
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import numpy as np
import pandas as pd

from ..utils import make_scatter
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
from ...models.glyphs import Rect, Segment

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def BoxPlot(values, marker="circle", outliers=True, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, **kw):
    return create_and_build(
        BoxPlotBuilder, values, marker=marker, outliers=outliers,
        xscale=xscale, yscale=yscale, xgrid=xgrid, ygrid=ygrid, **kw
    )

class BoxPlotBuilder(Builder):
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
    def __init__(self, values, marker="circle", outliers=True, legend=False,
                 palette=None, **kws):
        """ Initialize a new BoxPlot.

        Args:
            values (DataFrame or OrderedDict/dict): containing the data with names as a key
                and the data as a value.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., `circle`.
            outliers (bool, optional): Whether or not to plot outliers.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            palette(list, optional): a list containing the colormap as
                hex values.

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            x_range (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            y_range (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        self._marker = marker
        self._outliers = outliers
        self._data_segment = dict()
        self._attr_segment = []
        self._data_rect = dict()
        self._attr_rect = []
        self._data_scatter = dict()
        self._attr_scatter = []
        self._data_legend = dict()
        super(BoxPlotBuilder, self).__init__(values, legend=legend, palette=palette)

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
        if isinstance(self.values, pd.DataFrame):
            self.groups = self.values.columns
        else:
            self.groups = list(self.values.keys())

        # add group to the self.data_segment dict
        self._data_segment["groups"] = self.groups

        # add group and witdh to the self.data_rect dict
        self._data_rect["groups"] = self.groups
        self._data_rect["width"] = [0.8] * len(self.groups)

        # self.data_scatter does not need references to groups now,
        # they will be added later.
        # add group to the self.data_legend dict
        self._data_legend["groups"] = self.groups

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
            outliers = np.where(
                (self.values[level] > upper) | (self.values[level] < lower)
            )[0]
            out = self.values[level][outliers]
            for o in out:
                out_x.append(level)
                out_y.append(o)
                out_color.append(self._palette[i])

        # Store
        self.set_and_get(self._data_scatter, self._attr_scatter, "out_x", out_x)
        self.set_and_get(self._data_scatter, self._attr_scatter, "out_y", out_y)
        self.set_and_get(self._data_scatter, self._attr_scatter, "colors", out_color)

        self.set_and_get(self._data_segment, self._attr_segment, "q0", q0_points)
        self.set_and_get(self._data_segment, self._attr_segment, "lower", lower_points)
        self.set_and_get(self._data_segment, self._attr_segment, "q2", q2_points)
        self.set_and_get(self._data_segment, self._attr_segment, "upper", upper_points)

        self.set_and_get(self._data_rect, self._attr_rect, "iqr_centers", iqr_centers)
        self.set_and_get(self._data_rect, self._attr_rect, "iqr_lengths", iqr_lengths)
        self.set_and_get(self._data_rect, self._attr_rect, "upper_center_boxes", upper_center_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "upper_height_boxes", upper_height_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "lower_center_boxes", lower_center_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "lower_height_boxes", lower_height_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "colors", self._palette)

    def get_source(self):
        "Push the BoxPlot data into the ColumnDataSource and calculate the proper ranges."
        self._source_segment = ColumnDataSource(self._data_segment)
        self._source_scatter = ColumnDataSource(self._data_scatter)
        self._source_rect = ColumnDataSource(self._data_rect)
        self._source_legend = ColumnDataSource(self._data_legend)
        self.x_range = FactorRange(factors=self._source_segment.data["groups"])

        start_y = min(self._data_segment[self._attr_segment[1]])
        end_y = max(self._data_segment[self._attr_segment[3]])

        ## Expand min/max to encompass outliers
        if self._outliers:
            start_out_y = min(self._data_scatter[self._attr_scatter[1]])
            end_out_y = max(self._data_scatter[self._attr_scatter[1]])
            # it could be no outliers in some sides...
            start_y = min(start_y, start_out_y)
            end_y = max(end_y, end_out_y)
        self.y_range = Range1d(start=start_y - 0.1 * (end_y - start_y),
                           end=end_y + 0.1 * (end_y - start_y))

    def draw(self):
        """Use the several glyphs to display the Boxplot.

        It uses the selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        ats = self._attr_segment

        glyph = Segment(
            x0="groups", y0=ats[1], x1="groups", y1=ats[0],
            line_color="black", line_width=2
        )
        yield GlyphRenderer(data_source=self._source_segment, glyph=glyph)

        glyph = Segment(
            x0="groups", y0=ats[2], x1="groups", y1=ats[3],
            line_color="black", line_width=2
        )
        yield GlyphRenderer(data_source=self._source_segment, glyph=glyph)

        atr = self._attr_rect

        glyph = Rect(
            x="groups", y=atr[0], width="width", height=atr[1],
            line_color="black", line_width=2, fill_color=None,
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        glyph = Rect(
            x="groups", y=atr[2], width="width", height=atr[3],
            line_color="black", fill_color=atr[6],
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        glyph = Rect(
            x="groups", y=atr[4], width="width", height=atr[5],
            line_color="black", fill_color=atr[6],
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        if self._outliers:
            yield make_scatter(self._source_scatter, self._attr_scatter[0],
                              self._attr_scatter[1], self._marker,
                              self._attr_scatter[2])

        # We need to build the legend here using dummy glyphs
        for i, level in enumerate(self.groups):
            # TODO: (bev) what is this None business?
            glyph = Rect(
                x="groups", y=None,
                width=None, height=None,
                line_color="black", fill_color=self._palette[i])
            renderer = GlyphRenderer(data_source=self._source_legend, glyph=glyph)

            # need to manually select the proper glyphs to be rendered as legends
            self._legends.append((self.groups[i], [renderer]))

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
