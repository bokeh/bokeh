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

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

pytest.importorskip("cartopy")
shapely_geometry = pytest.importorskip("shapely.geometry")

# Module under test
from bokeh.plotting._geo_feature import ( # isort:skip
    _collect_lines_from_polygons,
    _collect_polygon_geometries,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class IdentityProjection:
    def project_geometry(self, geometry, src_crs):
        return geometry

class GeometryCollection:
    def __init__(self, *geometries) -> None:
        self._geometries = geometries

    def geometries(self):
        return self._geometries

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_collect_polygon_geometry_records() -> None:
    polygon = shapely_geometry.Polygon(
        shell=[(0, 0), (2, 0), (2, 2), (0, 0)],
        holes=[[(0.5, 0.5), (1, 0.5), (0.5, 1), (0.5, 0.5)]],
    )

    geometries, kwargs = _collect_polygon_geometries(
        IdentityProjection(),
        GeometryCollection(polygon),
        color=["red"],
    )

    assert geometries == [{
        "type": "Polygon",
        "coordinates": [
            [[0.0, 0.0], [2.0, 0.0], [2.0, 2.0], [0.0, 0.0]],
            [[0.5, 0.5], [1.0, 0.5], [0.5, 1.0], [0.5, 0.5]],
        ],
    }]
    assert kwargs["color"] == ["red"]
    assert _collect_lines_from_polygons(geometries) == (
        [[0.0, 2.0, 2.0, 0.0]],
        [[0.0, 0.0, 2.0, 0.0]],
    )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
