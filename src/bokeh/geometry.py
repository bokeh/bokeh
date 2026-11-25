#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Typed GeoJSON mappings and convenience constructors for geometry input.

The constructors return ordinary dictionaries. They supply the fixed ``type``
key and preserve the supplied coordinates. Static type checkers can check keys,
discriminators and nesting through the TypedDict schemas. These helpers do not
validate topology or close rings. GeometryDataSource handles ingestion normally.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any, Literal, Protocol, TypedDict

from numpy.typing import NDArray

__all__ = (
    "Coordinates", "GeometryCollection", "GeometryValue", "LineString", "MultiLineString",
    "MultiPoint", "MultiPolygon", "Point", "Polygon", "Position", "SupportsGeoInterface",
    "geometry_collection", "line_string", "multi_line_string", "multi_point",
    "multi_polygon", "point", "polygon",
)

# A concrete container excludes bare strings. Axis values may be numeric,
# datetime or categorical, and are interpreted by Bokeh's coordinate properties.
type Position = list[Any] | tuple[Any, ...] | NDArray[Any]
type Coordinates[T] = Sequence[T] | NDArray[Any]


class SupportsGeoInterface(Protocol):
    """An object exposing a GeoJSON mapping through ``__geo_interface__``."""

    @property
    def __geo_interface__(self) -> Mapping[str, Any]: ...


class Point(TypedDict):
    """A GeoJSON Point mapping."""

    type: Literal["Point"]
    coordinates: Position


class MultiPoint(TypedDict):
    """A GeoJSON MultiPoint mapping."""

    type: Literal["MultiPoint"]
    coordinates: Coordinates[Position]


class LineString(TypedDict):
    """A GeoJSON LineString mapping."""

    type: Literal["LineString"]
    coordinates: Coordinates[Position]


class MultiLineString(TypedDict):
    """A GeoJSON MultiLineString mapping."""

    type: Literal["MultiLineString"]
    coordinates: Coordinates[Coordinates[Position]]


class Polygon(TypedDict):
    """A GeoJSON Polygon mapping."""

    type: Literal["Polygon"]
    coordinates: Coordinates[Coordinates[Position]]


class MultiPolygon(TypedDict):
    """A GeoJSON MultiPolygon mapping."""

    type: Literal["MultiPolygon"]
    coordinates: Coordinates[Coordinates[Coordinates[Position]]]


class GeometryCollection(TypedDict):
    """A GeoJSON collection mapping whose members can share one feature row."""

    type: Literal["GeometryCollection"]
    geometries: Sequence[GeometryValue]


type GeometryValue = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection


def point(coordinates: Position) -> Point:
    """Build a Point mapping."""
    return Point(type="Point", coordinates=coordinates)


def multi_point(coordinates: Coordinates[Position]) -> MultiPoint:
    """Build a MultiPoint mapping."""
    return MultiPoint(type="MultiPoint", coordinates=coordinates)


def line_string(coordinates: Coordinates[Position]) -> LineString:
    """Build a LineString mapping."""
    return LineString(type="LineString", coordinates=coordinates)


def multi_line_string(coordinates: Coordinates[Coordinates[Position]]) -> MultiLineString:
    """Build a MultiLineString mapping."""
    return MultiLineString(type="MultiLineString", coordinates=coordinates)


def polygon(coordinates: Coordinates[Coordinates[Position]]) -> Polygon:
    """Build a Polygon mapping. The first ring is exterior, and subsequent rings are holes."""
    return Polygon(type="Polygon", coordinates=coordinates)


def multi_polygon(coordinates: Coordinates[Coordinates[Coordinates[Position]]]) -> MultiPolygon:
    """Build a MultiPolygon mapping. Each part starts with its exterior ring, followed by holes."""
    return MultiPolygon(type="MultiPolygon", coordinates=coordinates)


def geometry_collection(geometries: Sequence[GeometryValue]) -> GeometryCollection:
    """Build a collection mapping, preserving its member order."""
    return GeometryCollection(type="GeometryCollection", geometries=geometries)
