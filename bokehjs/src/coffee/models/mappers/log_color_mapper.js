import * as p from "core/properties";

import {color2hex} from "core/util/color";
import {min, max} from "core/util/array";
import {ColorMapper} from "./color_mapper"

// Math.log1p() is not supported by any version of IE, so let's use a polyfill based on
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p.
const log1p = Math.log1p != null ? Math.log1p : x => Math.log(1 + x);

export class LogColorMapper extends ColorMapper {
  static initClass() {
    this.prototype.type = "LogColorMapper";

    this.define({
        high:       [ p.Number ],
        low:        [ p.Number ],
        high_color: [ p.Color  ],
        low_color:  [ p.Color  ]
      });
  }

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options);
    this._nan_color = this._build_palette([color2hex(this.nan_color)])[0];
    this._high_color = (this.high_color != null) ? this._build_palette([color2hex(this.high_color)])[0] : undefined;
    this._low_color = (this.low_color != null) ? this._build_palette([color2hex(this.low_color)])[0] : undefined;
  }

  _get_values(data, palette, image_glyph) {
    if (image_glyph == null) { image_glyph = false; }
    const n = palette.length;
    const low = this.low != null ? this.low : min(data);
    const high = this.high != null ? this.high : max(data);
    const scale = n / (log1p(high) - log1p(low));  // subtract the low offset
    const max_key = palette.length - 1;
    const values = [];

    const nan_color = image_glyph ? this._nan_color : this.nan_color;
    const high_color = image_glyph ? this._high_color : this.high_color;
    const low_color = image_glyph ? this._low_color : this.low_color;

    for (let d of data) {
      // Check NaN
      if (isNaN(d)) {
        values.push(nan_color);
        continue;
      }

      if (d > high) {
        if (this.high_color != null) {
          values.push(high_color);
        } else {
          values.push(palette[max_key]);
        }
        continue;
      }

      // This handles the edge case where d == high, since the code below maps
      // values exactly equal to high to palette.length, which is greater than
      // max_key
      if (d === high) {
        values.push(palette[max_key]);
        continue;
      }

      if (d < low) {
        if (this.low_color != null) {
          values.push(low_color);
        } else {
          values.push(palette[0]);
        }
        continue;
      }

      // Get the key
      const log = log1p(d) - log1p(low);  // subtract the low offset
      let key = Math.floor(log * scale);

      // Deal with upper bound
      if (key > max_key) {
        key = max_key;
      }

      values.push(palette[key]);
    }
    return values;
  }
}
LogColorMapper.initClass();
