/* XXX: partial */
import {Expression} from "./expression";
import * as p from "core/properties"

export namespace Stack {
  export interface Attrs extends Expression.Attrs {
    fields: string[]
  }

  export interface Opts extends Expression.Opts {}
}

export interface Stack extends Stack.Attrs {}

export class Stack extends Expression {

  constructor(attrs?: Partial<Stack.Attrs>, opts?: Stack.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "Stack"

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
