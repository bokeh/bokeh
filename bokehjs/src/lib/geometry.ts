import type {
  Geometry, GeometryCollection, LineString, MultiLineString, MultiPoint,
  MultiPolygon, Point, Polygon, Position,
} from "geojson"

export type {
  Geometry as GeometryValue, GeometryCollection, LineString, MultiLineString,
  MultiPoint, MultiPolygon, Point, Polygon, Position,
} from "geojson"

// Return ordinary GeoJSON objects without copying coordinates or changing topology.
export function point(coordinates: Position): Point {
  return {type: "Point", coordinates}
}

export function multi_point(coordinates: Position[]): MultiPoint {
  return {type: "MultiPoint", coordinates}
}

export function line_string(coordinates: Position[]): LineString {
  return {type: "LineString", coordinates}
}

export function multi_line_string(coordinates: Position[][]): MultiLineString {
  return {type: "MultiLineString", coordinates}
}

export function polygon(coordinates: Position[][]): Polygon {
  return {type: "Polygon", coordinates}
}

export function multi_polygon(coordinates: Position[][][]): MultiPolygon {
  return {type: "MultiPolygon", coordinates}
}

export function geometry_collection(geometries: Geometry[]): GeometryCollection {
  return {type: "GeometryCollection", geometries}
}
