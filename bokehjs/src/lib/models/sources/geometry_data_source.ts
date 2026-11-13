import type {
  Feature, FeatureCollection, Geometry, GeometryCollection, Position,
} from "geojson"

import type * as p from "core/properties"
import {construct} from "core/has_props"
import type {HasProps, HasPropsClass, ModelAttrs} from "core/has_props"
import type {Kind} from "core/kinds"
import type {Arrayable, Attrs, Data, Dict} from "core/types"
import {is_NDArray, to_nested_array, get_array_item} from "core/util/ndarray"
import {dict, entries, keys} from "core/util/object"
import {isArray, isArrayable, isNumber, isPlainObject, isDict} from "core/util/types"
import type {Index} from "core/util/templating"
import {IndexedDataSource} from "./indexed_data_source"

const coordinate_fields = new Set(["x", "y", "z", "xs", "ys", "zs"])

export type GeometryValue = Geometry | null

export type GeometryRecords = {
  geometries: GeometryValue[]
  data: Data
}

export type GeometryRecord = {geometry: GeometryValue} & {[key: string]: unknown}
export type GeometryInput =
  | string | FeatureCollection | GeometryCollection | Feature | Geometry | GeometryRecord | GeometryRecords
  | (Feature | GeometryValue | GeometryRecord)[]

export namespace GeometryDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    geometries: p.Property<GeometryValue[]>
    data: p.Property<Data>
    default_values: p.Property<Dict<unknown>>
    crs: p.Property<string | null>
  }
}

export interface GeometryDataSource extends GeometryDataSource.Attrs {}

export function is_geometry_records(value: unknown): value is GeometryRecords {
  if (!isPlainObject(value)) {
    return false
  }
  const {geometries, data} = value as {geometries?: unknown, data?: unknown}
  return isArray(geometries) && isDict(data)
}

function coordinate_paths(geometry: GeometryValue): Position[][] {
  if (geometry == null) {
    return []
  }

  switch (geometry.type) {
    case "Point":
      return [[geometry.coordinates]]
    case "MultiPoint":
      return [positions(geometry.coordinates)]
    case "LineString":
      return [positions(geometry.coordinates)]
    case "MultiLineString":
    case "Polygon":
      return position_paths(geometry.coordinates)
    case "MultiPolygon": {
      const coordinates = is_NDArray(geometry.coordinates) ? to_nested_array(geometry.coordinates) : geometry.coordinates
      return coordinates.flatMap(position_paths)
    }
    case "GeometryCollection":
      return geometry.geometries.flatMap((item) => coordinate_paths(item))
    default:
      return []
  }
}

function position_paths(value: unknown): Position[][] {
  const paths = is_NDArray(value) ? to_nested_array(value) : value as unknown[]
  return paths.map(positions)
}

function positions(value: unknown): Position[] {
  if (is_NDArray(value)) {
    if (value.dimension != 2) {
      return []
    }
    const [rows, width] = value.shape
    return Array.from({length: rows}, (_, row) =>
      Array.from(value.slice(row*width, (row + 1)*width)) as Position,
    )
  }
  return value as Position[]
}

function coordinate_sequence(geometry: GeometryValue, axis: 0 | 1 | 2): number[] {
  const paths = coordinate_paths(geometry)
  if (paths.length != 1) {
    return []
  }
  return paths[0].map((position) => position[axis] ?? NaN)
}

function point_coordinate(geometry: GeometryValue, axis: 0 | 1 | 2): number {
  return geometry?.type == "Point" ? geometry.coordinates[axis] ?? NaN : NaN
}

function geometry_from_xy(xs: Arrayable, ys: Arrayable): Geometry {
  if (xs.length != ys.length) {
    throw new Error("polygon x and y coordinates must have the same length")
  }

  const ring: Position[] = []
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i]
    const y = ys[i]
    if (isArrayable(x) && typeof x[0] != "string" || isArrayable(y) && typeof y[0] != "string") {
      throw new Error("polygon coordinates must be one- or two-dimensional coordinate arrays")
    }
    if (typeof x == "number" && !Number.isFinite(x) || typeof y == "number" && !Number.isFinite(y)) {
      throw new Error("polygon coordinates must be finite; use natural Polygon or MultiPolygon geometry for multipart data")
    }
    ring.push([x, y] as Position)
  }

  return {type: "Polygon", coordinates: ring.length == 0 ? [] : [ring]}
}

export function is_coordinate_sequence(value: unknown): value is Arrayable {
  return isArrayable(value) && (value.length == 0 || typeof value[0] != "string")
}

export function coordinate_nesting(xs: Arrayable, ys: Arrayable): boolean {
  const x = xs[0]
  const y = ys[0]
  const nested_x = is_coordinate_sequence(x)
  const nested_y = is_coordinate_sequence(y)
  const categorical_row = (value: unknown): boolean => isArray(value) && value.length > 0 && value.every((item) => typeof item == "string")
  if (nested_x && categorical_row(y) || nested_y && categorical_row(x) || categorical_row(x) && categorical_row(y)) {
    return true
  }
  if (nested_x != nested_y) {
    throw new Error("polygon x and y coordinates must have matching nesting")
  }
  return nested_x
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
    rows.push(properties)
  }
}

/** Convert GeoJSON to feature-indexed geometry and attribute storage. */
export function geojson_to_geometry_records(
  geojson: GeometryInput,
): GeometryRecords {
  if (typeof geojson == "string") {
    geojson = JSON.parse(geojson) as Exclude<GeometryInput, string>
  }
  if (is_geometry_records(geojson)) {
    const {geometries, data} = geojson
    if (dict(data).has("geometry")) {
      throw new Error("geometry attribute field is reserved")
    }
    const lengths = new Set(entries(data).map(([_, values]) =>
      is_NDArray(values) && values.dimension > 1 ? values.shape[0] : values.length))
    if (lengths.size > 1 || (lengths.size == 1 && !lengths.has(geometries.length))) {
      throw new Error("geometry attributes must have the same length as geometries")
    }
    return {geometries: [...geometries], data: Object.fromEntries(entries(data))}
  }
  const geometries: GeometryValue[] = []
  const rows: {[key: string]: unknown}[] = []

  const append = (item: Feature | GeometryValue | GeometryRecord): void => {
    if (item == null) {
      append_geometry(null, {}, geometries, rows)
    } else if ("geometry" in item && item.type != "Feature") {
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
    const kind = (geojson as {type?: unknown}).type
    if (kind == "FeatureCollection") {
      for (const feature of (geojson as FeatureCollection).features) {
        append(feature)
      }
    } else if (kind == "GeometryCollection") {
      for (const geometry of (geojson as GeometryCollection).geometries) {
        append(geometry)
      }
    } else {
      append(geojson as Feature | Geometry | GeometryRecord)
    }
  }

  const fields = new Set(rows.flatMap((row) => Object.keys(row)))
  const data: Data = {}
  if (fields.has("geometry")) {
    throw new Error("geometry attribute field is reserved")
  }
  for (const field of fields) {
    data[field] = rows.map((row) => row[field] ?? null)
  }
  return {geometries, data}
}

/** A feature-indexed source retaining natural GeoJSON geometry hierarchy. */
export class GeometryDataSource extends IndexedDataSource {
  declare properties: GeometryDataSource.Props

  private _derived = new Map<string, Arrayable>()

  static override create<T extends GeometryDataSource>(
    this: HasPropsClass<T>, attrs?: Partial<GeometryDataSource.Attrs> | GeometryInput,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs?: ModelAttrs<T>,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs: Partial<GeometryDataSource.Attrs> | GeometryInput | ModelAttrs<T> = {},
  ): T {
    return construct(this, attrs as Attrs)
  }

  static from_xy(xs: Arrayable, ys: Arrayable, data: Data = {}): GeometryDataSource {
    for (const values of [xs, ys]) {
      if (is_NDArray(values) && ![1, 2].includes(values.dimension)) {
        throw new Error("polygon coordinates must be one- or two-dimensional arrays of numbers")
      }
    }
    xs = is_NDArray(xs) ? to_nested_array(xs) : xs
    ys = is_NDArray(ys) ? to_nested_array(ys) : ys
    const nested = coordinate_nesting(xs, ys)
    if (nested && xs.length != ys.length) {
      throw new Error("polygon x and y coordinates must have the same length")
    }
    const geometries = nested
      ? Array.from(xs, (x, i) => geometry_from_xy(x as Arrayable, ys[i] as Arrayable))
      : [geometry_from_xy(xs, ys)]
    return GeometryDataSource.create(geojson_to_geometry_records({geometries, data}))
  }

  protected constructor(attrs: Partial<GeometryDataSource.Attrs> | GeometryInput = {}) {
    if (typeof attrs == "string" || isArray(attrs) || ("type" in attrs || "geometry" in attrs)) {
      super(geojson_to_geometry_records(attrs))
    } else {
      const options = attrs as Partial<GeometryDataSource.Attrs>
      super({...options, ...geojson_to_geometry_records({geometries: options.geometries ?? [], data: options.data ?? {}})})
    }
  }

  static {
    this.define<GeometryDataSource.Props>(({List, Unknown, Dict, Arrayable, Nullable, Str}) => ({
      geometries: [ List(Unknown) as Kind<GeometryValue[]>, [] ],
      data:       [ Dict(Arrayable(Unknown)), {} ],
      default_values: [ Dict(Unknown), {} ],
      crs:        [ Nullable(Str), null ],
    }))
  }

  override setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    if ("geometries" in changed_attrs || "data" in changed_attrs) {
      this._derived.clear()
    }
    if ("data" in changed_attrs && dict(changed_attrs.data as Data).has("geometry")) {
      throw new Error("geometry attribute field is reserved")
    }
    super.setv(changed_attrs, options)
  }

  override connect_signals(): void {
    this.connect(this.change, () => this._derived.clear())
    this.connect(this.data_changed, () => this._derived.clear())
    this.on_change([this.properties.geometries, this.properties.data], () => {
      this.data_changed.emit({structural: true})
    })
    // Invalidate derived fields before base selection-pruning callbacks run.
    super.connect_signals()
  }

  get_length(): number {
    return this.geometries.length
  }

  private _coordinate_field(name: string): Arrayable {
    let values = this._derived.get(name)
    if (values == null) {
      const axis = name == "x" || name == "xs" ? 0 : name == "y" || name == "ys" ? 1 : 2
      values = name.length == 1
        ? this.geometries.map((geometry) => point_coordinate(geometry, axis))
        : this.geometries.map((geometry) => coordinate_sequence(geometry, axis))
      this._derived.set(name, values)
    }
    return values
  }

  get_field(name: string): Arrayable | null {
    if (name == "geometry") {
      return this.geometries
    }
    const field = dict(this.data).get(name)
    if (field != null) {
      return field
    }
    if (coordinate_fields.has(name)) {
      return this._coordinate_field(name)
    }
    return null
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    const result: {[key: string]: unknown} = {geometry: this.geometries[i]}
    for (const [field, values] of entries(this.data)) {
      result[field] = get_array_item(values, i)
    }
    return result
  }

  fields(): string[] {
    return [...new Set(["geometry", ...coordinate_fields, ...keys(this.data)])]
  }
}
