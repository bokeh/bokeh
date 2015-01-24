"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Donut class which lets you build your Donut charts just passing
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
from __future__ import division, print_function
from math import pi
from collections import OrderedDict

from ._chartobject import ChartObject
from ..models import ColumnDataSource, Range1d
from .utils import polar_to_cartesian
#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class Donut(ChartObject):
    """This is the Donut class and it is in charge of plotting
    Donut chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the donut slices and angles.
    And finally add the needed glyphs (Wedges and AnnularWedges) taking
    the references from the source.

    Examples:

        xyvalues = OrderedDict()
        # TODO: Fix bug for donut breaking when inputs that are not float
        xyvalues['python'] = [2., 5., 3.]
        xyvalues['pypy'] = [4., 1., 4.]
        xyvalues['jython'] = [6., 4., 3.]
        cat = ['Devs', 'Dev Ops', 'Scientists']
        donut = Donut(xyvalues, cat, filename="donut.html")
        donut.title("Medals Donut").xlabel("Cat").ylabel("Lang")
        donut.legend(True).width(800).height(800).show()
    """

    def __init__(self, values, cat=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 xgrid=False, ygrid=False):
        """
        Args:
            values (obj): value (iterable obj): Data adapter supported input type
            cat (list or bool, optional): list of string representing the categories.
                Defaults to None.
            title (str, optional): the title of your chart. Defaults to None.
            xlabel (str, optional): the x-axis label of your chart.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your chart.
                Defaults to None.
            legend (str, optional): the legend of your chart. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your chart. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``datetime``.
            yscale (str, optional): the y-axis type scale of your chart. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your chart in pixels.
                Defaults to 800.
            height (int, optional): the height of you chart in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your chart.
                Defaults to True
            filename (str or bool, optional): the name of the file where your chart.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your chart in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
                Defaults to False.
            notebook (bool, optional): whether to output to IPython notebook
                (default: False)
            xgrid (bool, optional): whether to display x grid lines
                (default: False)
            ygrid (bool, optional): whether to display y grid lines
                (default: False)

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
                Needed for _set_and_get method.
        """
        self.cat = cat
        self.values = values
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        # Holds sub categories angles for every category
        self._cat_angles = OrderedDict()

        super(Donut, self).__init__(
            title, xlabel, ylabel, legend,
            xscale, yscale, width, height,
            tools, filename, server, notebook, xgrid=xgrid, ygrid=ygrid
        )

    def get_data(self):
        """Take the chart data from self.values.

        It calculates the chart properties accordingly (start/end angles
        for categories and sub-categories).
        Then build a dict containing references to all the calculated
        points to be used by the Wedge glyph inside the ``draw`` method.

        """
        # Create OD with list of values per catogory
        dt = OrderedDict()
        total = 0
        for k, v in self.values.items():
            for i, cat in enumerate(self.cat):
                cat_vals = dt.get(cat, [])
                val = v[i]
                cat_vals.append(val)
                total += val
                dt[cat] = cat_vals

        # create callable to convert to radians
        radians = lambda x: 2*pi*(x/total)

        # compute categories and subcategories angles
        end_angles = []
        last = 0
        for cat, details in dt.items():
            aggr_val = sum(details)
            rad = radians(aggr_val)
            val = last + rad
            end_angles.append(val)
            last = val

            details_angles = []
            last_det = 0
            for det in details:
                rad = radians(det)
                last_det += rad
                details_angles.append(last_det)

            self._cat_angles[cat] = details_angles

        self.groups = self.cat
        self.total_units = total
        start_angles = [0] + end_angles[:-1]
        colors = self._set_colors(self.cat)
        self.set_and_get("", "colors", colors)
        self.set_and_get("", "end", end_angles)
        self.set_and_get("", "start", start_angles)

    def get_source(self):
        """Push the Donut data into the ColumnDataSource and calculate
         the proper ranges.

        """
        self.source = ColumnDataSource(self.data)
        self.xdr = Range1d(start=-2, end=2)
        self.ydr = Range1d(start=-2, end=2)

    def draw_central_wedge(self):
        """Draw the central part of the donut wedge from donut.source and
         its calculated start and end angles.

        """
        self.chart.make_wedge(
            self.source, x=0, y=0, radius=1, line_color="white",
            line_width=2, start_angle="start", end_angle="end",
            fill_color="colors"
        )

    def draw_central_descriptions(self):
        """Draw the descriptions to be placed on the central part of the
        donut wedge
        """
        text = ["%s" % cat for cat in self.cat]
        x, y = polar_to_cartesian(0.7, self.data["start"], self.data["end"])
        text_source = ColumnDataSource(dict(text=text, x=x, y=y))
        self.chart.make_text(
            text_source,
            x="x", y="y", text="text", text_align="center",
            text_baseline="middle"
        )

    def draw_external_ring(self, colors=None):
        """Draw the external part of the donut wedge from donut.source
         and its related descriptions
        """
        if colors is None:
            colors = self._set_colors(self.cat)

        for i, (cat, start_angle, end_angle) in enumerate(zip(
                self.cat, self.data['start'], self.data['end'])):
            # compute sub-categories angles being careful to not exceed category
            # end angle (due to approximations)
            angles = [min(x + start_angle, end_angle) for x in self._cat_angles[cat]]
            end = list(angles) + [end_angle]
            start = [start_angle] + end[:-1]
            base_color = colors[i]
            text = [rowlabel for rowlabel in self.values.keys()]
            fill = [base_color for i in range(len(text) + 1)]
            # TODO: Would be nice to have the subcategories lighten when it's
            #       supported on HexColors, so the follow would work
            # fill = [ base_color.lighten(i*0.05) for i in range(len(details) + 1) ]
            x, y = polar_to_cartesian(1.25, start, end)
            source = ColumnDataSource(dict(start=start, end=end, fill=fill))

            self.chart.make_annular(
                source, x=0., y=0., inner_radius=1., outer_radius=1.5,
                start_angle="start", end_angle="end", line_color="white",
                line_width=2, fill_color="fill"
            )
            text_angle = [(start[i]+end[i])/2 for i in range(len(start))]
            text_angle = [angle + pi if pi/2 < angle < 3*pi/2 else angle
                          for angle in text_angle]

            data = dict(text=text, x=x, y=y, angle=text_angle)
            text_source = ColumnDataSource(data)
            self.chart.make_text(
                text_source, x="x", y="y", text="text", angle="angle",
                text_align="center", text_baseline="middle"
            )

    def draw(self):
        """Use the AnnularWedge and Wedge glyphs to display the wedges.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        # build the central round area of the donut
        self.draw_central_wedge()
        # write central descriptions
        self.draw_central_descriptions()
        # build external donut ring
        self.draw_external_ring()
        self.reset_legend()

    def _setup_show(self):
        """Prepare data before calling drawing methods.

        Ensure that x and y scales are linear.
        """
        self.yscale('linear')
        self.xscale('linear')
        self.check_attr()
