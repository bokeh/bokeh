/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties";
import {get_text_height} from "core/util/text"
;

export class TextView extends XYGlyphView {

  _render(ctx, indices, {sx, sy, _x_offset, _y_offset, _angle, _text}) {
    return (() => {
      const result = [];
      for (let i of Array.from(indices)) {
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
            var y;
            const lines = text.split("\n");

            const font = this.visuals.text.cache_select("font", i);
            const {height} = get_text_height(font);
            const line_height = this.visuals.text.text_line_height.value()*height;
            const block_height = line_height*lines.length;

            const baseline = this.visuals.text.cache_select("text_baseline", i);
            switch (baseline) {
              case "top":
                y = 0;
                break;
              case "middle":
                y = (-block_height/2) + (line_height/2);
                break;
              case "bottom":
                y = -block_height + line_height;
                break;
              default:
                y = 0;
                console.warn(`'${baseline}' baseline not supported with multi line text`);
            }

            for (let line of Array.from(lines)) {
              ctx.fillText(line, 0, y);
              y += line_height;
            }
          }

          result.push(ctx.restore());
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
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
