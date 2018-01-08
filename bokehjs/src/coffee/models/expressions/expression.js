/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model"
;

export class Expression extends Model {

  initialize(attrs, options) {
    super.initialize(attrs, options);
    this._connected= {};
    return this._result = {};
  }

  _v_compute(source) {
    if ((this._connected[source.id] == null)) {
      this.connect(source.change, function() { return this._result[source.id] = null; });
      this._connected[source.id] = true;
    }

    if (this._result[source.id] != null) {
      return this._result[source.id];
    }

    this._result[source.id] = this.v_compute(source);
    return this._result[source.id];
  }
}
