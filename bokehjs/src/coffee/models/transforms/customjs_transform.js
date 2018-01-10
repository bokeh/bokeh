/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Transform} from "./transform";
import * as p from "core/properties";
import {values} from "core/util/object"

export class CustomJSTransform extends Transform {
  static initClass() {
    this.prototype.type = 'CustomJSTransform';

    this.define({
      args:         [ p.Any,          {}       ], // TODO (bev) better type
      func:         [ p.String,       ""       ],
      v_func:       [ p.String,       ""       ]
    });

    this.getters({
      values() { return this._make_values(); },
      scalar_transform() { return this._make_transform("x", this.func); },
      vector_transform() { return this._make_transform("xs", this.v_func); }
    });
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
