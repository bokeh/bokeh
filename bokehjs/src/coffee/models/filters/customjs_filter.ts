/* XXX: partial */
import {Filter} from "./filter";
import * as p from "core/properties";
import {values} from "core/util/object"

export namespace CustomJSFilter {
  export interface Attrs extends Filter.Attrs {
    args: {[key: string]: any}
    code: string
  }
}

export interface CustomJSFilter extends CustomJSFilter.Attrs {}

export class CustomJSFilter extends Filter {

  static initClass() {
    this.prototype.type = 'CustomJSFilter';

    this.define({
      args: [ p.Any,    {} ], // TODO (bev) better type
      code: [ p.String, '' ],
    });
  }

  get values() {
    return this._make_values()
  }

  get func() {
    return this._make_func()
  }

  compute_indices(source): any {
    this.filter = this.func(...this.values, source, require, {});
    return super.compute_indices(source);
  }

  _make_values() { return values(this.args); }

  _make_func() {
    // this relies on Object.keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...Object.keys(this.args), "source", "require", "exports", this.code);
  }
}
CustomJSFilter.initClass();
