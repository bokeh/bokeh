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

# Standard library imports
from typing import Any, Dict, Optional, Sequence, Tuple, Union

# External imports
import numpy as np

# Bokeh imports
from ..models.renderers import ContourRenderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contour_data_dicts',
    'contour_coords',
    'from_contour',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def from_contour(
    x: Optional[np.ndarray],
    y: Optional[np.ndarray],
    z: Union[np.ndarray, np.ma.MaskedArray],
    levels: Sequence[float],
    fill_color=None,
    line_color=None,
) -> ContourRenderer:
    if fill_color is None and line_color is None:
        raise RuntimeError("Neither fill nor line requested in from_contour")

    fill_data_dict, line_data_dict = contour_data_dicts(x, y, z, levels, fill_color, line_color)

    contour_renderer = ContourRenderer()

    if fill_data_dict:
        glyph = contour_renderer.fill_renderer.glyph
        glyph.line_width = 0
        scalar_fill = isinstance(fill_color, str)
        if scalar_fill:
            glyph.fill_color = fill_color
        else:
            glyph.fill_color = "fill_color"
        contour_renderer.fill_renderer.data_source.data = fill_data_dict

    if line_data_dict:
        glyph = contour_renderer.line_renderer.glyph
        scalar_line = isinstance(line_color, str)
        if scalar_line:
            glyph.line_color = line_color
        else:
            glyph.line_color = "line_color"
        contour_renderer.line_renderer.data_source.data = line_data_dict

    return contour_renderer

def contour_coords(
    x: Optional[np.ndarray],
    y: Optional[np.ndarray],
    z: Union[np.ndarray, np.ma.MaskedArray],
    levels: Sequence[float],
    want_fill: bool,
    want_line: bool,
) -> Tuple[Optional[Tuple[np.ndarray, np.ndarray]], Optional[Tuple[np.ndarray, np.ndarray]]]:
    '''
    Return the (xs, ys) coords of filled and/or line contours.
    '''
    if not want_fill and not want_line:
        raise RuntimeError("Neither fill nor line requested in contour_coords")

    from contourpy import contour_generator, LineType
    cont_gen = contour_generator(x, y, z, line_type=LineType.ChunkCombinedOffset)

    fill_coords = None
    if want_fill:
        all_xs = []
        all_ys = []
        for i in range(len(levels)-1):
            filled = cont_gen.filled(levels[i], levels[i+1])
            xs, ys = _filled_to_xs_and_ys(filled)
            all_xs.append(xs)
            all_ys.append(ys)
        fill_coords = (all_xs, all_ys)

    line_coords = None
    if want_line:
        all_xs = []
        all_ys = []
        for level in levels:
            lines = cont_gen.lines(level)
            xs, ys = _lines_to_xs_and_ys(lines)
            all_xs.append(xs)
            all_ys.append(ys)
        line_coords = (all_xs, all_ys)

    return fill_coords, line_coords

def contour_data_dicts(
    x: Optional[np.ndarray],
    y: Optional[np.ndarray],
    z: Union[np.ndarray, np.ma.MaskedArray],
    levels: Sequence[float],
    fill_color=None,
    line_color=None,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
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

    fill_coords, line_coords = contour_coords(x, y, z, levels, want_fill, want_line)

    fill_data_dict = None
    if fill_coords:
        xs, ys = fill_coords
        fill_data_dict = dict(xs=xs, ys=ys)
        if not scalar_fill:
            fill_data_dict["fill_color"] = fill_color

    line_data_dict = None
    if line_coords:
        xs, ys = line_coords
        line_data_dict = dict(xs=xs, ys=ys)
        if not scalar_line:
            line_data_dict["line_color"] = line_color

    return fill_data_dict, line_data_dict

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
    # ContourPy line data format is LineType.ChunkCombinedOffset.
    points = lines[0][0]
    if points is None:
        return [], []

    offsets = lines[1][0]
    npoints = len(points)
    nlines = len(offsets) - 1

    xs = np.empty(npoints + nlines-1)
    ys = np.empty(npoints + nlines-1)
    for i in range(nlines):
        start = offsets[i]
        end = offsets[i+1]
        if i > 0:
            xs[start+i-1] = np.nan
            ys[start+i-1] = np.nan
        xs[start+i:end+i] = points[start:end, 0]
        ys[start+i:end+i] = points[start:end, 1]
    return xs, ys
