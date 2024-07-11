import {Model} from "../../model"
import type * as p from "core/properties"

export namespace Comparison {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Comparison extends Comparison.Attrs {}

export abstract class Comparison extends Model {
  declare properties: Comparison.Props

  constructor(attrs?: Partial<Comparison.Attrs>) {
    super(attrs)
  }

  abstract compute(x: unknown, y: unknown): -1 | 0 | 1
}
