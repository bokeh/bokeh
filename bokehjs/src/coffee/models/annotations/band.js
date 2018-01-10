import {Annotation, AnnotationView} from "./annotation";
import {ColumnDataSource} from "../sources/column_data_source";

import * as p from "core/properties"
;

export class BandView extends AnnotationView {
  initialize(options: any): void {
    super.initialize(options);
    this.set_data(this.model.source);
  }

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.source.streaming, () => this.set_data(this.model.source))
    this.connect(this.model.source.patching, () => this.set_data(this.model.source))
    this.connect(this.model.source.change, () => this.set_data(this.model.source))
  }

  set_data(source) {
    super.set_data(source);
    this.visuals.warm_cache(source);
    return this.plot_view.request_render();
  }

  _map_data() {
    let _base_sx, _lower_sx, _upper_sx;
    const { frame } = this.plot_view;
    const dim = this.model.dimension;

    const xscale = frame.xscales[this.model.x_range_name];
    const yscale = frame.yscales[this.model.y_range_name];

    const limit_scale = dim === "height" ? yscale : xscale;
    const base_scale  = dim === "height" ? xscale : yscale;

    const limit_view = dim === "height" ? frame.yview : frame.xview;
    const base_view  = dim === "height" ? frame.xview : frame.yview;

    if (this.model.lower.units === "data") {
      _lower_sx = limit_scale.v_compute(this._lower);
    } else {
      _lower_sx = limit_view.v_compute(this._lower);
    }

    if (this.model.upper.units === "data") {
      _upper_sx = limit_scale.v_compute(this._upper);
    } else {
      _upper_sx = limit_view.v_compute(this._upper);
    }

    if (this.model.base.units  === "data") {
      _base_sx  = base_scale.v_compute(this._base);
    } else {
      _base_sx  = base_view.v_compute(this._base);
    }

    const [i, j] = dim === 'height' ? [1, 0] : [0, 1];

    const _lower = [_lower_sx, _base_sx];
    const _upper = [_upper_sx, _base_sx];

    this._lower_sx = _lower[i];
    this._lower_sy = _lower[j];

    this._upper_sx = _upper[i];
    return this._upper_sy = _upper[j];
  }

  render() {
    let i;
    let asc, end;
    let asc1, start;
    let asc2, end1;
    let asc3, end2;
    if (!this.model.visible) {
      return;
    }

    this._map_data();

    const { ctx } = this.plot_view.canvas_view;

    // Draw the band body
    ctx.beginPath();
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0]);

    for (i = 0, end = this._lower_sx.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i]);
    }
    // iterate backwards so that the upper end is below the lower start
    for (start = this._upper_sx.length-1, i = start, asc1 = start <= 0; asc1 ? i <= 0 : i >= 0; asc1 ? i++ : i--) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i]);
    }

    ctx.closePath();

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx);
      ctx.fill();
    }

    // Draw the lower band edge
    ctx.beginPath();
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0]);
    for (i = 0, end1 = this._lower_sx.length, asc2 = 0 <= end1; asc2 ? i < end1 : i > end1; asc2 ? i++ : i--) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i]);
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx);
      ctx.stroke();
    }

    // Draw the upper band edge
    ctx.beginPath();
    ctx.moveTo(this._upper_sx[0], this._upper_sy[0]);
    for (i = 0, end2 = this._upper_sx.length, asc3 = 0 <= end2; asc3 ? i < end2 : i > end2; asc3 ? i++ : i--) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i]);
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx);
      return ctx.stroke();
    }
  }
}

export class Band extends Annotation {
  static initClass() {
    this.prototype.default_view = BandView;
    this.prototype.type = 'Band';

    this.mixins(['line', 'fill']);

    this.define({
      lower:        [ p.DistanceSpec                    ],
      upper:        [ p.DistanceSpec                    ],
      base:         [ p.DistanceSpec                    ],
      dimension:    [ p.Dimension,    'height'          ],
      source:       [ p.Instance,     () => new ColumnDataSource()  ],
      x_range_name: [ p.String,       'default'         ],
      y_range_name: [ p.String,       'default'         ]
    });

    this.override({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3
    });
  }
}
Band.initClass();
