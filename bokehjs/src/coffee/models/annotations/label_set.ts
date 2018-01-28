/* XXX: partial */
import {TextAnnotation, TextAnnotationView} from "./text_annotation";
import {DataSource} from "../sources/data_source";
import {ColumnDataSource} from "../sources/column_data_source";
import {NumberSpec, AngleSpec, StringSpec} from "core/vectorization"
import {SpatialUnits, RenderMode} from "core/enums"
import {div, show, hide} from "core/dom";
import * as p from "core/properties";
import {isString, isArray} from "core/util/types"
import {range} from "core/util/array"
import {Context2d} from "core/util/canvas"

export class LabelSetView extends TextAnnotationView {
  model: LabelSet

  initialize(options: any): void {
    super.initialize(options);

    this.set_data(this.model.source);

    if (this.model.render_mode === 'css') {
      for (let i = 0, end = this._text.length; i < end; i++) {
        this.title_div = div({class: 'bk-annotation-child', style: {display: "none"}});
        this.el.appendChild(this.title_div);
      }
    }
  }

  connect_signals(): void {
    super.connect_signals();
    if (this.model.render_mode === 'css') {
      // dispatch CSS update immediately
      this.connect(this.model.change, () => {
        this.set_data(this.model.source);
        this.render();
      });
      this.connect(this.model.source.streaming, () => {
        this.set_data(this.model.source);
        this.render();
      });
      this.connect(this.model.source.patching, () => {
        this.set_data(this.model.source);
        this.render();
      });
      this.connect(this.model.source.change, () => {
        this.set_data(this.model.source);
        this.render();
      });
    } else {
      this.connect(this.model.change, () => {
        this.set_data(this.model.source);
        this.plot_view.request_render();
      });
      this.connect(this.model.source.streaming, () => {
        this.set_data(this.model.source);
        this.plot_view.request_render();
      });
      this.connect(this.model.source.patching, () => {
        this.set_data(this.model.source);
        this.plot_view.request_render();
      });
      this.connect(this.model.source.change, () => {
        this.set_data(this.model.source);
        this.plot_view.request_render();
      });
    }
  }

  set_data(source) {
    super.set_data(source);
    this.visuals.warm_cache(source);
  }

  _map_data() {
    const xscale = this.plot_view.frame.xscales[this.model.x_range_name];
    const yscale = this.plot_view.frame.yscales[this.model.y_range_name];

    const panel = this.model.panel != null ? this.model.panel : this.plot_view.frame;

    const sx = this.model.x_units === "data" ? xscale.v_compute(this._x) : panel.xview.v_compute(this._x);
    const sy = this.model.y_units === "data" ? yscale.v_compute(this._y) : panel.yview.v_compute(this._y);

    return [sx, sy];
  }

  render() {
    if (!this.model.visible && (this.model.render_mode === 'css')) {
      hide(this.el);
    }
    if (!this.model.visible) {
      return;
    }

    const draw = this.model.render_mode === 'canvas' ? this._v_canvas_text.bind(this) : this._v_css_text.bind(this);
    const { ctx } = this.plot_view.canvas_view;

    const [sx, sy] = this._map_data();

    return range(0, this._text.length).map((i) =>
      draw(ctx, i, this._text[i], sx[i] + this._x_offset[i], sy[i] - this._y_offset[i], this._angle[i]));
  }

  _get_size() {
    const { ctx } = this.plot_view.canvas_view;
    this.visuals.text.set_value(ctx);

    const { side } = this.model.panel;
    if ((side === "above") || (side === "below")) {
      const height = ctx.measureText(this._text[0]).ascent;
      return height;
    }
    if ((side === 'left') || (side === 'right')) {
      const { width } = ctx.measureText(this._text[0]);
      return width;
    }
  }

  _v_canvas_text(ctx: Context2d, i, text, sx, sy, angle) {
    this.visuals.text.set_vectorize(ctx, i);
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text);

    ctx.save();

    ctx.beginPath();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3]);

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_vectorize(ctx, i);
      ctx.fill();
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_vectorize(ctx, i);
      ctx.stroke();
    }

    if (this.visuals.text.doit) {
      this.visuals.text.set_vectorize(ctx, i);
      ctx.fillText(text, 0, 0);
    }

    return ctx.restore();
  }

  _v_css_text(ctx: Context2d, i, text, sx, sy, angle) {
    let line_dash;
    const el = this.el.childNodes[i];
    el.textContent = text;

    this.visuals.text.set_vectorize(ctx, i);
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text);

    // attempt to support vector-style ("8 4 8") line dashing for css mode
    const ld = this.visuals.border_line.line_dash.value();
    if (isArray(ld)) {
      line_dash = ld.length < 2 ? "solid" : "dashed";
    }
    if (isString(ld)) {
      line_dash = ld;
    }

    this.visuals.border_line.set_vectorize(ctx, i);
    this.visuals.background_fill.set_vectorize(ctx, i);

    el.style.position = 'absolute';
    el.style.left = `${sx + bbox_dims[0]}px`;
    el.style.top = `${sy + bbox_dims[1]}px`;
    el.style.color = `${this.visuals.text.text_color.value()}`;
    el.style.opacity = `${this.visuals.text.text_alpha.value()}`;
    el.style.font = `${this.visuals.text.font_value()}`;
    el.style.lineHeight = "normal"; // needed to prevent ipynb css override

    if (angle) {
      el.style.transform = `rotate(${angle}rad)`;
    }

    if (this.visuals.background_fill.doit) {
      el.style.backgroundColor = `${this.visuals.background_fill.color_value()}`;
    }

    if (this.visuals.border_line.doit) {
      el.style.borderStyle = `${line_dash}`;
      el.style.borderWidth = `${this.visuals.border_line.line_width.value()}px`;
      el.style.borderColor = `${this.visuals.border_line.color_value()}`;
    }

    return show(el);
  }
}

export namespace LabelSet {
  export interface Attrs extends TextAnnotation.Attrs {
    x: NumberSpec
    y: NumberSpec
    x_units: SpatialUnits
    y_units: SpatialUnits
    text: StringSpec
    angle: AngleSpec
    x_offset: NumberSpec
    y_offset: NumberSpec
    source: DataSource
    x_range_name: string
    y_range_name: string
    render_mode: RenderMode
  }

  export interface Opts extends TextAnnotation.Opts {}
}

export interface LabelSet extends LabelSet.Attrs {}

export class LabelSet extends TextAnnotation {

  static initClass() {
    this.prototype.type = 'LabelSet';
    this.prototype.default_view = LabelSetView;

    this.mixins(['text', 'line:border_', 'fill:background_']);

    this.define({
      x:            [ p.NumberSpec                      ],
      y:            [ p.NumberSpec                      ],
      x_units:      [ p.SpatialUnits, 'data'            ],
      y_units:      [ p.SpatialUnits, 'data'            ],
      text:         [ p.StringSpec,   { field: "text" } ],
      angle:        [ p.AngleSpec,    0                 ],
      x_offset:     [ p.NumberSpec,   { value: 0 }      ],
      y_offset:     [ p.NumberSpec,   { value: 0 }      ],
      source:       [ p.Instance,     () => new ColumnDataSource()  ],
      x_range_name: [ p.String,      'default'          ],
      y_range_name: [ p.String,      'default'          ],
      render_mode:  [ p.RenderMode,  'canvas'           ],
    });

    this.override({
      background_fill_color: null,
      border_line_color: null,
    });
  }
}
LabelSet.initClass();
