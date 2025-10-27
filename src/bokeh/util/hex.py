#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions useful for dealing with hexagonal tilings.

For more information on the concepts employed here, see this informative page

    https://www.redblobgames.com/grids/hexagons/

'''

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
import math
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

# External imports
import numpy as np

# Bokeh imports
from ..core.enums import HexTileOrientationType

if TYPE_CHECKING:
    import numpy.typing as npt

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'axial_to_cartesian',
    'cartesian_to_axial',
    'hexbin',
    'HexBinResult',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@dataclass
class HexBinResult:
    q: npt.NDArray[np.integer]
    r: npt.NDArray[np.integer]
    counts: npt.NDArray[np.integer]

    def __getitem__(self, key: Literal["q", "r", "counts"]) -> npt.NDArray[np.integer]:
        if key not in ("q", "r", "counts"):
            raise KeyError(f"Invalid key {key!r}, must be one of 'q', 'r', or 'counts'")
        from .warnings import BokehUserWarning, warn

        warn(f"Use obj.{key} instead of obj['{key}']", BokehUserWarning)
        return getattr(self, key)


def axial_to_cartesian(q: Any, r: Any, size: float, orientation: str, aspect_scale: float = 1) -> tuple[Any, Any]:
    ''' Map axial *(q,r)* coordinates to cartesian *(x,y)* coordinates of
    tiles centers.

    This function can be useful for positioning other Bokeh glyphs with
    cartesian coordinates in relation to a hex tiling.

    This function was adapted from:

    https://www.redblobgames.com/grids/hexagons/#hex-to-pixel

    Args:
        q (array[float]) :
            A NumPy array of q-coordinates for binning

        r (array[float]) :
            A NumPy array of r-coordinates for binning

        size (float) :
            The size of the hexagonal tiling.

            The size is defined as the distance from the center of a hexagon
            to the top corner for "pointytop" orientation, or from the center
            to a side corner for "flattop" orientation.

        orientation (str) :
            Whether the hex tile orientation should be "pointytop" or
            "flattop".

        aspect_scale (float, optional) :
            Scale the hexagons in the "cross" dimension.

            For "pointytop" orientations, hexagons are scaled in the horizontal
            direction. For "flattop", they are scaled in vertical direction.

            When working with a plot with ``aspect_scale != 1``, it may be
            useful to set this value to match the plot.

    Returns:
        (array[int], array[int])

    '''
    if orientation == "pointytop":
        x = size * math.sqrt(3) * (q + r/2.0) / aspect_scale
        y = -size * 3/2.0 * r
    else:
        x = size * 3/2.0 * q
        y = -size * math.sqrt(3) * (r + q/2.0) * aspect_scale

    return (x, y)

def cartesian_to_axial(x: Any, y: Any, size: float, orientation: str, aspect_scale: float = 1) -> tuple[Any, Any]:
    ''' Map Cartesian *(x,y)* points to axial *(q,r)* coordinates of enclosing
    tiles.

    This function was adapted from:

    https://www.redblobgames.com/grids/hexagons/#pixel-to-hex

    Args:
        x (array[float]) :
            A NumPy array of x-coordinates to convert

        y (array[float]) :
            A NumPy array of y-coordinates to convert

        size (float) :
            The size of the hexagonal tiling.

            The size is defined as the distance from the center of a hexagon
            to the top corner for "pointytop" orientation, or from the center
            to a side corner for "flattop" orientation.

        orientation (str) :
            Whether the hex tile orientation should be "pointytop" or
            "flattop".

        aspect_scale (float, optional) :
            Scale the hexagons in the "cross" dimension.

            For "pointytop" orientations, hexagons are scaled in the horizontal
            direction. For "flattop", they are scaled in vertical direction.

            When working with a plot with ``aspect_scale != 1``, it may be
            useful to set this value to match the plot.

    Returns:
        (array[int], array[int])

    '''
    HEX_FLAT = [2.0/3.0, 0.0, -1.0/3.0, math.sqrt(3.0)/3.0]
    HEX_POINTY = [math.sqrt(3.0)/3.0, -1.0/3.0, 0.0, 2.0/3.0]

    coords = HEX_FLAT if orientation == 'flattop' else HEX_POINTY

    x =  x / size * (aspect_scale if orientation == "pointytop" else 1)
    y = -y / size / (aspect_scale if orientation == "flattop" else 1)

    q = coords[0] * x + coords[1] * y
    r = coords[2] * x + coords[3] * y

    return _round_hex(q, r)

def hexbin(
    x: npt.NDArray[np.floating],
    y: npt.NDArray[np.floating],
    size: float,
    orientation: HexTileOrientationType = "pointytop",
    aspect_scale: float = 1,
) -> HexBinResult:
    ''' Perform an equal-weight binning of data points into hexagonal tiles.

    For more sophisticated use cases, e.g. weighted binning or scaling
    individual tiles proportional to some other quantity, consider using
    HoloViews.

    Args:
        x (array[float]) :
            A NumPy array of x-coordinates for binning

        y (array[float]) :
            A NumPy array of y-coordinates for binning

        size (float) :
            The size of the hexagonal tiling.

            The size is defined as the distance from the center of a hexagon
            to the top corner for "pointytop" orientation, or from the center
            to a side corner for "flattop" orientation.

        orientation (str, optional) :
            Whether the hex tile orientation should be "pointytop" or
            "flattop". (default: "pointytop")

        aspect_scale (float, optional) :
            Match a plot's aspect ratio scaling.

            When working with a plot with ``aspect_scale != 1``, this
            parameter can be set to match the plot, in order to draw
            regular hexagons (instead of "stretched" ones).

            This is roughly equivalent to binning in "screen space", and
            it may be better to use axis-aligned rectangular bins when
            plot aspect scales are not one.

    Returns:
        DataFrame

        The resulting DataFrame will have columns *q* and *r* that specify
        hexagon tile locations in axial coordinates, and a column *counts* that
        provides the count for each tile.

    .. warning::
        Hex binning only functions on linear scales, i.e. not on log plots.

    '''
    q, r = cartesian_to_axial(x, y, size, orientation, aspect_scale=aspect_scale)

    dtype = [("q", q.dtype), ("r", r.dtype)]
    qr = np.empty(q.shape[0], dtype=dtype)
    qr["q"], qr["r"] = q, r

    unique_qr, counts = np.unique(qr.view(np.void), return_counts=True)
    unique_qr = unique_qr.view(dtype)
    return HexBinResult(q=unique_qr["q"], r=unique_qr["r"], counts=counts)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _round_hex(q: Any, r: Any) -> tuple[Any, Any]:
    ''' Round floating point axial hex coordinates to integer *(q,r)*
    coordinates.

    This code was adapted from:

        https://www.redblobgames.com/grids/hexagons/#rounding

    Args:
        q (array[float]) :
            NumPy array of Floating point axial *q* coordinates to round

        r (array[float]) :
            NumPy array of Floating point axial *q* coordinates to round

    Returns:
        (array[int], array[int])

    '''
    x = q
    z = r
    y = -x-z

    rx = np.round(x)
    ry = np.round(y)
    rz = np.round(z)

    dx = np.abs(rx - x)
    dy = np.abs(ry - y)
    dz = np.abs(rz - z)

    cond = (dx > dy) & (dx > dz)
    q = np.where(cond              , -(ry + rz), rx)
    r = np.where(~cond & ~(dy > dz), -(rx + ry), rz)

    return q.astype(int), r.astype(int)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
