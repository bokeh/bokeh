import {Callback} from "./callback"
import * as p from "core/properties"
import {keys, values} from "core/util/object"

export namespace CustomJS {
  export interface Attrs extends Callback.Attrs {
    args: {[key: string]: any}
    code: string
  }

  export interface Props extends Callback.Props {}
}

export interface CustomJS extends CustomJS.Attrs {}

export class CustomJS extends Callback {

  properties: CustomJS.Props

  constructor(attrs?: Partial<CustomJS.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CustomJS'

    this.define({
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  get func(): Function {
    // this relies on keys(args) and values(args) returning keys and values in the same order
    return new Function(...this.names, "cb_obj", "cb_data", "require", "exports", this.code)
  }

  execute(cb_obj: any, cb_data: {[key: string]: any}): any {
    return this.func.apply(cb_obj, this.values.concat(cb_obj, cb_data, require, {}))
  }
}
CustomJS.initClass()
