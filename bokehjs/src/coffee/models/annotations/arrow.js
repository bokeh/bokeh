import {Annotation, AnnotationView} from "./annotation";
import {OpenHead} from "./arrow_head";
import {ColumnDataSource} from "../sources/column_data_source";
import * as p from "core/properties";
import {atan2} from "core/util/math"

export class ArrowView extends AnnotationView {

  initialize(options: any): void {
    super.initialize(options);
    if ((this.model.source == null)) {
      this.model.source = new ColumnDataSource();
    }
    this.set_data(this.model.source);
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_render())
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
    let sx_end, sx_start, sy_end, sy_start;
    const { frame } = this.plot_view;

    if (this.model.start_units === 'data') {
      sx_start = frame.xscales[this.model.x_range_name].v_compute(this._x_start);
      sy_start = frame.yscales[this.model.y_range_name].v_compute(this._y_start);
    } else {
      sx_start = frame.xview.v_compute(this._x_start);
      sy_start = frame.yview.v_compute(this._y_start);
    }

    if (this.model.end_units === 'data') {
      sx_end = frame.xscales[this.model.x_range_name].v_compute(this._x_end);
      sy_end = frame.yscales[this.model.y_range_name].v_compute(this._y_end);
    } else {
      sx_end = frame.xview.v_compute(this._x_end);
      sy_end = frame.yview.v_compute(this._y_end);
    }

    const start = [sx_start, sy_start];
    const end   = [sx_end,   sy_end  ];

    return [start, end];
  }

  render() {
    if (!this.model.visible) {
      return;
    }

    const { ctx } = this.plot_view.canvas_view;
    ctx.save();

    // Order in this function is important. First we draw all the arrow heads.
    [this.start, this.end] = this._map_data();
    if (this.model.end != null) { this._arrow_head(ctx, "render", this.model.end, this.start, this.end); }
    if (this.model.start != null) { this._arrow_head(ctx, "render", this.model.start, this.end, this.start); }

    // Next we call .clip on all the arrow heads, inside an initial canvas sized
    // rect, to create an "inverted" clip region for the arrow heads
    ctx.beginPath();
    const {x, y, width, height} = this.plot_model.canvas.bbox.rect;
    ctx.rect(x, y, width, height);
    if (this.model.end != null) { this._arrow_head(ctx, "clip", this.model.end, this.start, this.end); }
    if (this.model.start != null) { this._arrow_head(ctx, "clip", this.model.start, this.end, this.start); }
    ctx.closePath();
    ctx.clip();

    // Finally we draw the arrow body, with the clipping regions set up. This prevents
    // "fat" arrows from overlapping the arrow head in a bad way.
    this._arrow_body(ctx);

    return ctx.restore();
  }

  _arrow_body(ctx) {
    if (!this.visuals.line.doit)
      return;

    for (let i = 0, end = this._x_start.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      this.visuals.line.set_vectorize(ctx, i);

      ctx.beginPath();
      ctx.moveTo(this.start[0][i], this.start[1][i]);
      ctx.lineTo(this.end[0][i], this.end[1][i]);
      ctx.stroke();
    }
  }

  _arrow_head(ctx, action, head, start, end) {
    for (let i = 0, end1 = this._x_start.length, asc = 0 <= end1; asc ? i < end1 : i > end1; asc ? i++ : i--) {
      // arrow head runs orthogonal to arrow body
      const angle = (Math.PI/2) + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]]);

      ctx.save();

      ctx.translate(end[0][i], end[1][i]);
      ctx.rotate(angle);

      if (action === "render") {
        head.render(ctx);
      } else if (action === "clip") {
        head.clip(ctx);
      }

      ctx.restore();
    }
  }
}

export class Arrow extends Annotation {
  static initClass() {
    this.prototype.default_view = ArrowView;

    this.prototype.type = 'Arrow';

    this.mixins(['line']);

    this.define({
        x_start:      [ p.NumberSpec,                   ],
        y_start:      [ p.NumberSpec,                   ],
        start_units:  [ p.String,      'data'           ],
        start:        [ p.Instance,    null             ],
        x_end:        [ p.NumberSpec,                   ],
        y_end:        [ p.NumberSpec,                   ],
        end_units:    [ p.String,      'data'           ],
        end:          [ p.Instance,    () => new OpenHead({}) ],
        source:       [ p.Instance                      ],
        x_range_name: [ p.String,      'default'        ],
        y_range_name: [ p.String,      'default'        ]
    });
  }
}
Arrow.initClass();
