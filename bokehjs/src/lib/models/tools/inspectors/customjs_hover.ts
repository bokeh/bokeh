import {Model} from "../../../model"
import * as p from "core/properties"
import {keys, values} from "core/util/object"

declare var exports: {[key: string]: any}

export namespace CustomJSHover {
  export interface Attrs extends Model.Attrs {
    args: {[key: string]: any}
    formatter: string
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
      args:      [ p.Any,    {} ], // TODO (bev) better type
      formatter: [ p.String, "" ],
    })
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_formatter(val: string, fn: string): Function {
    // this relies on keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...keys(this.args), val, "require", "exports", fn)
  }

  format(value: any): string {
    const formatter = this._make_formatter("value", this.formatter)
    return formatter(...this.values, value, require, exports)
  }

}
CustomJSHover.initClass()
