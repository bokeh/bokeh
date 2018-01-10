/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Filter} from "./filter";
import * as p from "core/properties";
import {values} from "core/util/object"
;

export class CustomJSFilter extends Filter {
  static initClass() {
    this.prototype.type = 'CustomJSFilter';

    this.define({
        args: [ p.Any,    {} ], // TODO (bev) better type
        code: [ p.String, '' ]
    });

    this.getters({
      values() { return this._make_values(); },
      func() { return this._make_func(); }
    });
  }

  compute_indices(source) {
    this.filter = this.func(...Array.from(this.values), source, require, {});
    return super.compute_indices();
  }

  _make_values() { return values(this.args); }

  _make_func() {
    // this relies on Object.keys(args) and values(args) returning keys and values
    // in the same order
    return new Function(...Array.from(Object.keys(this.args)), "source", "require", "exports", this.code);
  }
}
CustomJSFilter.initClass();
