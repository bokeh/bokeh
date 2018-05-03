import {Model} from "../../../model"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

declare var exports: {[key: string]: any}

export namespace CustomJSHover {
  export interface Attrs extends Model.Attrs {
    args: {[key: string]: any}
    code: string
  }

  export interface Props extends Model.Props {}
}

export interface CustomJSHover extends CustomJSHover.Attrs {}

export class CustomJSHover extends Model {

  properties: CustomJSHover.Props

  constructor(attrs?: Partial<CustomJSHover.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CustomJSHover'

    this.define({
      args: [ p.Any,    {} ], // TODO (bev) better type
      code: [ p.String, "" ],
    })
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_code(valname: string, formatname: string, varsname: string, fn: string): Function {
    // this relies on keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...keys(this.args), valname, formatname, varsname, "require", "exports", use_strict(fn))
  }

  format(value: any, format: string, special_vars: {[key: string]: any}): string {
    const formatter = this._make_code("value", "format", "special_vars", this.code)
    return formatter(...this.values, value, format, special_vars, require, exports)
  }

}
CustomJSHover.initClass()
