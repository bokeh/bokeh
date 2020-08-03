import {Transform} from "./transform"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import * as p from "core/properties"
import {Arrayable, NumberArray} from "core/types"
import {includes} from "core/util/array"
import {isString, isArray} from "core/util/types"

export namespace Interpolator {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    x: p.Property<string | number[]>
    y: p.Property<string | number[]>
    data: p.Property<ColumnarDataSource | null>
    clip: p.Property<boolean>
  }
}

export interface Interpolator extends Interpolator.Attrs {}

export abstract class Interpolator extends Transform {
  properties: Interpolator.Props

  constructor(attrs?: Partial<Interpolator.Attrs>) {
    super(attrs)
  }

  static init_Interpolator(): void {
    this.define<Interpolator.Props>({
      x:    [ p.Any           ],
      y:    [ p.Any           ],
      data: [ p.Any           ],
      clip: [ p.Boolean, true ],
    })
  }

  protected _x_sorted: NumberArray
  protected _y_sorted: NumberArray
  protected _sorted_dirty = true

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this._sorted_dirty = true)
  }

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    const result = new NumberArray(xs.length)
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      result[i] = this.compute(x)
    }
    return result
  }

  sort(descending: boolean = false): void {
    if (!this._sorted_dirty)
      return

    let tsx: Arrayable<number>
    let tsy: Arrayable<number>
    if (isString(this.x) && isString(this.y) && this.data != null) {
      const column_names = this.data.columns()
      if (!includes(column_names, this.x))
        throw new Error("The x parameter does not correspond to a valid column name defined in the data parameter")
      if (!includes(column_names, this.y))
        throw new Error("The y parameter does not correspond to a valid column name defined in the data parameter")

      tsx = this.data.get_column(this.x)!
      tsy = this.data.get_column(this.y)!
    } else if (isArray(this.x) && isArray(this.y)) {
      tsx = this.x
      tsy = this.y
    } else {
      throw new Error("parameters 'x' and 'y' must be both either string fields or arrays")
    }

    if (tsx.length !== tsy.length)
      throw new Error("The length for x and y do not match")

    if (tsx.length < 2)
      throw new Error("x and y must have at least two elements to support interpolation")

    const n = tsx.length
    const index = new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      index[i] = i
    }

    const sign = descending ? -1 : 1
    index.sort((i, j) => sign*(tsx[i] - tsx[j]))

    this._x_sorted = new NumberArray(n)
    this._y_sorted = new NumberArray(n)

    for (let i = 0; i < n; i++) {
      this._x_sorted[i] = tsx[index[i]]
      this._y_sorted[i] = tsy[index[i]]
    }

    this._sorted_dirty = false
  }
}
