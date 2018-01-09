/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as p from "core/properties";
import {values} from "core/util/object";
import {Model} from "../../model"
;

export class CustomJS extends Model {
  static initClass() {
    this.prototype.type = 'CustomJS';

    this.define({
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ]
    });

    this.getters({
      values() { return this._make_values(); },
      func() { return this._make_func(); }
    });
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
