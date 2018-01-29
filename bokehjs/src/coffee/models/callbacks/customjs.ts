/* XXX: partial */
import * as p from "core/properties";
import {values} from "core/util/object";
import {Model} from "../../model"

export namespace CustomJS {
  export interface Attrs extends Model.Attrs {
    args: {[key: string]: any}
    code: string
  }

  export interface Opts extends Model.Opts {}
}

export interface CustomJS extends CustomJS.Attrs {}

export class CustomJS extends Model {

  constructor(attrs?: Partial<CustomJS.Attrs>, opts?: CustomJS.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'CustomJS';

    this.define({
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ],
    });
  }

  get values() {
    return this._make_values()
  }

  get func() {
    return this._make_func()
  }

  execute(cb_obj, cb_data) {
    return this.func.apply(cb_obj, this.values.concat(cb_obj, cb_data, require, {}));
  }

  _make_values() { return values(this.args); }

  _make_func() {
    // this relies on Object.keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...Object.keys(this.args), "cb_obj", "cb_data", "require", "exports", this.code);
  }
}
CustomJS.initClass();
