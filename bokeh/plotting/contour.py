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
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    List,
    Sequence,
    Tuple,
    Union,
)

# External imports
import numpy as np
from numpy.typing import ArrayLike

# Bokeh imports
from ..core.property_mixins import FillProps, HatchProps, LineProps
from ..models.contour_renderer import ContourRenderer
from ..models.glyphs import MultiLine, MultiPolygons
from ..models.sources import ColumnDataSource
from ..palettes import linear_palette
from ..plotting._renderer import _process_sequence_literals
from ..util.dataclasses import dataclass

if TYPE_CHECKING:
    from ..palettes import Palette, PaletteCollection
    from ..transform import ColorLike

    ContourColor: Union[ColorLike, Sequence[ColorLike]]
    ContourColorOrPalette: Union[ContourColor, Palette, PaletteCollection, ContourColor]

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contour_data',
    'from_contour',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def contour_data(
    x: ArrayLike | None = None,
    y: ArrayLike | None = None,
    z: ArrayLike | np.ma.MaskedArray | None = None,
    levels: ArrayLike | None = None,
    *,
    want_fill: bool = True,
    want_line: bool = True,
) -> Tuple[Dict[str, Any] | None, Dict[str, Any] | None]:
    ''' Return the contour data of filled and/or line contours that can be
    used to set ContourRenderer.data
    '''
    levels = _validate_levels(levels)
    if len(levels) < 2:
        want_fill = False

    if not want_fill and not want_line:
        raise ValueError("Neither fill nor line requested in contour_data")

    coords = _contour_coords(x, y, z, levels, want_fill, want_line)

    fill_data = None
    if coords.fill:
        fill_data = dict(xs=coords.fill.xs, ys=coords.fill.ys, lower_levels=levels[:-1], upper_levels=levels[1:])

    line_data = None
    if coords.line:
        line_data = dict(xs=coords.line.xs, ys=coords.line.ys, levels=levels)

    return fill_data, line_data

def from_contour(
    x: ArrayLike | None = None,
    y: ArrayLike | None = None,
    z: ArrayLike | np.ma.MaskedArray | None = None,
    levels: ArrayLike | None = None,
    **visuals,  # This is union of LineProps, FillProps and HatchProps
) -> ContourRenderer:
    # Don't call this directly, use figure.contour instead.

    levels = _validate_levels(levels)
    if len(levels) < 2:
        want_fill = False

    nlevels = len(levels)

    want_line = "line_color" in visuals
    if want_line:
        # Handle possible callback or interpolation for line_color.
        visuals["line_color"] = _color(visuals["line_color"], nlevels)

        line_cds = ColumnDataSource()
        _process_sequence_literals(MultiLine, visuals, line_cds, False)

        # Remove line visuals identified from visuals dict.
        line_visuals = {}
        for name in LineProps.properties():
            prop = visuals.pop(name, None)
            if prop is not None:
                line_visuals[name] = prop

    want_fill = "fill_color" in visuals
    if want_fill:
        # Handle possible callback or interpolation for fill_color.
        visuals["fill_color"] = _color(visuals["fill_color"], nlevels-1)

        fill_cds = ColumnDataSource()
        _process_sequence_literals(MultiPolygons, visuals, fill_cds, False)

    # Check for extra unknown kwargs.
    unknown = visuals.keys() - FillProps.properties() - HatchProps.properties()
    if unknown:
        raise ValueError(f"Unknown keyword arguments in 'from_contour': {', '.join(unknown)}")

    new_contour_data = contour_data(x=x, y=y, z=z, levels=levels, want_fill=want_fill, want_line=want_line)

    # Will be other possibilities here like logarithmic....
    contour_renderer = ContourRenderer(data=new_contour_data, levels=list(levels))

    fill_data, line_data = new_contour_data

    if fill_data:
        glyph = contour_renderer.fill_renderer.glyph
        for name, value in visuals.items():
            setattr(glyph, name, value)

        cds = contour_renderer.fill_renderer.data_source
        for name, value in fill_cds.data.items():
            cds.add(value, name)

        glyph.line_alpha = 0  # Don't display lines around fill.
        glyph.line_width = 0

    if line_data:
        glyph = contour_renderer.line_renderer.glyph
        for name, value in line_visuals.items():
            setattr(glyph, name, value)

        cds = contour_renderer.line_renderer.data_source
        for name, value in line_cds.data.items():
            cds.add(value, name)

    return contour_renderer

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@dataclass
class SingleFillCoords:
    ''' Coordinates for filled contour polygons between a lower and upper level.

    The first list contains a list for each polygon. The second list contains
    a separate NumPy array for each boundary of that polygon; the first array
    is always the outer boundary, subsequent arrays are holes.
    '''
    xs: List[List[np.ndarray]]
    ys: List[List[np.ndarray]]

@dataclass
class SingleLineCoords:
    ''' Coordinates for contour lines at a single contour level.

    The x and y coordinates are stored in a single NumPy array each, with a
    np.nan separating each line.
    '''
    xs: np.ndarray
    ys: np.ndarray

@dataclass
class AllFillCoords:
    ''' Coordinates for all filled polygons over a whole sequence of contour levels.
    '''
    xs: List[List[List[np.ndarray]]]
    ys: List[List[List[np.ndarray]]]

@dataclass
class AllLineCoords:
    ''' Coordinates for all contour lines over a whole sequence of contour levels.
    '''
    xs: List[np.ndarray]
    ys: List[np.ndarray]

@dataclass
class ContourCoords:
    ''' Combined filled and line contours over a whole sequence of contour levels.
    '''
    fill: AllFillCoords | None
    line: AllLineCoords | None

def _color(color: ContourColorOrPalette, n: int) -> ContourColor:
    # Dict to sequence of colors such as palettes.cividis
    if isinstance(color, Dict):
        color = color.get(n, None)
        if not color or len(color) != n:
            raise ValueError(f"Dict of colors does not contain a key of {n}")

    if isinstance(color, Sequence) and not isinstance(color, (bytes, str)):
        if len(color) < n:
            raise ValueError("Insufficient number of colors")
        elif len(color) > n:
            color = linear_palette(color, n)

    return color

def _contour_coords(
    x: ArrayLike | None,
    y: ArrayLike | None,
    z: ArrayLike | np.ma.MaskedArray | None,
    levels: ArrayLike,
    want_fill: bool,
    want_line: bool,
) -> ContourCoords:
    '''
    Return the (xs, ys) coords of filled and/or line contours.
    '''
    if not want_fill and not want_line:
        raise RuntimeError("Neither fill nor line requested in _contour_coords")

    from contourpy import FillType, LineType, contour_generator
    cont_gen = contour_generator(x, y, z, line_type=LineType.ChunkCombinedOffset, fill_type=FillType.OuterOffset)

    fill_coords = None
    if want_fill:
        all_xs = []
        all_ys = []
        for i in range(len(levels)-1):
            filled = cont_gen.filled(levels[i], levels[i+1])
            coords = _filled_to_coords(filled)
            all_xs.append(coords.xs)
            all_ys.append(coords.ys)
        fill_coords = AllFillCoords(all_xs, all_ys)

    line_coords = None
    if want_line:
        all_xs = []
        all_ys = []
        for level in levels:
            lines = cont_gen.lines(level)
            coords = _lines_to_coords(lines)
            all_xs.append(coords.xs)
            all_ys.append(coords.ys)
        line_coords = AllLineCoords(all_xs, all_ys)

    return ContourCoords(fill_coords, line_coords)

def _filled_to_coords(filled) -> SingleFillCoords:
    # Processes polygon data returned from a single call to
    # contourpy.ContourGenerator.filled(lower_level, upper_level)
    # ContourPy filled data format is FillType.OuterOffset.
    # 'filled' type awaits type annotations in contourpy.
    xs = []
    ys = []
    for points, offsets in zip(*filled):
        # Polygon with outer boundary and zero or more holes.
        n = len(offsets) - 1
        xs.append([points[offsets[i]:offsets[i+1], 0] for i in range(n)])
        ys.append([points[offsets[i]:offsets[i+1], 1] for i in range(n)])
    return SingleFillCoords(xs, ys)

def _lines_to_coords(lines) -> SingleLineCoords:
    # Processes line data returned from a single call to
    # contourpy.ContourGenerator.lines(level).
    # ContourPy line data format is LineType.ChunkCombinedOffset.
    # 'lines' type awaits type annotations in contourpy.
    points = lines[0][0]
    if points is None:
        empty = np.empty(0)
        return SingleLineCoords(empty, empty)

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
    return SingleLineCoords(xs, ys)

def _validate_levels(levels: ArrayLike | None):
    levels = np.asarray(levels)
    if len(levels) == 0:
        raise ValueError("No contour levels specified")
    if len(levels) > 1 and np.diff(levels).min() <= 0.0:
        raise ValueError("Contour levels must be increasing")

    return levels
