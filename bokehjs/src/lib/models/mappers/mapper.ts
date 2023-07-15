import {Transform} from "../transforms/transform"
import type {Factor} from "../ranges/factor_range"
import type {Arrayable, ArrayableOf} from "core/types"
import type * as p from "core/properties"

export namespace Mapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props
}

export interface Mapper<T> extends Mapper.Attrs {}

export abstract class Mapper<T> extends Transform<number, T> {
  declare properties: Mapper.Props

  constructor(attrs?: Partial<Mapper.Attrs>) {
    super(attrs)
  }

  compute(_x: number): never {
    // If it's just a single value, then a mapper doesn't really make sense.
    throw new Error("mapping single values is not supported")
  }

  abstract override v_compute(xs: ArrayableOf<number | Factor>): Arrayable<T>
}
