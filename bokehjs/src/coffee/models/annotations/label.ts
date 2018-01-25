/* XXX: partial */
import {TextAnnotation, TextAnnotationView} from "./text_annotation";
import {SpatialUnits, AngleUnits, RenderMode} from "core/enums"
import {hide} from "core/dom";
import * as p from "core/properties"

export class LabelView extends TextAnnotationView {
  model: Label

  initialize(options: any): void {
    super.initialize(options);
    this.visuals.warm_cache(null);
  }

  _get_size() {
    const { ctx } = this.plot_view.canvas_view;
    this.visuals.text.set_value(ctx);

    if (this.model.panel.is_horizontal) {
      const height = ctx.measureText(this.model.text).ascent;
      return height;
    } else {
      const { width } = ctx.measureText(this.model.text);
      return width;
    }
  }

  render() {
    let angle;
    if (!this.model.visible && (this.model.render_mode === 'css')) {
      hide(this.el);
    }
    if (!this.model.visible) {
      return;
    }

    // Here because AngleSpec does units tranform and label doesn't support specs
    switch (this.model.angle_units) {
      case "rad": angle = -1 * this.model.angle; break;
      case "deg": angle = (-1 * this.model.angle * Math.PI)/180.0; break;
    }

    const panel = this.model.panel != null ? this.model.panel : this.plot_view.frame;

    const xscale = this.plot_view.frame.xscales[this.model.x_range_name];
    const yscale = this.plot_view.frame.yscales[this.model.y_range_name];

    let sx = this.model.x_units === "data" ? xscale.compute(this.model.x) : panel.xview.compute(this.model.x);
    let sy = this.model.y_units === "data" ? yscale.compute(this.model.y) : panel.yview.compute(this.model.y);

    sx += this.model.x_offset;
    sy -= this.model.y_offset;

    const draw = this.model.render_mode === 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this);
    return draw(this.plot_view.canvas_view.ctx, this.model.text, sx, sy, angle);
  }
}

export namespace Label {
  export interface Attrs extends TextAnnotation.Attrs {
    x: number
    x_units: SpatialUnits
    y: number
    y_units: SpatialUnits
    text: string
    angle: number
    angle_units: AngleUnits
    x_offset: number
    y_offset: number
    x_range_name: string
    y_range_name: string
    render_mode: RenderMode
  }
}

export interface Label extends TextAnnotation, Label.Attrs {}

export class Label extends TextAnnotation {

  static initClass() {
    this.prototype.type = 'Label';
    this.prototype.default_view = LabelView;

    this.mixins(['text', 'line:border_', 'fill:background_']);

    this.define({
      x:            [ p.Number,                      ],
      x_units:      [ p.SpatialUnits, 'data'         ],
      y:            [ p.Number,                      ],
      y_units:      [ p.SpatialUnits, 'data'         ],
      text:         [ p.String,                      ],
      angle:        [ p.Angle,       0               ],
      angle_units:  [ p.AngleUnits,  'rad'           ],
      x_offset:     [ p.Number,      0               ],
      y_offset:     [ p.Number,      0               ],
      x_range_name: [ p.String,      'default'       ],
      y_range_name: [ p.String,      'default'       ],
      render_mode:  [ p.RenderMode,  'canvas'        ],
    });

    this.override({
      background_fill_color: null,
      border_line_color: null,
    });
  }
}
Label.initClass();
