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
from ..glyph_api import LineArgs, MultiLineArgs, MultiPolygonsArgs
from ..models import Plot

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
    ) -> tuple[list[np.array], list[np.array]]: ...

def _collect_polygon_geometries(
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **kwargs: Any,
    )  -> tuple[list[list[np.array]], list[list[np.array]], Any]: ...

def _collect_lines_from_polygons(
        polygon_xs:list[list[np.array]],
        polygon_ys:list[list[np.array]],
    ) -> tuple[list[np.array], list[np.array]]: ...

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
