import {Filter} from "./filter"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {DataSource} from "../sources/data_source"

export namespace CustomJSFilter {
  export interface Attrs extends Filter.Attrs {
    args: {[key: string]: any}
    code: string
  }

  export interface Props extends Filter.Props {}
}

export interface CustomJSFilter extends CustomJSFilter.Attrs {}

export class CustomJSFilter extends Filter {

  properties: CustomJSFilter.Props

  constructor(attrs?: Partial<CustomJSFilter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CustomJSFilter'

    this.define({
      args: [ p.Any,    {} ], // TODO (bev) better type
      code: [ p.String, '' ],
    })
  }

  get values(): any[] {
    return values(this.args)
  }

  get func(): Function {
    // this relies on keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...keys(this.args), "source", "require", "exports", this.code)
  }

  compute_indices(source: DataSource): number[] | null {
    this.filter = this.func(...this.values, source, require, {})
    return super.compute_indices(source)
  }
}
CustomJSFilter.initClass()
