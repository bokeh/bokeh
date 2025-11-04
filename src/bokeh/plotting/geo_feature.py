import sys
if sys.modules.get("cartopy"):
    import cartopy.feature as cfeature
    import cartopy.crs as ccrs
else:
    raise ImportError("Missing optional dependency 'Cartopy'. ")
import numpy as np
from typing import Iterable


def _collect_line_geometries(projection, geometries_collection):
    xs = []
    ys = []
    for geometry in geometries_collection.geometries():
        lines = projection.project_geometry(geometry, src_crs=ccrs.PlateCarree())
        for line in lines.geoms:
            x, y = np.array(line.xy)
            xs.append(x)
            ys.append(y)
    return xs, ys


def _collect_polygon_geometries(projection, geometries_collection, **kwargs):
    xs = []
    ys = []
    color = kwargs.get("color")
    color_selection = isinstance(color, Iterable) and not isinstance(color, str)
    selected_colors = []
    if color_selection:
        n_color = len(color)

    for i, geometry in enumerate(geometries_collection.geometries()):
        projected_geometrie = projection.project_geometry(geometry, src_crs=ccrs.PlateCarree())
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


def add_line_geometries(p, projection, geometries_collection, **line_kwargs):
    xs, ys = _collect_line_geometries(projection, geometries_collection)
    p.multi_line(xs, ys, **line_kwargs)
    return p


def add_polygon_geometries(p, projection, geometries_collection, **poly_kwargs):
    draw_border = poly_kwargs.pop("draw_polygon_border", False)
    border_color= poly_kwargs.pop("polygon_border_color", "black")
    xs, ys, poly_kwargs = _collect_polygon_geometries(projection, geometries_collection, **poly_kwargs)
    p.multi_polygons(xs, ys, **poly_kwargs)
    if draw_border:
        xs, ys = _collect_lines_from_ploygons(xs, ys)
        p.multi_line(xs, ys, color=border_color)
    return p


def add_borders(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "lightgray")
    borders = cfeature.BORDERS.with_scale(scale)
    return add_line_geometries(p, projection, borders, **line_kwargs)


def add_coastlines(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "black")
    coastline = cfeature.COASTLINE.with_scale(scale)
    return add_line_geometries(p, projection, coastline, **line_kwargs)


def add_land(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#EFEFDB")
    land = cfeature.LAND.with_scale(scale)
    return add_polygon_geometries(p, projection, land, **poly_kwargs)


def add_lakes(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#9FDBF3")
    lakes = cfeature.LAKES.with_scale(scale)
    return add_polygon_geometries(p, projection, lakes, **poly_kwargs)


def add_ocean(p, projection, scale="110m", **poly_kwargs):
    poly_kwargs.setdefault("color", "#9FDBF3")
    ocean = cfeature.OCEAN.with_scale(scale)
    return add_polygon_geometries(p, projection, ocean, **poly_kwargs)


def add_rivers(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "#9FDBF3")
    rivers = cfeature.RIVERS.with_scale(scale)
    return add_line_geometries(p, projection, rivers, **line_kwargs)


def add_projection_boundary(p, projection, **line_kwargs):
    line_kwargs.setdefault("color", "black")
    x, y = np.array(projection.boundary.xy)
    p.line(x, y, **line_kwargs)
    return p


def add_provinces(p, projection, scale="110m", **line_kwargs):
    line_kwargs.setdefault("color", "lightgray")
    provinces = cfeature.NaturalEarthFeature('cultural', 'admin_1_states_provinces_lines', scale)
    return add_line_geometries(p, projection, provinces, **line_kwargs)


def add_states(p, projection, scale="110m", **poly_kwargs):
    states = cfeature.STATES.with_scale(scale)
    return add_polygon_geometries(p, projection, states, **poly_kwargs)
