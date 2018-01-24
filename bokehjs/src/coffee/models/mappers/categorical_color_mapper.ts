/* XXX: partial */
import {ColorMapper} from "./color_mapper";

import * as p from "core/properties";
import {findIndex} from "core/util/array";
import {isString} from "core/util/types"

const _equals = function(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0, end = a.length; i < end; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export class CategoricalColorMapper extends ColorMapper {
  static initClass() {
    this.prototype.type = "CategoricalColorMapper";

    this.define({
      factors: [ p.Array     ],
      start:   [ p.Number, 0 ],
      end:     [ p.Number    ],
    });
  }

  _get_values(data, palette) {
    const values = [];

    for (let d of data) {
      let color, key;

      if (isString(d)) {
        key = this.factors.indexOf(d);
      } else {
        if (this.start != null) {
          if (this.end != null) {
            d = d.slice(this.start, this.end);
          } else {
            d = d.slice(this.start);
          }
        } else if (this.end != null) {
          d = d.slice(0, this.end);
        }
        if (d.length === 1) {
          key = this.factors.indexOf(d[0]);
        } else {
          key = findIndex(this.factors, x => _equals(x, d));
        }
      }

      if ((key < 0) || (key >= palette.length)) {
        color = this.nan_color;
      } else {
        color = palette[key];
      }

      values.push(color);
    }
    return values;
  }
}
CategoricalColorMapper.initClass();
