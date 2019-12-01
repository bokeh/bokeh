import {Model} from "../../../model"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJSHover {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomJSHover extends CustomJSHover.Attrs {}

export class CustomJSHover extends Model {
  properties: CustomJSHover.Props

  constructor(attrs?: Partial<CustomJSHover.Attrs>) {
    super(attrs)
  }

  static init_CustomJSHover(): void {
    this.define<CustomJSHover.Props>({
      args: [ p.Any,    {} ], // TODO (bev) better type
      code: [ p.String, "" ],
    })
  }

  get values(): any[] {
    return values(this.args)
  }

  /*protected*/ _make_code(valname: string, formatname: string, varsname: string, fn: string): Function {
    // this relies on keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...keys(this.args), valname, formatname, varsname, use_strict(fn))
  }

  format(value: any, format: string, special_vars: {[key: string]: unknown}): string {
    const formatter = this._make_code("value", "format", "special_vars", this.code)
    return formatter(...this.values, value, format, special_vars)
  }

}
