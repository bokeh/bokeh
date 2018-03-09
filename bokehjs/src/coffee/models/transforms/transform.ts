import {Model} from "../../model"
import {Arrayable} from "core/types"

export namespace Transform {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface Transform extends Transform.Attrs {}

export abstract class Transform extends Model {

  properties: Transform.Props

  constructor(attrs?: Partial<Transform.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Transform"
  }

  abstract compute(x: number): number

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    const result = new Float64Array(xs.length)
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      result[i] = this.compute(x)
    }
    return result
  }
}
Transform.initClass()
