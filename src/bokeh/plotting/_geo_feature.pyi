#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Unpack

# External imports
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import numpy as np

# Bokeh imports
from ..models import Plot
from .glyph_api import LineArgs, MultiLineArgs, MultiPolygonsArgs

def add_line_geometries(
        p: Plot,
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot: ...

def add_polygon_geometries(
        p: Plot,
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot: ...

def add_borders(
        p:Plot,
        projection:ccrs.Projection,
        scale: str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot: ...

def add_coastlines(
        p: Plot,
        projection: ccrs.Projection,
        scale: str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot: ...

def add_land(
        p: Plot,
        projection: ccrs.Projection,
        scale: str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot: ...

def add_lakes(
        p: Plot,
        projection: ccrs.Projection,
        scale: str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot: ...

def add_ocean(
        p:Plot,
        projection: ccrs.Projection,
        scale: str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot: ...

def add_rivers(
        p:Plot,
        projection: ccrs.Projection,
        scale: str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot: ...

def add_projection_boundary(
        p:Plot,
        projection: ccrs.Projection,
        **line_kwargs: Unpack[LineArgs],
    ) -> Plot: ...

def add_provinces(
        p:Plot,
        projection: ccrs.Projection,
        scale: str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot: ...

def add_states(
        p: Plot,
        projection: ccrs.Projection,
        scale: str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot: ...

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _collect_line_geometries(
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
    ) -> tuple[list[np.ndarray], list[np.ndarray]]: ...

def _collect_polygon_geometries(
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **kwargs: Any,
    )  -> tuple[list[list[np.ndarray]], list[list[np.ndarray]], Any]: ...

def _collect_lines_from_polygons(
        polygon_xs:list[list[np.ndarray]],
        polygon_ys:list[list[np.ndarray]],
    ) -> tuple[list[np.ndarray], list[np.ndarray]]: ...

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
