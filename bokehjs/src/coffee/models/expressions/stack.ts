/* XXX: partial */
import {Expression} from "./expression";
import * as p from "core/properties"

export class Stack extends Expression {
  static initClass() {
    this.define({
      fields: [ p.Array, [] ],
    });
  }

  v_compute(source) {
    const result = new Float64Array(source.get_length());
    for (const f of this.fields) {
      for (let i = 0; i < source.data[f].length; i++) {
        const x = source.data[f][i];
        result[i] += x;
      }
    }
    return result;
  }
}
Stack.initClass();
