import {Model} from "../../model"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace Transform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Transform<From = number, To = number> extends Transform.Attrs {}

export abstract class Transform<From = number, To = number> extends Model {
  declare properties: Transform.Props

  /** Whether coordinate date strings should be materialized before this transform. */
  get materialize_dates_before(): boolean {
    return false
  }

  abstract compute(x: From): To

  abstract v_compute(xs: Arrayable<From>): Arrayable<To>
}
