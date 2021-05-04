import {Model} from "../../model"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace Transform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Transform<From = number, To = number> extends Transform.Attrs {}

export abstract class Transform<From = number, To = number> extends Model {
  override properties: Transform.Props

  constructor(attrs?: Partial<Transform.Attrs>) {
    super(attrs)
  }

  abstract compute(x: From): To

  abstract v_compute(xs: Arrayable<From>): Arrayable<To>
}
