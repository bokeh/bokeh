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

import itertools
import json
from collections import OrderedDict
from copy import copy
from math import cos, sin

import pandas as pd
from pandas.io.json import json_normalize
from six import iteritems

from ..browserlib import view
from ..document import Document
from ..embed import file_html
from ..models.glyphs import (
    Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
    InvertedTriangle, Square, SquareCross, SquareX, Triangle, X)
from ..resources import INLINE
from ..session import Session
from ..util.notebook import publish_display_data
from ..plotting_helpers import DEFAULT_PALETTE

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


DEFAULT_COLUMN_NAMES = 'abcdefghijklmnopqrstuvwxyz'


# map between distinct set of marker names and marker classes
marker_types = OrderedDict(
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


def take(n, iterable):
    """Return first n items of the iterable as a list."""
    return itertools.islice(iterable, n)


def cycle_colors(chunk, palette=DEFAULT_PALETTE):
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


# ToDo: Reconsider whether to utilize thing, vice Chart
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
        obj (Component object, optional): it accepts a plot object and just shows it.

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


def ordered_set(iterable):
    """Creates an ordered list from strings, tuples or other hashable items."""

    mmap = {}
    ord_set = []

    for item in iterable:
        # Save unique items in input order
        if item not in mmap:
            mmap[item] = 1
            ord_set.append(item)
    return ord_set


def collect_attribute_columns(**specs):
    """Collect list of unique and ordered columns across attribute specifications."""
    selected_specs = {spec_name: spec for spec_name, spec in iteritems(specs) if spec.columns}
    return ordered_set(list(itertools.chain.from_iterable([spec.columns for spec in selected_specs.values()])))


def df_from_json(data, **kwargs):
    """Attempt to produce row oriented data from hierarchical json/dict-like data."""

    if isinstance(data, str):
        with open(data) as data_file:
            data = json.load(data_file)

    if isinstance(data, list):
        return json_normalize(data, kwargs)
    elif isinstance(data, dict):
        for k, v in iteritems(data):
            if isinstance(v, list):
                return json_normalize(v)


def get_index(data):
    """A generic function to return the index from values.

    Should be used to abstract away from specific types of data.
    """
    return pd.Series(data.index.values)


def get_unity(data, value=1):
    """Returns a column of ones with the same length as input data.

    Useful for charts that need this special data type when no input is provided
    for one of the dimensions.
    """
    data_copy = data.copy()
    data_copy['_charts_ones'] = value
    return data_copy['_charts_ones']


special_columns = {'index': get_index,
                   'unity': get_unity}


def title_from_columns(cols):
    """Creates standard string representation of columns.

    If cols is None, then None is returned.
    """
    if cols is not None:
        cols_title = copy(cols)
        if not isinstance(cols_title, list):
            cols_title = [cols_title]
        return str(', '.join(cols_title).title()).title()
    else:
        return None


def gen_column_names(n):
    """Produces list of unique column names of length n."""
    col_names = list(DEFAULT_COLUMN_NAMES)

    # a-z
    if n < len(col_names):
        return list(take(n, col_names))
    # a-z and aa-zz (500+ columns)
    else:
        n_left = n - len(col_names)
        labels = [''.join(item) for item in
                  take(n_left, itertools.product(DEFAULT_COLUMN_NAMES,
                                                 DEFAULT_COLUMN_NAMES))]
        col_names.extend(labels)
        return col_names
