import type {
  Feature, FeatureCollection, Geometry, GeometryCollection, Position,
} from "geojson"

import type * as p from "core/properties"
import {construct} from "core/has_props"
import type {HasProps, HasPropsClass, ModelAttrs} from "core/has_props"
import type {Kind} from "core/kinds"
import type {Arrayable, Attrs, Data} from "core/types"
import {is_NDArray} from "core/util/ndarray"
import {dict, entries, keys} from "core/util/object"
import {isArray, isArrayable, isNumber, isPlainObject} from "core/util/types"
import type {Index} from "core/util/templating"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent} from "../../document/events"
import {IndexedDataSource} from "./indexed_data_source"

export type GeometryValue = Geometry | null

export type GeometryRecords = {
  geometries: GeometryValue[]
  data: Data
}

export type GeometryRecord = {geometry: GeometryValue} & {[key: string]: unknown}
export type GeometryPatchSet = {[key: string]: [number, unknown][]}
export type GeometryInput =
  | string | FeatureCollection | GeometryCollection | Feature | Geometry | GeometryRecord | GeometryRecords
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

function is_geometry_records(value: unknown): value is GeometryRecords {
  if (!isPlainObject(value)) {
    return false
  }
  const {geometries, data} = value as {geometries?: unknown, data?: unknown}
  return isArray(geometries) && isPlainObject(data)
}

function coordinate_paths(geometry: GeometryValue): Position[][] {
  if (geometry == null) {
    return []
  }

  switch (geometry.type) {
    case "LineString":
      return [positions(geometry.coordinates)]
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates.map((path) => positions(path))
    case "MultiPolygon":
      return geometry.coordinates.flat().map((path) => positions(path))
    case "GeometryCollection":
      return geometry.geometries.flatMap((item) => coordinate_paths(item))
    default:
      return []
  }
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

function geometry_from_xy(xs: Arrayable, ys: Arrayable): Geometry {
  if (xs.length != ys.length) {
    throw new Error("polygon x and y coordinates must have the same length")
  }

  const rings: Position[][] = []
  let ring: Position[] = []
  for (let i = 0; i <= xs.length; i++) {
    const x = xs[i]
    const y = ys[i]
    const separator = i == xs.length ||
      (typeof x == "number" && !Number.isFinite(x)) ||
      (typeof y == "number" && !Number.isFinite(y))
    if (separator) {
      if (ring.length != 0) {
        rings.push(ring)
        ring = []
      }
    } else {
      ring.push([x, y] as unknown as Position)
    }
  }

  return rings.length <= 1
    ? {type: "Polygon", coordinates: rings}
    : {type: "MultiPolygon", coordinates: rings.map((ring) => [ring])}
}

function is_coordinate_sequence(value: unknown): value is Arrayable {
  return isArrayable(value) && (value.length == 0 || typeof value[0] != "string")
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
    case "GeometryCollection": {
      let offset = 0
      const geometries = geometry.geometries.map((item) => {
        const count = coordinate_paths(item).length
        const updated = replace_coordinate_paths(item, paths.slice(offset, offset + count))
        offset += count
        return updated
      })
      return {...geometry, geometries: geometries as Geometry[]}
    }
    default:
      return geometry
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
  if (typeof geojson == "string") {
    geojson = JSON.parse(geojson) as Exclude<GeometryInput, string>
  }
  if (is_geometry_records(geojson)) {
    const {geometries, data} = geojson
    const lengths = new Set(entries(data).map(([_, values]) => values.length))
    if (lengths.size > 1 || (lengths.size == 1 && !lengths.has(geometries.length))) {
      throw new Error("geometry attributes must have the same length as geometries")
    }
    return {geometries: [...geometries], data: {...data}}
  }
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
  for (const field of fields) {
    data[field] = rows.map((row) => row[field] ?? null)
  }
  return {geometries, data}
}

function geometry_rows({geometries, data}: GeometryRecords): GeometryRecord[] {
  return geometries.map((geometry, i) => {
    const row: GeometryRecord = {geometry}
    for (const [field, values] of entries(data)) {
      row[field] = values[i]
    }
    return row
  })
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
    const nested_xs = xs.length != 0 && is_coordinate_sequence(xs[0])
    const nested_ys = ys.length != 0 && is_coordinate_sequence(ys[0])
    if (nested_xs != nested_ys) {
      throw new Error("polygon x and y coordinates must have matching nesting")
    }

    const geometries = nested_xs && nested_ys
      ? Array.from(xs, (x, i) => geometry_from_xy(x as Arrayable, ys[i] as Arrayable))
      : [geometry_from_xy(xs, ys)]
    return GeometryDataSource.create(geojson_to_geometry_records({geometries, data}))
  }

  protected constructor(attrs: Partial<GeometryDataSource.Attrs> | GeometryInput = {}) {
    if (typeof attrs == "string" || isArray(attrs) || ("type" in attrs || "geometry" in attrs)) {
      super(geojson_to_geometry_records(attrs as GeometryInput) as Partial<GeometryDataSource.Attrs>)
    } else {
      super(attrs as Partial<GeometryDataSource.Attrs>)
    }
  }

  static {
    this.define<GeometryDataSource.Props>(({List, Unknown, Dict, Arrayable, Nullable, Str}) => ({
      geometries: [ List(Unknown) as Kind<GeometryValue[]>, [] ],
      data:       [ Dict(Arrayable(Unknown)), {} ],
      crs:        [ Nullable(Str), null ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.data_changed, ({fields}) => {
      if (fields == null || fields.some((field) => field == "geometry" || field == "x" || field == "y" || field == "z" || field == "xs" || field == "ys" || field == "zs")) {
        this._derived.clear()
      }
    })
    this.connect(this.properties.geometries.change, () => {
      this._derived.clear()
      this._prune_selection()
    })
  }

  get_length(): number {
    return this.geometries.length
  }

  replace(input: GeometryInput, {sync}: {sync?: boolean} = {}): void {
    const records = geojson_to_geometry_records(input)
    this._clear_watchers()
    this._with_selection_sync(sync, () => {
      this.properties.geometries.set_value(records.geometries)
      this.properties.data.set_value(records.data)
      this._prune_selection()
    })
    this._derived.clear()
    this.data_changed.emit({structural: true})
    if (this.document != null) {
      const event = new ColumnDataChangedEvent(this.document, this, "records", records)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
  }

  stream(input: GeometryInput, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    if (rollover != null && rollover < 0) {
      throw new Error("rollover must be non-negative")
    }

    const incoming = geojson_to_geometry_records(input)
    const existing_fields = new Set(keys(this.data))
    const incoming_fields = new Set(keys(incoming.data))
    const missing = [...existing_fields].filter((field) => !incoming_fields.has(field))
    if (missing.length != 0 && incoming.geometries.length != 0) {
      throw new Error(`must stream updates to all existing attributes (missing: ${missing.sort().join(", ")})`)
    }

    let geometries = [...this.geometries, ...incoming.geometries]
    const data: Data = {}
    const current_data = dict(this.data)
    const incoming_data = dict(incoming.data)
    for (const field of new Set([...existing_fields, ...incoming_fields])) {
      const previous = current_data.get(field) ?? Array(this.length).fill(null)
      const appended = incoming_data.get(field) ?? Array(incoming.geometries.length).fill(null)
      data[field] = [...previous, ...appended]
    }

    if (rollover != null) {
      geometries = rollover == 0 ? [] : geometries.slice(-rollover)
      for (const field of keys(data)) {
        const values = data[field]
        data[field] = rollover == 0 ? [] : Array.from(values).slice(-rollover)
      }
    }

    this._clear_watchers()
    this._with_selection_sync(sync, () => {
      this.properties.geometries.set_value(geometries)
      this.properties.data.set_value(data)
      this._prune_selection()
    })
    this._derived.clear()
    this.streaming.emit()
    this.data_changed.emit({structural: true})
    if (this.document != null) {
      const event = new ColumnsStreamedEvent(this.document, this, "records", geometry_rows(incoming), rollover)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
  }

  patch(patches: GeometryPatchSet, {sync}: {sync?: boolean} = {}): void {
    const valid_fields = new Set(["geometry", ...keys(this.data)])
    const extra = keys(patches).filter((field) => !valid_fields.has(field))
    if (extra.length != 0) {
      throw new Error(`can only patch existing geometry fields (extra: ${extra.sort().join(", ")})`)
    }

    const geometries = [...this.geometries]
    const data: Data = {}
    for (const [field, values] of entries(this.data)) {
      data[field] = Array.from(values)
    }
    const indices = new Set<number>()
    for (const [field, changes] of entries(patches)) {
      const values = field == "geometry" ? geometries : data[field]
      for (const [index, value] of changes) {
        if (index < 0 || index >= this.length) {
          throw new Error(`out-of-bounds index (${index}) in patch for field: ${field}`)
        }
        values[index] = value
        indices.add(index)
      }
    }

    this._clear_watchers()
    this._with_selection_sync(sync, () => {
      this.properties.geometries.set_value(geometries)
      this.properties.data.set_value(data)
    })
    this._derived.clear()
    const patched = [...indices]
    this.patching.emit(patched)
    this.data_changed.emit({fields: keys(patches), structural: false})
    if (this.document != null) {
      const event = new ColumnsPatchedEvent(this.document, this, "records", patches)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
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
