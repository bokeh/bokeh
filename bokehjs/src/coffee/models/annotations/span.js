/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Annotation, AnnotationView} from "./annotation";
import {show, hide} from "core/dom";
import * as p from "core/properties"
;

export class SpanView extends AnnotationView {

  initialize(options) {
    super.initialize(options);
    this.plot_view.canvas_overlays.appendChild(this.el);
    this.el.style.position = "absolute";
    return hide(this.el);
  }

  connect_signals(): void {
    super.connect_signals();
    if (this.model.for_hover) {
      this.connect(this.model.properties.computed_location.change, () => this._draw_span())
    } else {
      if (this.model.render_mode === 'canvas') {
        this.connect(this.model.change, () => this.plot_view.request_render());
        this.connect(this.model.properties.location.change, () => this.plot_view.request_render());
      } else {
        this.connect(this.model.change, () => this.render())
        this.connect(this.model.properties.location.change, () => this._draw_span())
      }
    }
  }

  render() {
    if (!this.model.visible && (this.model.render_mode === 'css')) {
      hide(this.el);
    }
    if (!this.model.visible) {
      return;
    }
    return this._draw_span();
  }

  _draw_span() {
    let height, sleft, stop, width;
    const loc = this.model.for_hover ? this.model.computed_location : this.model.location;
    if ((loc == null)) {
      hide(this.el);
      return;
    }

    const { frame } = this.plot_view;

    const xscale = frame.xscales[this.model.x_range_name];
    const yscale = frame.yscales[this.model.y_range_name];

    const _calc_dim = (scale, view) => {
      if (this.model.for_hover) {
        return this.model.computed_location;
      } else {
        if (this.model.location_units === 'data') {
          return scale.compute(loc);
        } else {
          return view.compute(loc);
        }
      }
    };

    if (this.model.dimension === 'width') {
      stop = _calc_dim(yscale, frame.yview);
      sleft = frame._left.value;
      width = frame._width.value;
      height = this.model.properties.line_width.value();
    } else {
      stop = frame._top.value;
      sleft = _calc_dim(xscale, frame.xview);
      width = this.model.properties.line_width.value();
      height = frame._height.value;
    }

    if (this.model.render_mode === "css") {
      this.el.style.top = `${stop}px`;
      this.el.style.left = `${sleft}px`;
      this.el.style.width = `${width}px`;
      this.el.style.height = `${height}px`;
      this.el.style.zIndex = 1000;
      this.el.style.backgroundColor = this.model.properties.line_color.value();
      this.el.style.opacity = this.model.properties.line_alpha.value();
      return show(this.el);

    } else if (this.model.render_mode === "canvas") {
      const { ctx } = this.plot_view.canvas_view;
      ctx.save();

      ctx.beginPath();
      this.visuals.line.set_value(ctx);
      ctx.moveTo(sleft, stop);
      if (this.model.dimension === "width") {
        ctx.lineTo(sleft + width, stop);
      } else {
        ctx.lineTo(sleft, stop + height);
      }
      ctx.stroke();

      return ctx.restore();
    }
  }
}

export class Span extends Annotation {

  computed_location: number | null

  static initClass() {

    this.prototype.default_view = SpanView;

    this.prototype.type = 'Span';

    this.mixins(['line']);

    this.define({
        render_mode:    [ p.RenderMode,   'canvas'  ],
        x_range_name:   [ p.String,       'default' ],
        y_range_name:   [ p.String,       'default' ],
        location:       [ p.Number,       null      ],
        location_units: [ p.SpatialUnits, 'data'    ],
        dimension:      [ p.Dimension,    'width'   ]
    });

    this.override({
      line_color: 'black'
    });

    this.internal({
      for_hover: [ p.Boolean, false ],
      computed_location: [ p.Number, null ] // absolute screen coordinate
    });
  }
}
Span.initClass();
