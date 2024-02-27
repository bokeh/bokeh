import {Transform} from "./transform"
import type * as p from "core/properties"
import type {Arrayable, Dict} from "core/types"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJSTransform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    args: p.Property<Dict<unknown>>
    func: p.Property<string>
    v_func: p.Property<string>
  }
}

export interface CustomJSTransform extends CustomJSTransform.Attrs {}

export class CustomJSTransform extends Transform {
  declare properties: CustomJSTransform.Props

  constructor(attrs?: Partial<CustomJSTransform.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSTransform.Props>(({Unknown, Str, Dict}) => ({
      args:   [ Dict(Unknown), {} ],
      func:   [ Str, "" ],
      v_func: [ Str, "" ],
    }))
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): unknown[] {
    return values(this.args)
  }

  protected _make_transform(name: string, func: string): Function {
    return new Function(...this.names, name, use_strict(func))
  }

  get scalar_transform(): Function {
    return this._make_transform("x", this.func)
  }

  get vector_transform(): Function {
    return this._make_transform("xs", this.v_func)
  }

  compute(x: number): number {
    return this.scalar_transform(...this.values, x)
  }

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    return this.vector_transform(...this.values, xs)
  }
}
