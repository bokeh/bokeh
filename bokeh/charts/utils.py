""" This is the utils module that collects convenience functions and code that are
useful for charts ecosystem.
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
from __future__ import absolute_import, division, print_function

from collections import OrderedDict
import itertools
from math import cos, sin

from ..browserlib import view
from ..document import Document
from ..embed import file_html
from ..models import GlyphRenderer
from ..models.glyphs import (
    Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
    InvertedTriangle, Square, SquareCross, SquareX, Triangle, X)
from ..resources import INLINE
from ..session import Session
from ..util.notebook import publish_display_data

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

# TODO: (bev) this should go in a plotting utils one level up
_default_cycle_palette = [
    "#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"
]
def cycle_colors(chunk, palette=_default_cycle_palette):
    """ Build a color list just cycling through a given palette.

    Args:
        chuck (seq): the chunk of elements to generate the color list
        palette (seq[color]) : a palette of colors to cycle through

    Returns:
        colors

    """
    colors = []

    g = itertools.cycle(palette)
    for i in range(len(chunk)):
        colors.append(next(g))

    return colors

# TODO: (bev) this should go in a plotting utils one level up
def make_scatter(source, x, y, markertype, color, line_color=None,
                 size=10, fill_alpha=0.2, line_alpha=1.0):
    """Create a marker glyph and appends it to the renderers list.

    Args:
        source (obj): datasource object containing markers references.
        x (str or list[float]) : values or field names of line ``x`` coordinates
        y (str or list[float]) : values or field names of line ``y`` coordinates
        markertype (int or str): Marker type to use (e.g., 2, 'circle', etc.)
        color (str): color of the points
        size (int) : size of the scatter marker
        fill_alpha(float) : alpha value of the fill color
        line_alpha(float) : alpha value of the line color

    Return:
        scatter: Marker Glyph instance
    """
    if line_color is None:
        line_color = color

    _marker_types = OrderedDict(
        [
            ("circle", Circle),
            ("square", Square),
            ("triangle", Triangle),
            ("diamond", Diamond),
            ("inverted_triangle", InvertedTriangle),
            ("asterisk", Asterisk),
            ("cross", Cross),
            ("x", X),
            ("circle_cross", CircleCross),
            ("circle_x", CircleX),
            ("square_x", SquareX),
            ("square_cross", SquareCross),
            ("diamond_cross", DiamondCross),
        ]
    )

    g = itertools.cycle(_marker_types.keys())
    if isinstance(markertype, int):
        for i in range(markertype):
            shape = next(g)
    else:
        shape = markertype
    glyph = _marker_types[shape](
        x=x, y=y, size=size, fill_color=color, fill_alpha=fill_alpha,
        line_color=line_color, line_alpha=line_alpha
    )

    return GlyphRenderer(data_source=source, glyph=glyph)

def chunk(l, n):
    """Yield successive n-sized chunks from l.

    Args:
        l (list: the incomming list to be chunked
        n (int): lenght of you chucks
    """
    for i in range(0, len(l), n):
        yield l[i:i + n]

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
