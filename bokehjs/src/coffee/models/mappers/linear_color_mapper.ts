/* XXX: partial */
import {ContinuousColorMapper} from "./continuous_color_mapper"
import {color2hex} from "core/util/color"
import {min, max} from "core/util/array"

export namespace LinearColorMapper {
  export interface Attrs extends ContinuousColorMapper.Attrs {}

  export interface Props extends ContinuousColorMapper.Props {}
}

export interface LinearColorMapper extends LinearColorMapper.Attrs {}

export class LinearColorMapper extends ContinuousColorMapper {

  properties: LinearColorMapper.Props

  constructor(attrs?: Partial<LinearColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LinearColorMapper";
  }

  initialize(): void {
    super.initialize();
    this._nan_color = this._build_palette([color2hex(this.nan_color)])[0];
    this._high_color = (this.high_color != null) ? this._build_palette([color2hex(this.high_color)])[0] : undefined;
    this._low_color = (this.low_color != null) ? this._build_palette([color2hex(this.low_color)])[0] : undefined;
  }

  _get_values(data: number[], palette: number[], image_glyph: boolean = false): number[] {
    const low = this.low != null ? this.low : min(data);
    const high = this.high != null ? this.high : max(data);
    const max_key = palette.length - 1;
    const values = [];

    const nan_color = image_glyph ? this._nan_color : this.nan_color;
    const low_color = image_glyph ? this._low_color : this.low_color;
    const high_color = image_glyph ? this._high_color : this.high_color;

    const norm_factor = 1 / (high - low);
    const normed_interval = 1 / palette.length;

    for (const d of data) {
      if (isNaN(d)) {
        values.push(nan_color);
        continue;
      }

      // This handles the edge case where d == high, since the code below maps
      // values exactly equal to high to palette.length, which is greater than
      // max_key
      if (d === high) {
        values.push(palette[max_key]);
        continue;
      }

      const normed_d = (d - low) * norm_factor;
      const key = Math.floor(normed_d / normed_interval);
      if (key < 0) {
        if (this.low_color != null) {
          values.push(low_color);
        } else {
          values.push(palette[0]);
        }
      } else if (key > max_key) {
        if (this.high_color != null) {
          values.push(high_color);
        } else {
          values.push(palette[max_key]);
        }
      } else {
        values.push(palette[key]);
      }
    }
    return values;
  }
}
LinearColorMapper.initClass();
