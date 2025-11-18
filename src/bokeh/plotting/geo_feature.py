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
from typing import TYPE_CHECKING, Unpack

# External imports
import numpy as np

try:
    import cartopy.crs as ccrs
    import cartopy.feature as cfeature
except ModuleNotFoundError as e:
    raise ModuleNotFoundError(
        "The module 'geo_feature' requires the optional dependency 'cartopy'."
        "To use this module, please install 'cartopy'.",
    ) from e

# Bokeh imports
from ..models import Plot

if TYPE_CHECKING:
    from ..glyph_api import LineArgs, MultiLineArgs, MultiPolygonsArgs

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def add_line_geometries(
        p: Plot,
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot:
    """Adds line geometries to a map with respect to a given projection.
    The lines are added by the :func:`~bokeh.plotting.figure.multi_line` function.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.multi_line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs
            import cartopy.feature as cfeature

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_line_geometries

            p = figure()
            p = add_line_geometries(p, ccrs.PlateCarree(), cfeature.BORDERS)
            show(p)
    """
    xs, ys = _collect_line_geometries(projection, geometries_collection)
    p.multi_line(xs, ys, **line_kwargs)
    return p


def add_polygon_geometries(
        p: Plot,
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot:
    """Adds polygon geometries to a map with respect to a given projection.
    The polygons are added by the :func:`~bokeh.plotting.figure.multi_polygons`
    function to allow holes and islands. To draw the border of the geometries,
    set `draw_polygon_border` to `True`.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    Keyword Arguments:
        draw_polygon_border (bool, False): Enables the plotting of the geometry border.
        draw_polygon_color (str, "black"): Sets the color of the geometry border.

            .. note::
                This functions allows all keyword arguments defined by the
                :func:`~bokeh.plotting.figure.multi_polygons` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs
            import cartopy.feature as cfeature

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_polygon_geometries

            p = figure()
            p = add_polygon_geometries(p, ccrs.PlateCarree(), cfeature.LAND)
            show(p)
    """
    draw_border = poly_kwargs.pop("draw_polygon_border", False)
    border_color= poly_kwargs.pop("polygon_border_color", "black")
    xs, ys, poly_kwargs = _collect_polygon_geometries(projection, geometries_collection, **poly_kwargs)
    p.multi_polygons(xs, ys, **poly_kwargs)
    if draw_border:
        xs, ys = _collect_lines_from_ploygons(xs, ys)
        p.multi_line(xs, ys, color=border_color)
    return p


def add_borders(
        p:Plot,
        projection:ccrs.Projection,
        scale: str="110m",
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot:
    """Adds the borders of countries to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.multi_line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_borders

            p = figure()
            p = add_borders(p, ccrs.PlateCarree())
            show(p)
    """
    line_kwargs.setdefault("color", "lightgray")
    borders = cfeature.BORDERS.with_scale(scale)
    return add_line_geometries(p, projection, borders, **line_kwargs)


def add_coastlines(
        p: Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot:
    """Adds coastlines to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.multi_line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_coastlines

            p = figure()
            p = add_coastlines(p, ccrs.PlateCarree())
            show(p)
    """
    line_kwargs.setdefault("color", "black")
    coastline = cfeature.COASTLINE.with_scale(scale)
    return add_line_geometries(p, projection, coastline, **line_kwargs)


def add_land(
        p: Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot:
    """Adds land geometries including islands to a map with respect to a
    given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    Keyword Arguments:
        draw_polygon_border (bool, False): Enables the plotting of the geometry border.
        draw_polygon_color (str, "black"): Sets the color of the geometry border.

            .. note::
                This functions allows all keyword arguments defined by the
                :func:`~bokeh.plotting.figure.multi_polygons` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_land

            p = figure()
            p = add_land(p, ccrs.PlateCarree())
            show(p)
    """
    poly_kwargs.setdefault("color", "#EFEFDB")
    land = cfeature.LAND.with_scale(scale)
    return add_polygon_geometries(p, projection, land, **poly_kwargs)


def add_lakes(
        p: Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot:
    """Adds lakes to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    Keyword Arguments:
        draw_polygon_border (bool, False): Enables the plotting of the geometry border.
        draw_polygon_color (str, "black"): Sets the color of the geometry border.

            .. note::
                This functions allows all keyword arguments defined by the
                :func:`~bokeh.plotting.figure.multi_polygons` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_lakes

            p = figure()
            p = add_lakes(p, ccrs.PlateCarree())
            show(p)
    """
    poly_kwargs.setdefault("color", "#9FDBF3")
    lakes = cfeature.LAKES.with_scale(scale)
    return add_polygon_geometries(p, projection, lakes, **poly_kwargs)


def add_ocean(
        p:Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot:
    """Adds ocean to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    Keyword Arguments:
        draw_polygon_border (bool, False): Enables the plotting of the geometry border.
        draw_polygon_color (str, "black"): Sets the color of the geometry border.

            .. note::
                This functions allows all keyword arguments defined by the
                :func:`~bokeh.plotting.figure.multi_polygons` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_ocean

            p = figure()
            p = add_ocean(p, ccrs.PlateCarree())
            show(p)
    """
    poly_kwargs.setdefault("color", "#9FDBF3")
    ocean = cfeature.OCEAN.with_scale(scale)
    return add_polygon_geometries(p, projection, ocean, **poly_kwargs)


def add_rivers(
        p:Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot:
    """Adds rivers to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.multi_line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_rivers

            p = figure()
            p = add_rivers(p, ccrs.PlateCarree())
            show(p)
    """
    line_kwargs.setdefault("color", "#9FDBF3")
    rivers = cfeature.RIVERS.with_scale(scale)
    return add_line_geometries(p, projection, rivers, **line_kwargs)


def add_projection_boundary(
        p:Plot,
        projection: ccrs.Projection,
        **line_kwargs: Unpack[LineArgs],
    ) -> Plot:
    """Adds the boundary of a given projection to a map.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_projection_boundary

            p = figure()
            p = add_projection_boundary(p, ccrs.EckertIII())
            show(p)
    """
    line_kwargs.setdefault("color", "black")
    x, y = np.array(projection.boundary.xy)
    p.line(x, y, **line_kwargs)
    return p


def add_provinces(
        p:Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> Plot:
    """Adds the borders of provinces to a map with respect to a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    .. note::
        This functions allows all keyword arguments defined by the
        :func:`~bokeh.plotting.figure.multi_line` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_provinces

            p = figure()
            p = add_provinces(p, ccrs.PlateCarree())
            show(p)
    """
    line_kwargs.setdefault("color", "lightgray")
    provinces = cfeature.NaturalEarthFeature('cultural', 'admin_1_states_provinces_lines', scale)
    return add_line_geometries(p, projection, provinces, **line_kwargs)


def add_states(
        p: Plot,
        projection: ccrs.Projection,
        scale: str ="110m",
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> Plot:
    """Adds states and provinces to a map for a given projection.

    Args:
        p (Plot): Object which should be extended.
        projection (cartopy.crs.Projection): Cartopy projection for a geographic map.
        scale (str, "110m") Scale of the feature resolution. Valid strings are "110m",
            "50m" and "10m".

    Keyword Arguments:
        draw_polygon_border (bool, False): Enables the plotting of the geometry border.
        draw_polygon_color (str, "black"): Sets the color of the geometry border.

            .. note::
                This functions allows all keyword arguments defined by the
                :func:`~bokeh.plotting.figure.multi_polygons` function.

    Example:

        .. bokeh-plot::
            :source-position: above

            import cartopy.crs as ccrs

            from bokeh.plotting import figure, show
            from bokeh.plotting.geo_feature import add_states

            p = figure()
            p = add_states(p, ccrs.PlateCarree(), draw_polygon_border=True)
            show(p)
    """
    states = cfeature.STATES.with_scale(scale)
    return add_polygon_geometries(p, projection, states, **poly_kwargs)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _collect_line_geometries(
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
    ) -> tuple[list[np.array], list[np.array]]:
    """Collects the x and y elements for lines geometries of a NaturalEarthFeature
    and transforms the coordinates to fit to a given projection.

    Args:
        projection (catopy.crs.Projection): cartopy Projection
        geometries_collection (catopy.feature.NaturalEarthFeature): collection of
            line geometries given by a cartopy NaturalEarthFeature

    Example:

        .. code-block:: python

            import cartopy.crs as ccrs
            import cartopy.feature as cfeature

            from bokeh.plotting.geo_feature import _collect_line_geometries

            xs, ys = _collect_line_geometries(ccrs.Mollweide(), cfeature.BORDERS)
    """
    xs = []
    ys = []
    for geometry in geometries_collection.geometries():
        lines = projection.project_geometry(geometry, src_crs=ccrs.PlateCarree())
        for line in lines.geoms:
            x, y = np.array(line.xy)
            xs.append(x)
            ys.append(y)
    return xs, ys


def _collect_polygon_geometries(
        projection: ccrs.Projection,
        geometries_collection: cfeature.NaturalEarthFeature,
        **kwargs,
    )  -> tuple[list[list[np.array]], list[list[np.array]], dict]:
    """Collects the x and y elements for multi-polygon geometries of a NaturalEarthFeature
    and transforms the coordinates to fit to a given projection.
    If a color palette of list of colors is given, for each geometry the consecutive color
    is selected and the Keyword Arguments are returned with an updated list for colors.

    Args:
        projection (catopy.crs.Projection): cartopy Projection
        geometries_collection (catopy.feature.NaturalEarthFeature): collection of
            multi-polygon geometries given by a cartopy NaturalEarthFeature

    Keyword Arguments:
        color (str | list[str]): color or palette

    Example:

        .. code-block:: python

            import cartopy.crs as ccrs
            import cartopy.feature as cfeature

            from bokeh.plotting.geo_feature import _collect_polygon_geometries

            xs, ys, _ = _collect_polygon_geometries(ccrs.Mollweide(), cfeature.LAKES)
    """
    xs = []
    ys = []
    color = kwargs.get("color")
    color_selection = isinstance(color, (list, tuple))
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


def _collect_lines_from_ploygons(
        polygon_xs:list[list[np.array]],
        polygon_ys:list[list[np.array]],
    ) -> tuple[list[np.array], list[np.array]]:
    """Collects the outline borders of a multi-polygon and returns is as a list.
    This can safe some time, if multi-polygons are already transformed to fit to
    a projection and afterwards the borders are needed.

    Args:
        polygon_xs (list[list[np.array]]): collected polygons for the x coordinate
        polygon_ys (list[list[np.array]]): collected polygons for the y coordinate
    """
    line_xs = []
    line_ys = []
    for xs, ys in zip(polygon_xs, polygon_ys):
        line_xs.append(xs[0][0])
        line_ys.append(ys[0][0])
    return line_xs, line_ys

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
