/* XXX: partial */
import {Transform} from "./transform";
import * as p from "core/properties";
import {values} from "core/util/object"

declare var exports: {[key: string]: any}

export namespace CustomJSTransform {
  export interface Attrs extends Transform.Attrs {
    args: {[key: string]: any}
    func: string
    v_func: string
  }

  export interface Opts extends Transform.Opts {}
}

export interface CustomJSTransform extends CustomJSTransform.Attrs {}

export class CustomJSTransform extends Transform {

  constructor(attrs?: Partial<CustomJSTransform.Attrs>, opts?: CustomJSTransform.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'CustomJSTransform';

    this.define({
      args:         [ p.Any,          {}       ], // TODO (bev) better type
      func:         [ p.String,       ""       ],
      v_func:       [ p.String,       ""       ],
    });
  }

  get values() {
    return this._make_values()
  }

  get scalar_transform() {
    return this._make_transform("x", this.func)
  }

  get vector_transform() {
    return this._make_transform("xs", this.v_func)
  }

  compute(x) { return this.scalar_transform(...this.values, x, require, exports); }

  v_compute(xs) { return this.vector_transform(...this.values, xs, require, exports); }

  _make_transform(val, fn) {
    // this relies on Object.keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...Object.keys(this.args), val, "require", "exports", fn);
  }

  _make_values() { return values(this.args); }
}
CustomJSTransform.initClass();
