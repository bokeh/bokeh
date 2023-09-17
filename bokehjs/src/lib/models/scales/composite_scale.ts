import {Scale} from "../scales/scale"
import {map} from "core/util/arrayable"
import type * as p from "core/properties"
import type {Arrayable, ScreenArray, FloatArray} from "core/types"

export namespace CompositeScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    source_scale: p.Property<Scale>
    target_scale: p.Property<Scale>
  }
}

export interface CompositeScale extends CompositeScale.Attrs {}

export class CompositeScale extends Scale {
  declare properties: CompositeScale.Props

  constructor(attrs?: Partial<CompositeScale.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CompositeScale.Props>(({Ref}) => ({
      source_scale: [ Ref(Scale) ],
      target_scale: [ Ref(Scale) ],
    }))
  }

  get s_compute(): (x: number) => number {
    const source_compute = this.source_scale.s_compute
    const target_compute = this.target_scale.s_compute
    return (x) => target_compute(source_compute(x))
  }

  get s_invert(): (sx: number) => number {
    const source_invert = this.source_scale.s_invert
    const target_invert = this.target_scale.s_invert
    return (sx) => source_invert(target_invert(sx))
  }

  override compute(x: number): number {
    return this.s_compute(x)
  }

  override v_compute(xs: Arrayable<number>): ScreenArray {
    const {s_compute} = this
    return map(xs, s_compute) as ScreenArray // XXX
  }

  override invert(sx: number): number {
    return this.s_invert(sx)
  }

  override v_invert(sxs: Arrayable<number>): FloatArray {
    const {s_invert} = this
    return map(sxs, s_invert) as FloatArray // XXX
  }
}
