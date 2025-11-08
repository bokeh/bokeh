#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from functools import wraps

# External imports
import numpy as np

# Bokeh imports
from ..util.dependencies import import_optional

# Optional imports
cartopy = import_optional("cartopy")


def requires_cartopy(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if cartopy is None:
            raise ModuleNotFoundError(
                f"Missing optional dependency 'cartopy' for {type(f).__name__!r}. "
                "To use this function, please install 'cartopy'.",
            )
        return f(*args, **kwargs)
    return wrapper


@requires_cartopy
def _collect_line_geometries(projection, geometries_collection):
    xs = []
    ys = []
    for geometry in geometries_collection.geometries():
        lines = projection.project_geometry(geometry, src_crs=cartopy.crs.PlateCarree())
        for line in lines.geoms:
            x, y = np.array(line.xy)
            xs.append(x)
            ys.append(y)
    return xs, ys


@requires_cartopy
def _collect_polygon_geometries(projection, geometries_collection, **kwargs):
    xs = []
    ys = []
    color = kwargs.get("color")
    color_selection = isinstance(color, (list, tuple))
    selected_colors = []
    if color_selection:
        n_color = len(color)

    for i, geometry in enumerate(geometries_collection.geometries()):
        projected_geometrie = projection.project_geometry(geometry, src_crs=cartopy.crs.PlateCarree())
        for geom in projected_geometrie.geoms:
            x, y = np.array(geom.exterior.xy)
            x_geom = [x]
            y_geom = [y]
            for interior in geom.interiors:
                x, y = np.array(interior.coords.xy)
                x_geom.append(x)
                y_geom.append(y)

            xs.append([x_geom])
            ys.append([y_geom])
            if color_selection:
                selected_colors.append(color[i%n_color])
    if color_selection:
        kwargs.update(color=selected_colors)
    return xs, ys, kwargs


def _collect_lines_from_ploygons(polygon_xs, polygon_ys):
    line_xs = []
    line_ys = []
    for xs, ys in zip(polygon_xs, polygon_ys):
        line_xs.append(xs[0][0])
        line_ys.append(ys[0][0])
    return line_xs, line_ys


@requires_cartopy
def add_line_geometries(p, projection, geometries_collection, **line_kwargs):
    xs, ys = _collect_line_geometries(projection, geometries_collection)
    p.multi_line(xs, ys, **line_kwargs)
    return p


@requires_cartopy
def add_polygon_geometries(p, projection, geometries_collection, **poly_kwargs):
    draw_border = poly_kwargs.pop("draw_polygon_border", False)
    border_color= poly_kwargs.pop("polygon_border_color", "black")
    xs, ys, poly_kwargs = _collect_polygon_geometries(projection, geometries_collection, **poly_kwargs)
    p.multi_polygons(xs, ys, **poly_kwargs)
    if draw_border:
        xs, ys = _collect_lines_from_ploygons(xs, ys)
        p.multi_line(xs, ys, color=border_color)
    return p


@requires_cartopy
def add_borders(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "lightgray")
    borders = cartopy.feature.BORDERS.with_scale(scale)
    return add_line_geometries(p, projection, borders, **line_kwargs)


@requires_cartopy
def add_coastlines(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "black")
    coastline = cartopy.feature.COASTLINE.with_scale(scale)
    return add_line_geometries(p, projection, coastline, **line_kwargs)


@requires_cartopy
def add_land(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#EFEFDB")
    land = cartopy.feature.LAND.with_scale(scale)
    return add_polygon_geometries(p, projection, land, **poly_kwargs)


@requires_cartopy
def add_lakes(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#9FDBF3")
    lakes = cartopy.feature.LAKES.with_scale(scale)
    return add_polygon_geometries(p, projection, lakes, **poly_kwargs)


@requires_cartopy
def add_ocean(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#9FDBF3")
    ocean = cartopy.feature.OCEAN.with_scale(scale)
    return add_polygon_geometries(p, projection, ocean, **poly_kwargs)


@requires_cartopy
def add_rivers(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "#9FDBF3")
    rivers = cartopy.feature.RIVERS.with_scale(scale)
    return add_line_geometries(p, projection, rivers, **line_kwargs)


@requires_cartopy
def add_projection_boundary(p, projection, **line_kwargs):
    line_kwargs.setdefault("color", "black")
    x, y = np.array(projection.boundary.xy)
    p.line(x, y, **line_kwargs)
    return p


@requires_cartopy
def add_provinces(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "lightgray")
    provinces = cartopy.feature.NaturalEarthFeature('cultural', 'admin_1_states_provinces_lines', scale)
    return add_line_geometries(p, projection, provinces, **line_kwargs)


@requires_cartopy
def add_states(p, projection, scale="110m", **poly_kwargs):
    states = cartopy.feature.STATES.with_scale(scale)
    return add_polygon_geometries(p, projection, states, **poly_kwargs)
