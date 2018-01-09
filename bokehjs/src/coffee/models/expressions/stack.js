/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Expression} from "./expression";
import * as p from "core/properties"
;

export class Stack extends Expression {
  static initClass() {
    this.define({
      fields: [ p.Array, [] ]
    });
  }

  v_compute(source) {
    const result = new Float64Array(source.get_length());
    for (let f of this.fields) {
      for (let i = 0; i < source.data[f].length; i++) {
        const x = source.data[f][i];
        result[i] += x;
      }
    }
    return result;
  }
}
Stack.initClass();
