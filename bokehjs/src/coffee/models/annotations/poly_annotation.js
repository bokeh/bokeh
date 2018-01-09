/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Annotation, AnnotationView} from "./annotation";
import {Signal} from "core/signaling";
import * as p from "core/properties"
;

export class PolyAnnotationView extends AnnotationView {

  connect_signals(): void {
    super.connect_signals();
    // need to respond to either normal BB change events or silent
    // "data only updates" that tools might want to use
    this.connect(this.model.change, () => this.plot_view.request_render());
    this.connect(this.model.data_update, () => this.plot_view.request_render());
  }

  render(ctx) {
    if (!this.model.visible) {
      return;
    }

    const { xs } = this.model;
    const { ys } = this.model;

    if (xs.length !== ys.length) {
      return null;
    }

    if ((xs.length < 3) || (ys.length < 3)) {
      return null;
    }

    const { frame } = this.plot_view;
    ({ ctx } = this.plot_view.canvas_view);

    for (let i = 0, end = xs.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      var sx, sy;
      if (this.model.xs_units === 'screen') {
        sx = this.model.screen ? xs[i] : frame.xview.compute(xs[i]);
      }
      if (this.model.ys_units === 'screen') {
        sy = this.model.screen ? ys[i] : frame.yview.compute(ys[i]);
      }
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }

    ctx.closePath();

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx);
      ctx.stroke();
    }

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx);
      return ctx.fill();
    }
  }
}

export class PolyAnnotation extends Annotation {
  static initClass() {
    this.prototype.default_view = PolyAnnotationView;

    this.prototype.type = "PolyAnnotation";

    this.mixins(['line', 'fill']);

    this.define({
        xs:           [ p.Array,        []        ],
        xs_units:     [ p.SpatialUnits, 'data'    ],
        ys:           [ p.Array,        []        ],
        ys_units:     [ p.SpatialUnits, 'data'    ],
        x_range_name: [ p.String,       'default' ],
        y_range_name: [ p.String,       'default' ]
    });

    this.internal({
      screen: [ p.Boolean, false ]
    });

    this.override({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3
    });
  }

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options);
    this.data_update = new Signal(this, "data_update");
  }

  update({xs, ys}) {
    this.setv({xs, ys, screen: true}, {silent: true});
    return this.data_update.emit();
  }
}
PolyAnnotation.initClass();
