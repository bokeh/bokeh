#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contour_data_dicts',
    'contour_coords',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def contour_coords(x, y, z, levels, want_fill, want_line):
    '''
    Return the (xs, ys) coords of filled and/or line contours.
    '''
    if not want_fill and not want_line:
        raise RuntimeError("Neither fill nor line requested in contour_coords")

    from contourpy import contour_generator
    cont_gen = contour_generator(x, y, z)

    coords = {}  # To return.

    if want_fill:
        all_xs = []
        all_ys = []
        for i in range(len(levels)-1):
            filled = cont_gen.filled(levels[i], levels[i+1])
            xs, ys = _filled_to_xs_and_ys(filled)
            all_xs.append(xs)
            all_ys.append(ys)
        coords["fill"] = (all_xs, all_ys)

    if want_line:
        all_xs = []
        all_ys = []
        for level in levels:
            lines = cont_gen.lines(level)
            xs, ys = _lines_to_xs_and_ys(lines)
            all_xs += xs
            all_ys += ys
        coords["line"] = (all_xs, all_ys)

    return coords

def contour_data_dicts(x, y, z, levels, fill_color=None, line_color=None):
    '''
    Return the data dicts of filled and/or line contours that can be used to set or update
    ColumnDataSources.
    '''
    if fill_color is None and line_color is None:
        raise RuntimeError("Neither fill nor line requested in contour_data_dicts")

    want_fill = fill_color is not None
    want_line = line_color is not None
    nlevels = len(levels)
    if want_fill:
        scalar_fill = isinstance(fill_color, str)
        if not scalar_fill and len(fill_color) != nlevels-1:
            raise RuntimeError("Inconsistent number of fill_color and number of levels")

    if want_line:
        scalar_line = isinstance(line_color, str)
        if not scalar_line and len(line_color) != nlevels:
            raise RuntimeError("Inconsistent number of line_color and number of levels")

    coords = contour_coords(x, y, z, levels, want_fill, want_line)

    data_dicts = {}  # To return.

    if want_fill:
        xs, ys = coords["fill"]
        data_dict = dict(xs=xs, ys=ys)
        if not scalar_fill:
            data_dict["fill_color"] = fill_color
        data_dicts["fill"] = data_dict

    if want_line:
        xs, ys = coords["line"]
        data_dict = dict(xs=xs, ys=ys)
        if not scalar_line:
            data_dict["line_color"] = line_color
        data_dicts["line"] = data_dict

    return data_dicts

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _filled_to_xs_and_ys(filled):
    # Processes polygon data returned from a single call to
    # contourpy.ContourGenerator.filled(lower_level, upper_level)
    # ContourPy filled data format is FillType.OuterOffset.
    xs = []
    ys = []
    for points, offsets in zip(*filled):
        # Polygon with outer boundary and zero or more holes.
        n = len(offsets) - 1
        xs.append([points[offsets[i]:offsets[i+1], 0] for i in range(n)])
        ys.append([points[offsets[i]:offsets[i+1], 1] for i in range(n)])
    return xs, ys

def _lines_to_xs_and_ys(lines):
    # Processes line data returned from a single call to
    # contourpy.ContourGenerator.lines(level).
    # ContourPy line data format is LineType.Separate.
    xs = [line[:, 0] for line in lines]
    ys = [line[:, 1] for line in lines]
    return xs, ys
