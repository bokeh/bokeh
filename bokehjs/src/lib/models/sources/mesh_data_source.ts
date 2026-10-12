import {construct} from "core/has_props"
import type {HasProps, HasPropsClass, ModelAttrs} from "core/has_props"
import type * as p from "core/properties"
import type {Arrayable, Attrs, Data} from "core/types"
import {is_NDArray} from "core/util/ndarray"
import {isArrayable, isNumber, isPlainObject} from "core/util/types"
import type {Index} from "core/util/templating"
import {gather_values} from "../expressions/indexed_lookup"
import {ColumnDataSource} from "./column_data_source"
import {IndexedDataSource} from "./indexed_data_source"

export namespace MeshDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Columns = {[key: string]: Arrayable | undefined}
  export type CellRecord = {[key: string]: unknown}
  export type CellWithAttrs = [Arrayable<number>, CellRecord]
  export type Vertices = IndexedDataSource | Columns | Arrayable<Arrayable<number>>
  export type Cells = IndexedDataSource | Columns | Arrayable<Arrayable<number> | CellRecord | CellWithAttrs> | Arrayable<number>
  export type Init = Omit<Partial<Attrs>, "vertices" | "cells"> & {vertices?: Vertices, cells?: Cells}

  export type Props = IndexedDataSource.Props & {
    vertices: p.Property<IndexedDataSource>
    cells: p.Property<IndexedDataSource>
    connectivity_field: p.Property<string>
    x_field: p.Property<string>
    y_field: p.Property<string>
    z_field: p.Property<string>
  }
}

export interface MeshDataSource extends MeshDataSource.Attrs {}

function columns_source(columns: MeshDataSource.Columns): ColumnDataSource {
  const data: Data = {}
  for (const [field, values] of Object.entries(columns)) {
    if (values == null) {
      throw new Error(`mesh field '${field}' has an invalid value`)
    }
    data[field] = values
  }
  return ColumnDataSource.create({data})
}

function vertex_source(vertices: MeshDataSource.Vertices): IndexedDataSource {
  if (vertices instanceof IndexedDataSource) {
    return vertices
  }
  if (isPlainObject(vertices) && !is_NDArray(vertices)) {
    return columns_source(vertices as MeshDataSource.Columns)
  }

  let rows: Arrayable<Arrayable<number>>
  if (is_NDArray(vertices)) {
    if (vertices.dimension != 2 || ![2, 3].includes(vertices.shape[1])) {
      throw new Error("mesh vertices must be an (n, 2) or (n, 3) array")
    }
    const [n, width] = vertices.shape
    rows = Array.from({length: n}, (_, row) => vertices.slice(row*width, (row + 1)*width) as Arrayable<number>)
  } else {
    rows = vertices
  }

  const x: number[] = []
  const y: number[] = []
  const z: number[] = []
  let dimension: number | null = null
  for (const vertex of rows) {
    if (!isArrayable(vertex)) {
      throw new Error("mesh vertices must contain coordinate sequences")
    }
    if (vertex.length != 2 && vertex.length != 3) {
      throw new Error("mesh vertices must have two or three coordinates")
    }
    if (dimension != null && dimension != vertex.length) {
      throw new Error("mesh vertices must have a consistent coordinate dimension")
    }
    if (Array.from(vertex).some((value) => !isNumber(value))) {
      throw new Error("mesh vertex coordinates must be numbers")
    }
    dimension = vertex.length
    x.push(vertex[0])
    y.push(vertex[1])
    if (vertex.length == 3) {
      z.push(vertex[2])
    }
  }
  return ColumnDataSource.create({data: dimension == 3 ? {x, y, z} : {x, y}})
}

function cell_source(cells: MeshDataSource.Cells, connectivity_field: string): IndexedDataSource {
  if (cells instanceof IndexedDataSource) {
    return cells
  }
  if (isPlainObject(cells) && !is_NDArray(cells)) {
    return columns_source(cells as MeshDataSource.Columns)
  }

  let connectivity: Arrayable<Arrayable<number>>
  if (is_NDArray(cells)) {
    if (cells.dimension != 2) {
      throw new Error("dense mesh connectivity must be a two-dimensional array")
    }
    const [n, width] = cells.shape
    connectivity = Array.from({length: n}, (_, row) => cells.slice(row*width, (row + 1)*width) as Arrayable<number>)
  } else {
    const items = cells as unknown as Arrayable<unknown>
    const is_record = (cell: unknown): boolean => {
      return isPlainObject(cell) || (
        isArrayable(cell) && cell.length == 2 && isArrayable(cell[0]) && isPlainObject(cell[1])
      )
    }
    if (items.length != 0 && Array.from(items).some(is_record)) {
      if (!Array.from(items).every(is_record)) {
        throw new Error("mesh cells cannot mix connectivity sequences and cell records")
      }

      const records = Array.from(items, (cell) => {
        if (isPlainObject(cell)) {
          if (!(connectivity_field in cell)) {
            throw new Error(`mesh cell records must define the '${connectivity_field}' connectivity field`)
          }
          return {...cell}
        }

        const [indices, attrs] = cell as MeshDataSource.CellWithAttrs
        if (connectivity_field in attrs) {
          throw new Error(`mesh cell attributes cannot contain the reserved '${connectivity_field}' field`)
        }
        return {[connectivity_field]: indices, ...attrs}
      })
      const fields = new Set(records.flatMap((record) => Object.keys(record)))
      const data: Data = {}
      for (const field of fields) {
        data[field] = records.map((record) => record[field] ?? null) as Arrayable
      }
      connectivity = data[connectivity_field] as Arrayable<Arrayable<number>>
      for (const cell of connectivity) {
        if (!isArrayable(cell) || Array.from(cell).some((index) => !isNumber(index) || !Number.isInteger(index))) {
          throw new Error("mesh connectivity must contain sequences of integer vertex indices")
        }
      }
      data[connectivity_field] = Array.from(connectivity, (cell) => Array.from(cell))
      return ColumnDataSource.create({data})
    }

    const connectivity_items = items as Arrayable<number | Arrayable<number>>
    connectivity = connectivity_items.length != 0 && Array.from(connectivity_items).every((index) => isNumber(index))
      ? [connectivity_items as Arrayable<number>]
      : connectivity_items as Arrayable<Arrayable<number>>
  }
  for (const cell of connectivity) {
    if (!isArrayable(cell) || Array.from(cell).some((index) => !isNumber(index) || !Number.isInteger(index))) {
      throw new Error("mesh connectivity must contain sequences of integer vertex indices")
    }
  }
  return ColumnDataSource.create({data: {[connectivity_field]: connectivity}})
}

/** A cell-indexed source containing shared vertices and mesh connectivity. */
export class MeshDataSource extends IndexedDataSource {
  declare properties: MeshDataSource.Props

  private _derived = new Map<string, Arrayable>()

  static override create<T extends MeshDataSource>(
    this: HasPropsClass<T>, attrs?: MeshDataSource.Init,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs?: ModelAttrs<T>,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs: MeshDataSource.Init | ModelAttrs<T> = {},
  ): T {
    return construct(this, attrs as Attrs)
  }

  protected constructor(attrs: MeshDataSource.Init = {}) {
    const {
      vertices: raw_vertices, cells: raw_cells, connectivity_field = "vertices", ...rest
    } = attrs
    const vertices = vertex_source(raw_vertices ?? {x: [], y: []})
    const cells = cell_source(raw_cells ?? {[connectivity_field]: []}, connectivity_field)
    const selected = rest.selected ?? cells.selected
    const selection_policy = rest.selection_policy ?? cells.selection_policy
    super({...rest, connectivity_field, vertices, cells, selected, selection_policy} as Partial<MeshDataSource.Attrs>)
  }

  static {
    this.define<MeshDataSource.Props>(({Ref, Str}) => ({
      vertices:           [ Ref(IndexedDataSource), () => ColumnDataSource.create({data: {x: [], y: []}}), {readonly: true} ],
      cells:              [ Ref(IndexedDataSource), () => ColumnDataSource.create({data: {vertices: []}}), {readonly: true} ],
      connectivity_field: [ Str, "vertices" ],
      x_field:            [ Str, "x" ],
      y_field:            [ Str, "y" ],
      z_field:            [ Str, "z" ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change([
      this.properties.connectivity_field,
      this.properties.x_field,
      this.properties.y_field,
      this.properties.z_field,
    ], () => this._derived.clear())
    this.connect(this.vertices.change, () => {
      this._clear_watchers()
      this._derived.clear()
      this.data_changed.emit({path: ["vertices"], structural: true})
    })
    this.connect(this.cells.change, () => {
      this._clear_watchers()
      this._derived.clear()
      this.data_changed.emit({path: ["cells"], structural: true})
    })
    this.connect(this.vertices.data_changed, (change) => {
      this._clear_watchers()
      this._derived.clear()
      this.data_changed.emit({...change, indices: undefined, path: ["vertices", ...(change.path ?? [])]})
    })
    this.connect(this.cells.data_changed, (change) => {
      this._clear_watchers()
      this._derived.clear()
      this.data_changed.emit({...change, path: ["cells", ...(change.path ?? [])]})
    })
  }

  get_length(): number | null {
    return this.cells.get_length()
  }

  private _coordinate_field(name: "xs" | "ys" | "zs"): Arrayable | null {
    let result = this._derived.get(name)
    if (result != null) {
      return result
    }
    const field = name == "xs" ? this.x_field : name == "ys" ? this.y_field : this.z_field
    const values = this.vertices.get_field(field)
    if (values == null) {
      return null
    }
    const indices = this.cells.get_field(this.connectivity_field)
    if (indices == null) {
      throw new Error(`unknown connectivity field '${this.connectivity_field}' in ${this.cells}`)
    }
    result = gather_values(values, indices)
    this._derived.set(name, result)
    return result
  }

  get_field(name: string): Arrayable | null {
    if (name == "xs" || name == "ys" || name == "zs") {
      return this._coordinate_field(name)
    }
    return this.cells.get_field(name)
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    const result = this.cells.get_record(index)
    for (const name of ["xs", "ys", "zs"] as const) {
      const values = this._coordinate_field(name)
      if (values != null) {
        result[name] = values[i]
      }
    }
    return result
  }

  fields(): string[] {
    const coordinate_fields = this.vertices.get_field(this.z_field) == null ? ["xs", "ys"] : ["xs", "ys", "zs"]
    return [...new Set([...this.cells.fields(), ...coordinate_fields])]
  }
}
