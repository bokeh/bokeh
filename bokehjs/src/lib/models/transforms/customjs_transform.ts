import {Transform} from "./transform"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJSTransform {
  export interface Attrs extends Transform.Attrs {
    args: {[key: string]: any}
    func: string
    v_func: string
    use_strict: boolean
  }

  export interface Props extends Transform.Props {}
}

export interface CustomJSTransform extends CustomJSTransform.Attrs {}

export class CustomJSTransform extends Transform {

  properties: CustomJSTransform.Props

  constructor(attrs?: Partial<CustomJSTransform.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CustomJSTransform'

    this.define({
      args:       [ p.Any,    {}     ], // TODO (bev) better type
      func:       [ p.String, ""     ],
      v_func:     [ p.String, ""     ],
      use_strict: [ p.Boolean, false ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_transform(name: string, func: string): Function {
    const code = this.use_strict ? use_strict(func) : func
    return new Function(...this.names, name, "require", "exports", code)
  }

  get scalar_transform(): Function {
    return this._make_transform("x", this.func)
  }

  get vector_transform(): Function {
    return this._make_transform("xs", this.v_func)
  }

  compute(x: number): number {
    return this.scalar_transform(...this.values, x, require, {})
  }

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    return this.vector_transform(...this.values, xs, require, {})
  }
}
CustomJSTransform.initClass()
