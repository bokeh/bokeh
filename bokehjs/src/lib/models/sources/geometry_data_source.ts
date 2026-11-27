import type {
  Feature, FeatureCollection, Geometry, GeometryCollection, Position,
} from "geojson"

import {Slice} from "core/util/slice"
import {stream_to_column} from "core/patching"
import {ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent} from "../../document/events"
import type {Decoded} from "../../document/events"

import type * as p from "core/properties"
import {logger} from "core/logging"
import {construct} from "core/has_props"
import type {HasProps, HasPropsClass, ModelAttrs} from "core/has_props"
import type {Kind} from "core/kinds"
import type {Arrayable, Attrs, Data, PlainObject} from "core/types"
import {zip} from "core/util/array"
import {is_equal} from "core/util/eq"
import {is_NDArray, to_nested_array, get_array_item} from "core/util/ndarray"
import {dict, entries, keys} from "core/util/object"
import {isArray, isArrayable, isArrayableOf, isNumber, isPlainObject, isDict, isString} from "core/util/types"
import type {Index} from "core/util/templating"
import {IndexedDataSource} from "./indexed_data_source"

const coordinate_fields = new Set(["x", "y", "z", "xs", "ys", "zs"])

export type GeometryValue = Geometry | null

export type GeometryRecords = {
  geometries: GeometryValue[]
  data: Data
}

export type GeometryRecord = {geometry: GeometryValue} & {[key: string]: unknown}
export type GeometryPatchSet = {[key: string]: [number | (number | Slice)[], unknown][]}

export type GeometryInput =
  | string | FeatureCollection | GeometryCollection | Feature | Geometry | GeometryRecord
  | {geometries: (GeometryValue | Feature)[], data: Data}
  | (Feature | GeometryValue | GeometryRecord)[]

export namespace GeometryDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    geometries: p.Property<GeometryValue[]>
    data: p.Property<Data>
    crs: p.Property<string | null>
  }
}

export interface GeometryDataSource extends GeometryDataSource.Attrs {}

function replace_vertices(vertices: unknown[], start: number, stop: number, replacement: unknown[]): void {
  // Preserve ring storage without spreading large vertex arrays as function arguments.
  const delta = replacement.length - (stop - start)
  const length = vertices.length
  if (delta > 0) {
    vertices.length += delta
    for (let i = length - 1; i >= stop; i--) {
      vertices[i + delta] = vertices[i]
    }
  } else if (delta < 0) {
    for (let i = stop; i < length; i++) {
      vertices[i + delta] = vertices[i]
    }
    vertices.length += delta
  }
  for (let i = 0; i < replacement.length; i++) {
    vertices[start + i] = replacement[i]
  }
}

function vertex_patch_values(index: number | Slice, value: unknown): unknown[][] {
  const positions = index instanceof Slice ? (is_NDArray(value) ? to_nested_array(value) : value) : [value]
  if (!isArray(positions) || positions.some((p) => !isArrayable(p) || p.length < 2)) {
    throw new Error("vertices must contain at least x and y coordinates")
  }
  return positions.map((position) => Array.from(position as Arrayable))
}

function vertex_patch_bounds(index: number | Slice, length: number): [number, number] {
  if (index instanceof Slice) {
    const start = index.start ?? 0
    const stop = index.stop ?? length
    if (index.step != null && index.step != 1 || !Number.isInteger(start) || !Number.isInteger(stop) || start < 0 || start > stop || stop > length) {
      throw new Error("out-of-bounds vertex slice or unsupported slice step")
    }
    return [start, stop]
  }
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error("out-of-bounds vertex index")
  }
  return [index, index + 1]
}

function vertex_patch(geometry: GeometryValue, path: (number | Slice)[], value: unknown): () => void {
  const depth = geometry?.type == "LineString" ? 1
    : geometry?.type == "Polygon" || geometry?.type == "MultiLineString" ? 2
    : geometry?.type == "MultiPolygon" ? 3 : null
  if (depth == null || path.length != depth || geometry == null || !("coordinates" in geometry)) {
    throw new Error("vertex paths must identify a vertex or vertex slice within one explicit ring")
  }
  const publish: [() => void, () => void][] = []
  const materialize = (value: unknown, set: (value: unknown) => void): unknown => {
    if (!is_NDArray(value)) {
      return value
    }
    const array = to_nested_array(value)
    publish.push([() => set(array), () => set(value)])
    return array
  }
  let ring = materialize(geometry.coordinates, (value) => geometry.coordinates = value as never)
  for (const index of path.slice(0, -1)) {
    if (!isArray(ring) || typeof index != "number" || !Number.isInteger(index) || index < 0 || index >= ring.length) {
      throw new Error("out-of-bounds geometry part or ring index")
    }
    const parent = ring
    ring = materialize(parent[index], (value) => parent[index] = value)
  }
  if (!isArray(ring)) {
    throw new Error("invalid vertex storage")
  }
  const vertices = ring
  const index = path[path.length - 1]
  const replacement = vertex_patch_values(index, value)
  const [start, stop] = vertex_patch_bounds(index, vertices.length)
  const previous = vertices.slice(start, stop)
  for (const [commit] of publish) {
    commit()
  }
  replace_vertices(vertices, start, stop, replacement)
  return () => {
    replace_vertices(vertices, start, start + replacement.length, previous)
    for (const [_, rollback] of publish.reverse()) {
      rollback()
    }
  }
}

function column_rows(values: Arrayable): unknown[] {
  return is_NDArray(values) ? to_nested_array(values) : Array.from(values)
}

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
  if (!isArrayable(xs) || !isArrayable(ys) || [xs, ys].some((row) => is_NDArray(row) && row.dimension != 1)) {
    throw new Error("polygon x and y coordinates must have matching nesting")
  }
  if (xs.length != ys.length) {
    throw new Error("polygon x and y coordinates must have the same length")
  }

  const ring = zip(xs, ys).map(([x, y]) =>
    [x instanceof Date ? x.getTime() : x, y instanceof Date ? y.getTime() : y])
  for (const pair of ring) {
    for (const value of pair) {
      if (isNumber(value)) {
        if (!Number.isFinite(value)) {
          throw new Error("polygon coordinates must be finite; use Polygon or MultiPolygon geometry for multipart data")
        }
      } else if (!isString(value) && !(isArrayableOf(value, isString) && value.length > 0)) {
        throw new Error("polygon coordinates must be numbers or categorical factors")
      }
    }
  }

  if (ring.length == 0) {
    return {type: "Polygon", coordinates: []}
  }
  const first = ring[0]
  if (ring.some(([x, y]) => isNumber(x) != isNumber(first[0]) || isNumber(y) != isNumber(first[1]))) {
    throw new Error("polygon coordinates cannot mix numbers and categorical factors on the same axis")
  }
  if (!is_equal(first, ring.at(-1))) {
    ring.push(first)
  }
  if (ring.length < 4) {
    throw new Error("polygon rings must contain at least three vertices")
  }
  return {type: "Polygon", coordinates: [ring as Position[]]}
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

function misaligned_attributes(data: Data, length: number): string[] {
  return entries(data)
    .filter(([, values]) => (is_NDArray(values) && values.dimension > 1 ? values.shape[0] : values.length) != length)
    .map(([field]) => field)
}

function copy_coordinates(value: unknown): unknown {
  // Shaped arrays are materialized before vertex edits. Only plain arrays need ownership here.
  return isArray(value) ? value.map(copy_coordinates) : value
}

function geometry_value(value: unknown): GeometryValue {
  if (value === null) {
    return null
  }
  if (!isPlainObject(value) || !isString(value.type)) {
    throw new Error("geometry values must be GeoJSON mappings with a 'type'")
  }
  if (value.type == "Feature") {
    return geometry_value(value.geometry ?? null)
  }
  if (value.type == "GeometryCollection") {
    if (!isArray(value.geometries)) {
      throw new Error("GeometryCollection must contain a geometries array")
    }
    return {...value, type: "GeometryCollection", geometries: value.geometries.map(geometry_value) as Geometry[]}
  }
  const geometry = {...value}
  if ("coordinates" in geometry) {
    geometry.coordinates = copy_coordinates(geometry.coordinates)
  }
  return geometry as unknown as Geometry
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
    if (misaligned_attributes(data, geometries.length).length != 0) {
      throw new Error("geometry attributes must have the same length as geometries")
    }
    return {geometries: geometries.map(geometry_value), data: Object.fromEntries(entries(data))}
  }
  const geometries: GeometryValue[] = []
  const rows: {[key: string]: unknown}[] = []

  const append = (item: Feature | GeometryValue | GeometryRecord): void => {
    if (item == null) {
      append_geometry(null, {}, geometries, rows)
    } else if ("geometry" in item && item.type != "Feature") {
      const {geometry, ...properties} = item as GeometryRecord
      append_geometry(geometry_value(geometry), properties, geometries, rows)
    } else {
      const value = item as Feature | Geometry
      if (value.type == "Feature") {
        append_geometry(geometry_value(value), value.properties ?? {}, geometries, rows)
      } else {
        append_geometry(geometry_value(value), {}, geometries, rows)
      }
    }
  }

  if (isArray(geojson)) {
    for (const item of geojson) {
      append(item)
    }
  } else {
    const kind = (geojson as {type?: unknown}).type
    if (kind == "FeatureCollection" && !("geometry" in geojson)) {
      for (const feature of (geojson as FeatureCollection).features) {
        append(feature)
      }
    } else {
      append(geojson as Feature | Geometry | GeometryRecord)
    }
  }

  const fields = new Set(rows.flatMap((row) => Object.keys(row)))
  if (fields.has("geometry")) {
    throw new Error("geometry attribute field is reserved")
  }
  const data = Object.fromEntries(Array.from(fields, (field) =>
    [field, rows.map((row) => Object.hasOwn(row, field) ? row[field] ?? null : null)]))
  return {geometries, data}
}

/** A feature-indexed source retaining natural GeoJSON geometry hierarchy. */
export class GeometryDataSource extends IndexedDataSource {
  declare properties: GeometryDataSource.Props

  private _publishing_records = false

  private _derived = new Map<string, Arrayable>()
  private _alignment_check_pending = false

  static override create<T extends GeometryDataSource>(
    this: HasPropsClass<T>, attrs?: Partial<GeometryDataSource.Attrs> | GeometryInput | Map<string, unknown>,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs?: ModelAttrs<T>,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs: Partial<GeometryDataSource.Attrs> | GeometryInput | ModelAttrs<T> | Map<string, unknown> = {},
  ): T {
    return construct(this, attrs as Attrs)
  }

  /** Build closed rings. String arrays on both axes are interpreted as rows. Use explicit geometry for multi-level factors on both axes. */
  static from_xy<T extends GeometryDataSource>(this: typeof GeometryDataSource & HasPropsClass<T>,
      xs: Arrayable, ys: Arrayable, data: Data = {}): T {
    for (const values of [xs, ys]) {
      if (is_NDArray(values) && ![1, 2].includes(values.dimension)) {
        throw new Error("polygon coordinates must be one- or two-dimensional arrays of numbers")
      }
    }
    const shaped_x = is_NDArray(xs) && xs.dimension == 2
    const shaped_y = is_NDArray(ys) && ys.dimension == 2
    xs = is_NDArray(xs) ? to_nested_array(xs) : xs
    ys = is_NDArray(ys) ? to_nested_array(ys) : ys
    const nested = (xs.length == 0 && ys.length == 0) || shaped_x || shaped_y || coordinate_nesting(xs, ys)
    if (nested && xs.length != ys.length) {
      throw new Error("polygon x and y coordinates must have the same length")
    }
    if (nested && (!isArrayableOf(xs, isArrayable) || !isArrayableOf(ys, isArrayable))) {
      throw new Error("polygon x and y coordinates must have matching nesting")
    }
    const geometries = nested
      ? Array.from(xs, (x, i) => geometry_from_xy(x as Arrayable, ys[i] as Arrayable))
      : [geometry_from_xy(xs, ys)]
    return this.create<T>({geometries, data})
  }

  protected constructor(attrs: Partial<GeometryDataSource.Attrs> | GeometryInput | Map<string, unknown> = {}) {
    const input = attrs instanceof Map ? Object.fromEntries(attrs) as Partial<GeometryDataSource.Attrs> : attrs
    if (typeof input == "string" || isArray(input) || ("type" in input || "geometry" in input)) {
      super(geojson_to_geometry_records(input))
    } else {
      const options = input as Partial<GeometryDataSource.Attrs>
      const columns = dict(options.data ?? {})
      const geometry = options.geometries === undefined ? columns.get("geometry") : undefined
      const data = geometry === undefined ? options.data ?? {} : Object.fromEntries([...columns].filter(([name]) => name != "geometry"))
      const geometries = options.geometries ?? (geometry === undefined ? [] : Array.from(geometry) as GeometryValue[])
      super({...options, ...geojson_to_geometry_records({geometries, data})})
    }
  }

  static {
    this.define<GeometryDataSource.Props>(({List, Unknown, Dict, Arrayable, Nullable, Str}) => ({
      geometries: [ List(Unknown) as Kind<GeometryValue[]>, [] ],
      data:       [ Dict(Arrayable(Unknown)), {} ],
      crs:        [ Nullable(Str), null ],
    }))
  }

  override setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    if ("data" in changed_attrs && dict(changed_attrs.data as Data).has("geometry")) {
      throw new Error("geometry attribute field is reserved")
    }
    if ("geometries" in changed_attrs) {
      const geometries = changed_attrs.geometries as unknown
      if (!isArray(geometries)) {
        throw new Error("geometries must be an array")
      }
      changed_attrs = {...changed_attrs, geometries: geometries.map(geometry_value)}
    }
    const geometry_changed = "geometries" in changed_attrs || "data" in changed_attrs
    if (geometry_changed) {
      this._derived.clear()
    }
    super.setv(changed_attrs, options)
    if (geometry_changed && !this._alignment_check_pending) {
      this._alignment_check_pending = true
      // A document patch can replace geometries and data in separate events.
      queueMicrotask(() => {
        this._alignment_check_pending = false
        const mismatched = misaligned_attributes(this.data, this.geometries.length)
        if (mismatched.length != 0) {
          logger.warn(`geometry attributes must have the same length as geometries: ${mismatched.join(", ")}`)
        }
      })
    }
  }

  override connect_signals(): void {
    this.connect(this.change, () => this._derived.clear())
    this.connect(this.data_changed, () => this._derived.clear())
    this.on_change([this.properties.geometries, this.properties.data], () => {
      if (!this._publishing_records) {
        this.data_changed.emit({structural: true})
      }
    })
    // Invalidate derived fields before base selection-pruning callbacks run.
    super.connect_signals()
  }

  get_length(): number {
    return this.geometries.length
  }

  override _data_event_attributes(attr: string): readonly string[] {
    return attr == "records" ? ["geometries", "data"] : super._data_event_attributes(attr)
  }

  override _apply_column_data_changed({attr, data, ...event}: Decoded.ColumnDataChanged): void {
    if (attr != "records") {
      super._apply_column_data_changed({attr, data, ...event})
      return
    }
    this.replace(data as GeometryInput, {sync: false})
  }

  override _apply_columns_streamed({attr, data, rollover}: Decoded.ColumnsStreamed): void {
    if (attr != "records") {
      throw new Error("geometry streams require the records attribute")
    }
    this.stream(data as GeometryInput, rollover, {sync: false})
  }

  override _apply_columns_patched({attr, patches}: Decoded.ColumnsPatched): void {
    if (attr != "records") {
      throw new Error("geometry patches require the records attribute")
    }
    this.patch(patches as GeometryPatchSet, {sync: false})
  }

  private _flush_record_assignments(sync: boolean | undefined): void {
    if (sync !== false) {
      for (const attr of this._data_event_attributes("records")) {
        this.document?.request_sync_flush(this, attr)
      }
    }
  }

  private _set_records(geometries: GeometryValue[], data: Data, sync: boolean | undefined): void {
    this._clear_watchers()
    this._with_selection_sync(sync, () => {
      this.properties.geometries.set_value(geometries)
      this.properties.data.set_value(data)
    })
    this._derived.clear()
  }

  replace(input: GeometryInput, {sync}: {sync?: boolean} = {}): void {
    const records = geojson_to_geometry_records(input)
    this.properties.data.validate(records.data)
    this._flush_record_assignments(sync)
    this._set_records(records.geometries, records.data, sync)
    if (this.document != null) {
      const event = new ColumnDataChangedEvent(this.document, this, "records", records)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
    this._publishing_records = true
    try {
      this.properties.geometries.change.emit()
      this.properties.data.change.emit()
    } finally {
      this._publishing_records = false
    }
    this._with_selection_sync(sync, () => this.data_changed.emit({structural: true}))
  }

  private _stream_records(incoming: GeometryRecords, rollover?: number): GeometryRecords {
    this.properties.data.validate(incoming.data)
    const existing_fields = new Set(keys(this.data))
    const incoming_fields = new Set(keys(incoming.data))
    const missing = [...existing_fields].filter((field) => !incoming_fields.has(field))
    if (missing.length != 0 && incoming.geometries.length != 0) {
      throw new Error(`must stream updates to all existing attributes (missing: ${missing.sort().join(", ")})`)
    }

    const geometries = rollover == 0 ? [] : stream_to_column(this.geometries, incoming.geometries, rollover)
    const current_data = dict(this.data)
    const incoming_data = dict(incoming.data)
    const data: Data = Object.fromEntries(Array.from(new Set([...existing_fields, ...incoming_fields]), (field) => {
      const previous = current_data.get(field) ?? Array(this.length).fill(null)
      const appended = incoming_data.get(field) ?? Array(incoming.geometries.length).fill(null)
      return [field, rollover == 0 ? [] : stream_to_column(column_rows(previous), column_rows(appended), rollover)]
    }))
    return {geometries, data}
  }

  stream(input: GeometryInput, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    if (rollover != null && (!Number.isInteger(rollover) || rollover < 0)) {
      throw new Error("rollover must be a non-negative integer")
    }

    const incoming = geojson_to_geometry_records(input)
    const {geometries, data} = this._stream_records(incoming, rollover)
    this._flush_record_assignments(sync)
    this._set_records(geometries, data, sync)
    if (this.document != null) {
      const event = new ColumnsStreamedEvent(this.document, this, "records", incoming, rollover)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
    this.streaming.emit()
    this._with_selection_sync(sync, () => this.data_changed.emit({structural: true}))
  }

  private _normalize_patches(patches: GeometryPatchSet): GeometryPatchSet {
    const valid_fields = new Set(["geometry", ...keys(this.data)])
    const extra = keys(patches).filter((field) => !valid_fields.has(field))
    if (extra.length != 0) {
      throw new Error(`can only patch existing geometry fields (extra: ${extra.sort().join(", ")})`)
    }

    return Object.fromEntries(
      entries(patches).map(([field, changes]) => [
        field,
        changes.map(([index, value]) => [isArray(index) ? [...index] : index, field == "geometry" && !isArray(index) ? geometry_value(value) : value]),
      ]),
    )
  }

  private _patch_records(geometries: GeometryValue[], data: PlainObject<Arrayable>, patches: GeometryPatchSet): Set<number> {
    const indices = new Set<number>()
    const undo: (() => void)[] = []
    try {
      for (const [field, changes] of entries(patches)) {
        const column = data[field]
        const values = field == "geometry" ? geometries : is_NDArray(column) && column.dimension > 1 ? column_rows(column) : column
        if (field != "geometry") {
          data[field] = values
        }
        for (const [index, value] of changes) {
          if (isArray(index)) {
            const [feature, ...path] = index
            if (field != "geometry" || typeof feature != "number" || !Number.isInteger(feature) || feature < 0 || feature >= this.length) {
              throw new Error("vertex patches require a valid geometry feature index")
            }
            undo.push(vertex_patch(geometries[feature], path, value))
            indices.add(feature)
          } else {
            if (!Number.isInteger(index) || index < 0 || index >= this.length) {
              throw new Error(`out-of-bounds index (${index}) in patch for field: ${field}`)
            }
            if (field != "geometry") {
              const previous = values[index]
              undo.push(() => values[index] = previous)
            }
            values[index] = field == "geometry" ? geometry_value(value) : value
            indices.add(index)
          }
        }
      }
    } catch (error) {
      for (const rollback of undo.reverse()) {
        rollback()
      }
      throw error
    }
    return indices
  }

  patch(patches: GeometryPatchSet, {sync}: {sync?: boolean} = {}): void {
    const normalized = this._normalize_patches(patches)
    const geometries = [...this.geometries]
    const data = Object.fromEntries(entries(this.data))
    // Serialize pending assignments before editing storage they reference.
    this._flush_record_assignments(sync)
    const indices = this._patch_records(geometries, data, normalized)
    this._set_records(geometries, data, sync)
    if (this.document != null) {
      const event = new ColumnsPatchedEvent(this.document, this, "records", normalized)
      event.sync = sync ?? true
      this.document._trigger_on_change(event)
    }
    this.patching.emit([...indices])
    this._with_selection_sync(sync, () => this.data_changed.emit({indices: [...indices], structural: false}))
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
    return {
      geometry: this.geometries[i],
      ...Object.fromEntries(entries(this.data).map(([field, values]) => [field, get_array_item(values, i)])),
    }
  }

  fields(): string[] {
    return [...new Set(["geometry", ...coordinate_fields, ...keys(this.data)])]
  }
}
