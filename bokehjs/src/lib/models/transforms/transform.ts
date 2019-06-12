import {Model} from "../../model"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace Transform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Transform<To = number> extends Transform.Attrs {}

export abstract class Transform<To = number> extends Model {
  properties: Transform.Props

  constructor(attrs?: Partial<Transform.Attrs>) {
    super(attrs)
  }

  abstract compute(x: number): To

  abstract v_compute(xs: Arrayable<number>): Arrayable<To>
}
