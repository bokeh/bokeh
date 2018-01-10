import {TextAnnotation, TextAnnotationView} from "./text_annotation";
import {hide} from "core/dom";
import * as p from "core/properties";
import * as Visuals from "core/visuals"

export class TitleView extends TextAnnotationView {

  initialize(options: any): void {
    super.initialize(options);
    this.visuals.text = new Visuals.Text(this.model);
  }

  _get_location() {
    let sx, sy;
    const { panel } = this.model;

    const hmargin = this.model.offset;
    const vmargin = 5;

    switch (panel.side) {
      case 'above': case 'below':
        switch (this.model.vertical_align) {
          case 'top':    sy = panel._top.value     + vmargin; break;
          case 'middle': sy = panel._vcenter.value; break;
          case 'bottom': sy = panel._bottom.value  - vmargin; break;
        }

        switch (this.model.align) {
          case 'left':   sx = panel._left.value    + hmargin; break;
          case 'center': sx = panel._hcenter.value; break;
          case 'right':  sx = panel._right.value   - hmargin; break;
        }
        break;
      case 'left':
        switch (this.model.vertical_align) {
          case 'top':    sx = panel._left.value    - vmargin; break;
          case 'middle': sx = panel._hcenter.value; break;
          case 'bottom': sx = panel._right.value   + vmargin; break;
        }

        switch (this.model.align) {
          case 'left':   sy = panel._bottom.value  - hmargin; break;
          case 'center': sy = panel._vcenter.value; break;
          case 'right':  sy = panel._top.value     + hmargin; break;
        }
        break;
      case 'right':
        switch (this.model.vertical_align) {
          case 'top':    sx = panel._right.value   - vmargin; break;
          case 'middle': sx = panel._hcenter.value; break;
          case 'bottom': sx = panel._left.value    + vmargin; break;
        }

        switch (this.model.align) {
          case 'left':   sy = panel._top.value     + hmargin; break;
          case 'center': sy = panel._vcenter.value; break;
          case 'right':  sy = panel._bottom.value  - hmargin; break;
        }
        break;
    }

    return [sx, sy];
  }

  render() {
    if (!this.model.visible) {
      if (this.model.render_mode === 'css') {
        hide(this.el);
      }
      return;
    }

    const { text } = this.model;
    if ((text == null) || (text.length === 0)) {
      return;
    }

    this.model.text_baseline = this.model.vertical_align;
    this.model.text_align = this.model.align;

    const [sx, sy] = this._get_location();
    const angle = this.model.panel.get_label_angle_heuristic('parallel');

    const draw = this.model.render_mode === 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this);
    return draw(this.plot_view.canvas_view.ctx, text, sx, sy, angle);
  }

  _get_size() {
    const { text } = this.model;
    if ((text == null) || (text.length === 0)) {
      return 0;
    } else {
      const { ctx } = this.plot_view.canvas_view;
      this.visuals.text.set_value(ctx);
      return ctx.measureText(text).ascent + 10;
    }
  }
}

export class Title extends TextAnnotation {
  static initClass() {
    this.prototype.default_view = TitleView;

    this.prototype.type = 'Title';

    this.mixins(['line:border_', 'fill:background_']);

    this.define({
      text:            [ p.String,                    ],
      text_font:       [ p.Font,          'helvetica' ],
      text_font_size:  [ p.FontSizeSpec,  '10pt'      ],
      text_font_style: [ p.FontStyle,     'bold'      ],
      text_color:      [ p.ColorSpec,     '#444444'   ],
      text_alpha:      [ p.NumberSpec,    1.0         ],
      vertical_align:  [ p.VerticalAlign, 'bottom'    ],
      align:           [ p.TextAlign,     'left'      ],
      offset:          [ p.Number,        0           ],
      render_mode:     [ p.RenderMode,    'canvas'    ]
    });

    this.override({
      background_fill_color: null,
      border_line_color: null
    });

    this.internal({
      text_align:    [ p.TextAlign,    'left'  ],
      text_baseline: [ p.TextBaseline, 'bottom' ]
    });
  }
}
Title.initClass();
