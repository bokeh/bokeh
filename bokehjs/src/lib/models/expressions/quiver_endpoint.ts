import type {IndexedDataSource} from "../sources/indexed_data_source"
import {Expression} from "./expression"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace QuiverEndpoint {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Expression.Props & {
    origin: p.Property<string>
    component: p.Property<string>
    scale: p.Property<number>
  }
}

export interface QuiverEndpoint extends QuiverEndpoint.Attrs {}

export class QuiverEndpoint extends Expression {
  declare properties: QuiverEndpoint.Props

  static {
    this.define<QuiverEndpoint.Props>(({Str, Float}) => ({
      origin: [ Str ],
      component: [ Str ],
      scale: [ Float, 1 ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this._result.clear())
  }

  protected _v_compute(source: IndexedDataSource): Arrayable<number> {
    const origins = source.get_field(this.origin)
    const components = source.get_field(this.component)
    if (origins == null || components == null) {
      return new Float64Array(source.get_length() ?? 0).fill(NaN)
    }
    return Float64Array.from(origins, (value, i) => Number(value) + this.scale*Number(components[i]))
  }
}
