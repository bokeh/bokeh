"Helpers function for mpl module."
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

import numpy as np

from itertools import cycle, islice

from ...models import GlyphRenderer

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def convert_color(mplcolor):
    "Converts mpl color formats to Bokeh color formats."
    charmap = dict(b="blue", g="green", r="red", c="cyan", m="magenta",
                   y="yellow", k="black", w="white")
    if mplcolor in charmap:
        return charmap[mplcolor]

    try:
        colorfloat = float(mplcolor)
        if 0 <= colorfloat <= 1.0:
            # This is a grayscale value
            return tuple([int(255 * colorfloat)] * 3)
    except:
        pass

    if isinstance(mplcolor, tuple):
        # These will be floats in the range 0..1
        return int(255 * mplcolor[0]), int(255 * mplcolor[1]), int(255 * mplcolor[2])

    return mplcolor


def convert_dashes(dash):
    """ Converts a Matplotlib dash specification

    bokeh.core.properties.DashPattern supports the matplotlib named dash styles,
    but not the little shorthand characters.  This function takes care of
    mapping those.
    """
    mpl_dash_map = {
        "-": "solid",
        "--": "dashed",
        ":": "dotted",
        "-.": "dashdot",
    }
    # If the value doesn't exist in the map, then just return the value back.
    return mpl_dash_map.get(dash, dash)


def get_props_cycled(col, prop, fx=lambda x: x):
    """ We need to cycle the `get.property` list (where property can be colors,
    line_width, etc) as matplotlib does. We use itertools tools for do this
    cycling ans slice manipulation.

    Parameters:

    col: matplotlib collection object
    prop: property we want to get from matplotlib collection
    fx: function (optional) to transform the elements from list obtained
        after the property call. Defaults to identity function.
    """
    n = len(col.get_paths())
    t_prop = [fx(x) for x in prop]
    sliced = islice(cycle(t_prop), None, n)
    return list(sliced)


def is_ax_end(r):
    "Check if the 'name' (if it exists) in the Glyph's datasource is 'ax_end'"
    if isinstance(r, GlyphRenderer):
        try:
            if r.data_source.data["name"] == "ax_end":
                return True
        except KeyError:
            return False
    else:
        return False


def xkcd_line(x, y, xlim=None, ylim=None, mag=1.0, f1=30, f2=0.001, f3=5):
    """
    Mimic a hand-drawn line from (x, y) data
    Source: http://jakevdp.github.io/blog/2012/10/07/xkcd-style-plots-in-matplotlib/

    Parameters
    ----------
    x, y : array_like
        arrays to be modified
    xlim, ylim : data range
        the assumed plot range for the modification.  If not specified,
        they will be guessed from the  data
    mag : float
        magnitude of distortions
    f1, f2, f3 : int, float, int
        filtering parameters.  f1 gives the size of the window, f2 gives
        the high-frequency cutoff, f3 gives the size of the filter

    Returns
    -------
    x, y : ndarrays
        The modified lines
    """
    try:
        from scipy import interpolate, signal
    except ImportError:
        print("\nThe SciPy package is required to use the xkcd_line function.\n")
        raise

    x = np.asarray(x)
    y = np.asarray(y)

    # get limits for rescaling
    if xlim is None:
        xlim = (x.min(), x.max())
    if ylim is None:
        ylim = (y.min(), y.max())

    if xlim[1] == xlim[0]:
        xlim = ylim

    if ylim[1] == ylim[0]:
        ylim = xlim

    # scale the data
    x_scaled = (x - xlim[0]) * 1. / (xlim[1] - xlim[0])
    y_scaled = (y - ylim[0]) * 1. / (ylim[1] - ylim[0])

    # compute the total distance along the path
    dx = x_scaled[1:] - x_scaled[:-1]
    dy = y_scaled[1:] - y_scaled[:-1]
    dist_tot = np.sum(np.sqrt(dx * dx + dy * dy))

    # number of interpolated points is proportional to the distance
    Nu = int(200 * dist_tot)
    u = np.arange(-1, Nu + 1) * 1. / (Nu - 1)

    # interpolate curve at sampled points
    k = min(3, len(x) - 1)
    res = interpolate.splprep([x_scaled, y_scaled], s=0, k=k)
    x_int, y_int = interpolate.splev(u, res[0])

    # we'll perturb perpendicular to the drawn line
    dx = x_int[2:] - x_int[:-2]
    dy = y_int[2:] - y_int[:-2]
    dist = np.sqrt(dx * dx + dy * dy)

    # create a filtered perturbation
    coeffs = mag * np.random.normal(0, 0.01, len(x_int) - 2)
    b = signal.firwin(f1, f2 * dist_tot, window=('kaiser', f3))
    response = signal.lfilter(b, 1, coeffs)

    x_int[1:-1] += response * dy / dist
    y_int[1:-1] += response * dx / dist

    # un-scale data
    x_int = x_int[1:-1] * (xlim[1] - xlim[0]) + xlim[0]
    y_int = y_int[1:-1] * (ylim[1] - ylim[0]) + ylim[0]

    return x_int, y_int
