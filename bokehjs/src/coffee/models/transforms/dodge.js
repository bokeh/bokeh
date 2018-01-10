/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Transform} from "./transform";
import * as p from "core/properties"

export class Dodge extends Transform {
  static initClass() {
    this.define({
      value: [ p.Number,  0 ],
      range: [ p.Instance   ]
    });
  }

  compute(x, use_synthetic) {
    if (use_synthetic == null) { use_synthetic = true; }
    if (((this.range != null ? this.range.synthetic : undefined) != null) && use_synthetic) {
      x = this.range.synthetic(x);
    }
    return x + this.value;
  }
}
Dodge.initClass();
