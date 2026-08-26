import type {
  Feature, FeatureCollection, Geometry, GeometryCollection, Position,
} from "geojson"

import type * as p from "core/properties"
import type {Kind} from "core/kinds"
import type {Arrayable, Data} from "core/types"
import {dict, entries, keys} from "core/util/object"
import {isArray, isNumber} from "core/util/types"
import type {Index} from "core/util/templating"
import {IndexedDataSource} from "./indexed_data_source"

export type GeometryValue = Geometry | null

export type GeometryRecords = {
  geometries: GeometryValue[]
  data: Data
}

export type GeometryRecord = {geometry: GeometryValue} & {[key: string]: unknown}
export type GeometryInput =
  | FeatureCollection | GeometryCollection | Feature | Geometry
  | (Feature | Geometry | GeometryRecord)[]

export namespace GeometryDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    geometries: p.Property<GeometryValue[]>
    data: p.Property<Data>
    crs: p.Property<string | null>
  }
}

export interface GeometryDataSource extends GeometryDataSource.Attrs {}

function coordinate_paths(geometry: GeometryValue): Position[][] {
  if (geometry == null) {
    return []
  }

  switch (geometry.type) {
    case "LineString":
      return [geometry.coordinates]
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates
    case "MultiPolygon":
      return geometry.coordinates.flat()
    case "GeometryCollection":
      return geometry.geometries.flatMap((item) => coordinate_paths(item))
    default:
      return []
  }
}

function flatten_coordinate(geometry: GeometryValue, axis: 0 | 1 | 2): number[] {
  const result: number[] = []
  for (const path of coordinate_paths(geometry)) {
    if (result.length != 0) {
      result.push(NaN)
    }
    for (const position of path) {
      result.push(position[axis] ?? NaN)
    }
  }
  return result
}

function point_coordinate(geometry: GeometryValue, axis: 0 | 1 | 2): number {
  return geometry?.type == "Point" ? geometry.coordinates[axis] ?? NaN : NaN
}

function split_coordinate_paths(xs: Arrayable<number>, ys: Arrayable<number>, zs: Arrayable<number>): Position[][] {
  const paths: Position[][] = []
  let path: Position[] = []
  const n = Math.min(xs.length, ys.length)
  for (let i = 0; i <= n; i++) {
    if (i == n || !isFinite(xs[i] + ys[i])) {
      if (path.length != 0) {
        paths.push(path)
        path = []
      }
    } else {
      const position: Position = [xs[i], ys[i]]
      if (i < zs.length && isFinite(zs[i])) {
        position.push(zs[i])
      }
      path.push(position)
    }
  }
  return paths
}

function replace_coordinate_paths(geometry: GeometryValue, paths: Position[][]): GeometryValue {
  switch (geometry?.type) {
    case "LineString":
      return {...geometry, coordinates: paths[0] ?? []}
    case "MultiLineString":
      return {...geometry, coordinates: paths}
    case "Polygon":
      return {...geometry, coordinates: paths}
    case "MultiPolygon": {
      let offset = 0
      const coordinates = geometry.coordinates.map((polygon) =>
        polygon.map(() => paths[offset++] ?? []),
      )
      for (; offset < paths.length; offset++) {
        coordinates.push([paths[offset]])
      }
      return {...geometry, coordinates}
    }
    default:
      return {type: "Polygon", coordinates: paths}
  }
}

function add_properties(properties: {[key: string]: unknown}, rows: {[key: string]: unknown}[]): void {
  rows.push(properties)
}

function append_geometry(
  geometry: GeometryValue,
  properties: {[key: string]: unknown},
  geometries: GeometryValue[],
  rows: {[key: string]: unknown}[],
): void {
  if (geometry?.type == "GeometryCollection") {
    for (const item of geometry.geometries) {
      append_geometry(item, properties, geometries, rows)
    }
  } else {
    geometries.push(geometry)
    add_properties(properties, rows)
  }
}

/** Convert GeoJSON to feature-indexed geometry and attribute storage. */
export function geojson_to_geometry_records(
  geojson: GeometryInput,
): GeometryRecords {
  const geometries: GeometryValue[] = []
  const rows: {[key: string]: unknown}[] = []

  const append = (item: Feature | Geometry | GeometryRecord): void => {
    if ("geometry" in item && item.type != "Feature") {
      const {geometry, ...properties} = item as GeometryRecord
      append_geometry(geometry, properties, geometries, rows)
    } else {
      const value = item as Feature | Geometry
      if (value.type == "Feature") {
        append_geometry(value.geometry, value.properties ?? {}, geometries, rows)
      } else {
        append_geometry(value, {}, geometries, rows)
      }
    }
  }

  if (isArray(geojson)) {
    for (const item of geojson) {
      append(item)
    }
  } else {
    switch (geojson.type) {
      case "FeatureCollection":
        for (const feature of geojson.features) {
          append(feature)
        }
        break
      case "GeometryCollection":
        for (const geometry of geojson.geometries) {
          append(geometry)
        }
        break
      default:
        append(geojson)
    }
  }

  const fields = new Set(rows.flatMap((row) => Object.keys(row)))
  const data: Data = {}
  for (const field of fields) {
    data[field] = rows.map((row) => row[field] ?? null)
  }
  return {geometries, data}
}

/** A feature-indexed source retaining natural GeoJSON geometry hierarchy. */
export class GeometryDataSource extends IndexedDataSource {
  declare properties: GeometryDataSource.Props

  private _derived = new Map<string, Arrayable>()

  static {
    this.define<GeometryDataSource.Props>(({List, Unknown, Dict, Arrayable, Nullable, Str}) => ({
      geometries: [ List(Unknown) as Kind<GeometryValue[]>, [] ],
      data:       [ Dict(Arrayable(Unknown)), {} ],
      crs:        [ Nullable(Str), null ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.geometries.change, () => {
      this._derived.clear()
      this.data_changed.emit({fields: ["geometry", "x", "y", "z", "xs", "ys", "zs"], structural: true})
    })
    this.connect(this.properties.data.change, () => {
      this.data_changed.emit({fields: keys(this.data), structural: true})
    })
  }

  get_length(): number {
    return this.geometries.length
  }

  get_array<T>(name: string): T[] {
    const field = this.get_field(name)
    if (field == null) {
      const values: T[] = []
      dict(this.data).set(name, values)
      return values
    } else if (isArray(field)) {
      return field as T[]
    } else {
      const values = Array.from(field) as T[]
      if (name == "x" || name == "y" || name == "z" || name == "xs" || name == "ys" || name == "zs") {
        this._derived.set(name, values)
      } else {
        dict(this.data).set(name, values)
      }
      return values
    }
  }

  /** Commit edits made through the virtual xs/ys coordinate fields. */
  commit_coordinates(): void {
    const xs = this.get_array<Arrayable<number>>("xs")
    const ys = this.get_array<Arrayable<number>>("ys")
    const zs = this.get_array<Arrayable<number>>("zs")
    const geometries = xs.map((values, i) => {
      const paths = split_coordinate_paths(values, ys[i] ?? [], zs[i] ?? [])
      return replace_coordinate_paths(this.geometries[i] ?? null, paths)
    })
    this.setv({geometries}, {check_eq: false})
  }

  append_polygon(xs: number[], ys: number[], attrs: {[key: string]: unknown} = {}): void {
    const coordinates = [xs.map((x, i) => [x, ys[i] ?? NaN])]
    const geometries = [...this.geometries, {type: "Polygon" as const, coordinates}]
    const data: Data = {}
    const current = dict(this.data)
    const n = this.geometries.length
    const fields = new Set([...keys(this.data), ...keys(attrs)])
    for (const field of fields) {
      const values = Array.from(current.get(field) ?? Array(n).fill(NaN))
      values.push(attrs[field] ?? NaN)
      data[field] = values
    }
    this.setv({geometries, data}, {check_eq: false})
  }

  delete(indices: number[]): void {
    const geometries = [...this.geometries]
    const data: Data = {}
    const current = dict(this.data)
    for (const [field, values] of current) {
      data[field] = Array.from(values)
    }
    for (const index of [...indices].sort((a, b) => b - a)) {
      geometries.splice(index, 1)
      for (const field of keys(data)) {
        const values = Array.from(data[field])
        values.splice(index, 1)
        data[field] = values
      }
    }
    this.setv({geometries, data}, {check_eq: false})
  }

  private _coordinate_field(name: "x" | "y" | "z" | "xs" | "ys" | "zs"): Arrayable {
    let values = this._derived.get(name)
    if (values == null) {
      const axis = name == "x" || name == "xs" ? 0 : name == "y" || name == "ys" ? 1 : 2
      values = name.length == 1
        ? this.geometries.map((geometry) => point_coordinate(geometry, axis))
        : this.geometries.map((geometry) => flatten_coordinate(geometry, axis))
      this._derived.set(name, values)
    }
    return values
  }

  get_field(name: string): Arrayable | null {
    if (name == "geometry") {
      return this.geometries
    }
    if (name == "x" || name == "y" || name == "z" || name == "xs" || name == "ys" || name == "zs") {
      return this._coordinate_field(name)
    }
    return dict(this.data).get(name) ?? null
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    const result: {[key: string]: unknown} = {geometry: this.geometries[i]}
    for (const [field, values] of entries(this.data)) {
      result[field] = values[i]
    }
    return result
  }

  fields(): string[] {
    return ["geometry", "x", "y", "z", "xs", "ys", "zs", ...keys(this.data)]
  }
}
