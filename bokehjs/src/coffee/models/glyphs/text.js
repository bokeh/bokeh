import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties";
import {get_text_height} from "core/util/text"
;

export class TextView extends XYGlyphView {

  _render(ctx, indices, {sx, sy, _x_offset, _y_offset, _angle, _text}) {
    for (let i of indices) {
      if (isNaN(sx[i]+sy[i]+_x_offset[i]+_y_offset[i]+_angle[i]) || (_text[i] == null)) {
        continue;
      }

      if (this.visuals.text.doit) {
        const text = `${_text[i]}`;

        ctx.save();
        ctx.translate(sx[i] + _x_offset[i], sy[i] + _y_offset[i]);
        ctx.rotate(_angle[i]);
        this.visuals.text.set_vectorize(ctx, i);

        if (text.indexOf("\n") === -1) {
          ctx.fillText(text, 0, 0);
        } else {
          const lines = text.split("\n");

          const font = this.visuals.text.cache_select("font", i);
          const {height} = get_text_height(font);
          const line_height = this.visuals.text.text_line_height.value()*height;
          const block_height = line_height*lines.length;

          const baseline = this.visuals.text.cache_select("text_baseline", i);
          let y;
          switch (baseline) {
            case "top": {
              y = 0;
              break;
            }
            case "middle": {
              y = (-block_height/2) + (line_height/2);
              break;
            }
            case "bottom": {
              y = -block_height + line_height;
              break;
            }
            default: {
              y = 0;
              console.warn(`'${baseline}' baseline not supported with multi line text`);
            }
          }

          for (let line of lines) {
            ctx.fillText(line, 0, y);
            y += line_height;
          }
        }

        ctx.restore();
      }
    }
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return null;
  }
}

export class Text extends XYGlyph {
  static initClass() {
    this.prototype.default_view = TextView;
    this.prototype.type = 'Text';

    this.mixins(['text']);
    this.define({
      text:     [ p.StringSpec, {field: "text"} ],
      angle:    [ p.AngleSpec,  0               ],
      x_offset: [ p.NumberSpec, 0               ],
      y_offset: [ p.NumberSpec, 0               ]
    });
  }
}
Text.initClass();
