import {Transform} from "../transforms/transform"
import {Factor} from "../ranges/factor_range"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace Mapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props
}

export interface Mapper<T> extends Mapper.Attrs {}

export abstract class Mapper<T> extends Transform<T> {
  properties: Mapper.Props

  constructor(attrs?: Partial<Mapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Mapper"
  }

  compute(_x: number): never {
    // If it's just a single value, then a mapper doesn't really make sense.
    throw new Error("mapping single values is not supported")
  }

  abstract v_compute(xs: Arrayable<number> | Arrayable<Factor>): Arrayable<T>

}
Mapper.initClass()
