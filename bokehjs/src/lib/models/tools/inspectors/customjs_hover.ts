import {Model} from "../../../model"
import type * as p from "core/properties"
import {use_strict} from "core/util/string"

export namespace CustomJSHover {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    args: p.Property<Map<string, unknown>>
    code: p.Property<string>
  }
}

export interface CustomJSHover extends CustomJSHover.Attrs {}

export class CustomJSHover extends Model {
  declare properties: CustomJSHover.Props

  constructor(attrs?: Partial<CustomJSHover.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSHover.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), new Map() ],
      code: [ String, "" ],
    }))
  }

  get keys(): Iterable<string> {
    return this.args.keys()
  }
  get values(): Iterable<unknown> {
    return this.args.values()
  }

  /*protected*/ _make_code(valname: string, formatname: string, varsname: string, fn: string): Function {
    // this relies on keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...this.keys, valname, formatname, varsname, use_strict(fn))
  }

  format(value: unknown, format: string, special_vars: {[key: string]: unknown}): string {
    const formatter = this._make_code("value", "format", "special_vars", this.code)
    return formatter(...this.values, value, format, special_vars)
  }
}
