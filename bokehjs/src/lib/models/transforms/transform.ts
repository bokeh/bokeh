import {Model} from "../../model"
import {Arrayable} from "core/types"

export namespace Transform {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface Transform<To = number> extends Transform.Attrs {}

export abstract class Transform<To = number> extends Model {

  properties: Transform.Props

  constructor(attrs?: Partial<Transform.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Transform"
  }

  abstract compute(x: number): To

  abstract v_compute(xs: Arrayable<number>): Arrayable<To>
}
Transform.initClass()
