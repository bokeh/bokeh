""" This is the utils module that collects convenience functions and code that are
useful for charts ecosystem.
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
from math import cos, sin
from ..document import Document
from ..session import Session
from ..embed import file_html
from ..resources import INLINE
from ..browserlib import view
from ..utils import publish_display_data

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def polar_to_cartesian(r, start_angles, end_angles):
    """Translate polar coordinates to cartesian.

    Args:
    r (float): radial coordinate
    start_angles (list(float)): list of start angles
    end_angles (list(float)): list of end_angles angles

    Returns:
        x, y points
    """
    cartesian = lambda r, alpha: (r*cos(alpha), r*sin(alpha))
    points = []

    for start, end in zip(start_angles, end_angles):
        points.append(cartesian(r, (end + start)/2))

    return zip(*points)

# TODO: Experimental implementation. This should really be a shared
#       pattern between plotting/charts and other bokeh interfaces.
#       This will probably be part of the future charts re-design
#       to make them inherit from plot (or at least be closer to).
#       In this was both charts and plotting could share figure,
#       show, save, push methods as well as VBox, etc...
class Figure(object):
    def __init__(self, *charts, **kwargs):
        self.filename = kwargs.pop('filename', None)
        self.server = kwargs.pop('server', None)
        self.notebook = kwargs.pop('notebook', None)
        self.title = kwargs.pop('title', '')
        self.children = kwargs.pop('children', None)
        self.charts = charts
        self.doc = Document()
        self.doc.hold(True)
        self._plots = []

        if self.server:
            self.session = Session()
            self.session.use_doc(self.server)
            self.session.load_document(self.doc)

        if self.children:
            from bokeh.models import VBox
            self.doc.add(VBox(children=self.children))

        self.plot = None
        xdr, ydr = None, None
        for i, chart in enumerate(self.charts):
            chart.doc = self.doc
            if self.server:
                chart.session = self.session

            # Force the chart to create the underlying plot
            chart._setup_show()
            chart._prepare_show()
            chart._show_teardown()

            if not self.title:
                self.title = chart.chart.title

            self._plots += chart.chart._plots

        # reset the pot title with the one set for the Figure
        self.doc._current_plot.title = self.title

    def show(self):
        """Main show function.

        It shows the Figure in file, server and notebook outputs.
        """
        show(self, self.title, self.filename, self.server, self.notebook)


def show(obj, title='test', filename=False, server=False, notebook=False, **kws):
    """ 'shows' a plot object, by auto-raising the window or tab
    displaying the current plot (for file/server output modes) or displaying
    it in an output cell (IPython notebook).

    Args:
        obj (Widget/Plot object, optional): it accepts a plot object and just shows it.

    """
    if filename:
        if filename is True:
            filename = "untitled"
        else:
            filename = filename

        with open(filename, "w") as f:
            f.write(file_html(obj.doc, INLINE, title))
        print("Wrote %s" % filename)
        view(filename)

    elif filename is False and server is False and notebook is False:
        print("You have to provide a filename (filename='foo.html' or"
              " .filename('foo.html')) to save your plot.")

    if server:
        obj.session.store_document(obj.doc)
        link = obj.session.object_link(obj.doc.context)
        view(link)

    if notebook:
        from bokeh.embed import notebook_div
        for plot in obj._plots:
            publish_display_data({'text/html': notebook_div(plot)})