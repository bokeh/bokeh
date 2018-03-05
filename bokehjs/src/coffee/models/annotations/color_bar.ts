/* XXX: partial */
import {Annotation, AnnotationView} from "./annotation";
import {Ticker} from "../tickers/ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker";
import {BasicTickFormatter} from "../formatters/basic_tick_formatter";
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper";
import {LinearScale} from "../scales/linear_scale";
import {LogScale} from "../scales/log_scale";
import {Range1d} from "../ranges/range1d";

import {Color} from "core/types"
import {FontStyle, TextAlign, TextBaseline, LineJoin, LineCap} from "core/enums"
import {LegendLocation, Orientation} from "core/enums"
import * as p from "core/properties";
import * as text_util from "core/util/text";
import {min, max, range} from "core/util/array";
import {isEmpty} from "core/util/object";
import {isString, isArray} from "core/util/types"
import {Context2d} from "core/util/canvas"

const SHORT_DIM = 25;
const LONG_DIM_MIN_SCALAR = 0.3;
const LONG_DIM_MAX_SCALAR = 0.8;

export class ColorBarView extends AnnotationView {
  model: ColorBar

  initialize(options: any): void {
    super.initialize(options);
    this._set_canvas_image();
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.visible.change, () => this.plot_view.request_render())
    this.connect(this.model.ticker.change, () => this.plot_view.request_render())
    this.connect(this.model.formatter.change, () => this.plot_view.request_render())
    if (this.model.color_mapper != null) {
      this.connect(this.model.color_mapper.change, () => {
        this._set_canvas_image()
        this.plot_view.request_render()
      })
    }
  }

  protected _get_size(): number {
    if (this.model.color_mapper == null)
      return 0

    const bbox = this.compute_legend_dimensions()
    const {side} = this.model.panel

    switch (side) {
      case "above":
      case "below":
        return bbox.height
      case "left":
      case "right":
        return bbox.width
      default:
        return undefined as never
    }
  }

  _set_canvas_image() {
    let h, w;
    if ((this.model.color_mapper == null)) {
      return;
    }

    let { palette } = this.model.color_mapper;

    if (this.model.orientation === 'vertical') {
      palette = palette.slice(0).reverse();
    }

    switch (this.model.orientation) {
      case "vertical": [w, h] = [1, palette.length]; break;
      case "horizontal": [w, h] = [palette.length, 1]; break;
    }

    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [w, h];
    const image_ctx = canvas.getContext('2d');
    const image_data = image_ctx.getImageData(0, 0, w, h);

    // We always want to draw the entire palette linearly, so we create a new
    // LinearColorMapper instance and map a monotonic range of values with
    // length = palette.length to get each palette color in order.
    const cmap = new LinearColorMapper({palette});
    const buf = cmap.v_map_screen(range(0, palette.length));
    const buf8 = new Uint8Array(buf);
    image_data.data.set(buf8);
    image_ctx.putImageData(image_data, 0, 0);

    return this.image = canvas;
  }

  compute_legend_dimensions() {
    let legend_height, legend_width;
    const image_dimensions = this.model._computed_image_dimensions();
    const [image_height, image_width] = [image_dimensions.height, image_dimensions.width];

    const label_extent = this._get_label_extent();
    const title_extent = this.model._title_extent();
    const tick_extent = this.model._tick_extent();
    const { padding } = this.model;

    switch (this.model.orientation) {
      case "vertical":
        legend_height = image_height + title_extent + (padding * 2);
        legend_width = image_width + tick_extent + label_extent + (padding * 2);
        break;
      case "horizontal":
        legend_height = image_height + title_extent + tick_extent + label_extent + (padding * 2);
        legend_width = image_width + (padding * 2);
        break;
    }

    return {height: legend_height, width: legend_width};
  }

  compute_legend_location() {
    let sx, sy;
    const legend_dimensions = this.compute_legend_dimensions();
    const [legend_height, legend_width] = [legend_dimensions.height, legend_dimensions.width];

    const legend_margin = this.model.margin;

    const panel = this.model.panel != null ? this.model.panel : this.plot_view.frame;
    const [hr, vr] = panel.bbox.ranges;

    const { location } = this.model;
    if (isString(location)) {
      switch (location) {
        case 'top_left':
          sx = hr.start + legend_margin;
          sy = vr.start + legend_margin;
          break;
        case 'top_center':
          sx = ((hr.end + hr.start)/2) - (legend_width/2);
          sy = vr.start + legend_margin;
          break;
        case 'top_right':
          sx = hr.end - legend_margin - legend_width;
          sy = vr.start + legend_margin;
          break;
        case 'bottom_right':
          sx = hr.end - legend_margin - legend_width;
          sy = vr.end - legend_margin - legend_height;
          break;
        case 'bottom_center':
          sx = ((hr.end + hr.start)/2) - (legend_width/2);
          sy = vr.end - legend_margin - legend_height;
          break;
        case 'bottom_left':
          sx = hr.start + legend_margin;
          sy = vr.end - legend_margin - legend_height;
          break;
        case 'center_left':
          sx = hr.start + legend_margin;
          sy = ((vr.end + vr.start)/2) - (legend_height/2);
          break;
        case 'center':
          sx = ((hr.end + hr.start)/2) - (legend_width/2);
          sy = ((vr.end + vr.start)/2) - (legend_height/2);
          break;
        case 'center_right':
          sx = hr.end - legend_margin - legend_width;
          sy = ((vr.end + vr.start)/2) - (legend_height/2);
          break;
      }
    } else if (isArray(location) && (location.length === 2)) {
      const [vx, vy] = location;
      sx = panel.xview.compute(vx);
      sy = panel.yview.compute(vy) - legend_height;
    }

    return {sx, sy};
  }

  render() {
    if (!this.model.visible || (this.model.color_mapper == null)) {
      return;
    }

    const { ctx } = this.plot_view.canvas_view;
    ctx.save();

    const {sx, sy} = this.compute_legend_location();
    ctx.translate(sx, sy);
    this._draw_bbox(ctx);

    const image_offset = this._get_image_offset();
    ctx.translate(image_offset.x, image_offset.y);

    this._draw_image(ctx);

    if ((this.model.color_mapper.low != null) && (this.model.color_mapper.high != null)) {
      const tick_info = this.model.tick_info();
      this._draw_major_ticks(ctx, tick_info);
      this._draw_minor_ticks(ctx, tick_info);
      this._draw_major_labels(ctx, tick_info);
    }

    if (this.model.title) {
      this._draw_title(ctx);
    }
    return ctx.restore();
  }

  _draw_bbox(ctx: Context2d) {
    const bbox = this.compute_legend_dimensions();
    ctx.save();
    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx);
      ctx.fillRect(0, 0, bbox.width, bbox.height);
    }
    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx);
      ctx.strokeRect(0, 0, bbox.width, bbox.height);
    }
    return ctx.restore();
  }

  _draw_image(ctx: Context2d) {
    const image = this.model._computed_image_dimensions();
    ctx.save();
    ctx.setImageSmoothingEnabled(false);
    ctx.globalAlpha = this.model.scale_alpha;
    ctx.drawImage(this.image, 0, 0, image.width, image.height);
    if (this.visuals.bar_line.doit) {
        this.visuals.bar_line.set_value(ctx);
        ctx.strokeRect(0, 0, image.width, image.height);
      }
    return ctx.restore();
  }

  _draw_major_ticks(ctx: Context2d, tick_info) {
    if (!this.visuals.major_tick_line.doit) {
      return;
    }

    const [nx, ny] = this.model._normals();
    const image = this.model._computed_image_dimensions();
    const [x_offset, y_offset] = [image.width * nx, image.height * ny];

    const [sx, sy] = tick_info.coords.major;
    const tin = this.model.major_tick_in;
    const tout = this.model.major_tick_out;

    ctx.save();
    ctx.translate(x_offset, y_offset);
    this.visuals.major_tick_line.set_value(ctx);
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(sx[i]+(nx*tout)), Math.round(sy[i]+(ny*tout)));
      ctx.lineTo(Math.round(sx[i]-(nx*tin)), Math.round(sy[i]-(ny*tin)));
      ctx.stroke();
    }
    return ctx.restore();
  }

  _draw_minor_ticks(ctx: Context2d, tick_info) {
    if (!this.visuals.minor_tick_line.doit) {
      return;
    }

    const [nx, ny] = this.model._normals();
    const image = this.model._computed_image_dimensions();
    const [x_offset, y_offset] = [image.width * nx, image.height * ny];

    const [sx, sy] = tick_info.coords.minor;
    const tin = this.model.minor_tick_in;
    const tout = this.model.minor_tick_out;

    ctx.save();
    ctx.translate(x_offset, y_offset);
    this.visuals.minor_tick_line.set_value(ctx);
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(sx[i]+(nx*tout)), Math.round(sy[i]+(ny*tout)));
      ctx.lineTo(Math.round(sx[i]-(nx*tin)), Math.round(sy[i]-(ny*tin)));
      ctx.stroke();
    }
    return ctx.restore();
  }

  _draw_major_labels(ctx: Context2d, tick_info) {
    if (!this.visuals.major_label_text.doit) {
      return;
    }

    const [nx, ny] = this.model._normals();
    const image = this.model._computed_image_dimensions();
    const [x_offset, y_offset] = [image.width * nx, image.height * ny];
    const standoff = (this.model.label_standoff + this.model._tick_extent());
    const [x_standoff, y_standoff] = [standoff*nx, standoff*ny];

    const [sx, sy] = tick_info.coords.major;

    const formatted_labels = tick_info.labels.major;

    this.visuals.major_label_text.set_value(ctx);

    ctx.save();
    ctx.translate(x_offset + x_standoff, y_offset + y_standoff);
    for (let i = 0, end = sx.length; i < end; i++) {
      ctx.fillText(formatted_labels[i],
                   Math.round(sx[i]+(nx*this.model.label_standoff)),
                   Math.round(sy[i]+(ny*this.model.label_standoff)));
    }
    return ctx.restore();
  }

  _draw_title(ctx: Context2d) {
    if (!this.visuals.title_text.doit) {
      return;
    }

    ctx.save();
    this.visuals.title_text.set_value(ctx);
    ctx.fillText(this.model.title, 0, -this.model.title_standoff);
    return ctx.restore();
  }

  _get_label_extent() {
    let label_extent;
    const major_labels = this.model.tick_info().labels.major;
    if ((this.model.color_mapper.low != null) && (this.model.color_mapper.high != null) && !isEmpty(major_labels)) {
      const { ctx } = this.plot_view.canvas_view;
      ctx.save();
      this.visuals.major_label_text.set_value(ctx);
      switch (this.model.orientation) {
        case "vertical":
          label_extent = max((major_labels.map((label) => ctx.measureText(label.toString()).width)));
          break;
        case "horizontal":
          label_extent = text_util.get_text_height(this.visuals.major_label_text.font_value()).height;
          break;
      }

      label_extent += this.model.label_standoff;
      ctx.restore();
    } else {
      label_extent = 0;
    }
    return label_extent;
  }

  _get_image_offset() {
    // Returns image offset relative to legend bounding box
    const x = this.model.padding;
    const y = this.model.padding + this.model._title_extent();
    return {x, y};
  }
}

export namespace ColorBar {
  // text:major_label_
  export interface MajorLabelText {
    major_label_text_font: string
    major_label_text_font_size: string
    major_label_text_font_style: FontStyle
    major_label_text_color: Color
    major_label_text_alpha: number
    major_label_text_align: TextAlign
    major_label_text_baseline: TextBaseline
    major_label_text_line_height: number
  }

  // text:title_
  export interface TitleText {
    title_text_font: string
    title_text_font_size: string
    title_text_font_style: FontStyle
    title_text_color: Color
    title_text_alpha: number
    title_text_align: TextAlign
    title_text_baseline: TextBaseline
    title_text_line_height: number
  }

  // line:major_tick_
  export interface MajorTickLine {
    major_tick_line_color: Color
    major_tick_line_width: number
    major_tick_line_alpha: number
    major_tick_line_join: LineJoin
    major_tick_line_cap: LineCap
    major_tick_line_dash: number[]
    major_tick_line_dash_offset: number
  }

  // line:minor_tick_
  export interface MinorTickLine {
    minor_tick_line_color: Color
    minor_tick_line_width: number
    minor_tick_line_alpha: number
    minor_tick_line_join: LineJoin
    minor_tick_line_cap: LineCap
    minor_tick_line_dash: number[]
    minor_tick_line_dash_offset: number
  }

  // line:border_
  export interface BorderLine {
    border_line_color: Color
    border_line_width: number
    border_line_alpha: number
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: number[]
    border_line_dash_offset: number
  }

  // line:bar_
  export interface BarLine {
    bar_line_color: Color
    bar_line_width: number
    bar_line_alpha: number
    bar_line_join: LineJoin
    bar_line_cap: LineCap
    bar_line_dash: number[]
    bar_line_dash_offset: number
  }

  // fill:background_
  export interface BackgroundFill {
    background_fill_color: Color
    background_fill_alpha: number
  }

  export interface Mixins extends MajorLabelText, TitleText, MajorTickLine, MinorTickLine, BorderLine, BarLine, BackgroundFill {}

  export interface Attrs extends Annotation.Attrs, Mixins {
    location: LegendLocation
    orientation: Orientation
    title: string
    title_standoff: number
    width: number | "auto"
    height: number | "auto"
    scale_alpha: number
    ticker: Ticker<any>
    formatter: TickFormatter
    major_label_overrides: {[key: string]: string}
    color_mapper: ColorMapper
    label_standoff: number
    margin: number
    padding: number
    major_tick_in: number
    major_tick_out: number
    minor_tick_in: number
    minor_tick_out: number
  }
}

export interface ColorBar extends ColorBar.Attrs {}

export class ColorBar extends Annotation {

  constructor(attrs?: Partial<ColorBar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ColorBar';
    this.prototype.default_view = ColorBarView;

    this.mixins([
      'text:major_label_',
      'text:title_',
      'line:major_tick_',
      'line:minor_tick_',
      'line:border_',
      'line:bar_',
      'fill:background_',
    ]);

    this.define({
      location:                [ p.Any,            'top_right' ],
      orientation:             [ p.Orientation,    'vertical'  ],
      title:                   [ p.String,                     ],
      title_standoff:          [ p.Number,         2           ],
      width:                   [ p.Any,            'auto'      ],
      height:                  [ p.Any,            'auto'      ],
      scale_alpha:             [ p.Number,         1.0         ],
      ticker:                  [ p.Instance,    () => new BasicTicker()         ],
      formatter:               [ p.Instance,    () => new BasicTickFormatter()  ],
      major_label_overrides:   [ p.Any,      {}           ],
      color_mapper:            [ p.Instance                    ],
      label_standoff:          [ p.Number,         5           ],
      margin:                  [ p.Number,         30          ],
      padding:                 [ p.Number,         10          ],
      major_tick_in:           [ p.Number,         5           ],
      major_tick_out:          [ p.Number,         0           ],
      minor_tick_in:           [ p.Number,         0           ],
      minor_tick_out:          [ p.Number,         0           ],
    });

    this.override({
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      bar_line_color: null,
      border_line_color: null,
      major_label_text_align: "center",
      major_label_text_baseline: "middle",
      major_label_text_font_size: "8pt",
      major_tick_line_color: "#ffffff",
      minor_tick_line_color: null,
      title_text_font_size: "10pt",
      title_text_font_style: "italic",
    });
  }

  _normals() {
    let i, j;
    if (this.orientation === 'vertical') {
      [i, j] = [1, 0];
    } else {
      [i, j] = [0, 1];
    }
    return [i, j];
  }

  _title_extent() {
    const font_value = this.title_text_font + " " + this.title_text_font_size + " " + this.title_text_font_style;
    const title_extent = this.title ? text_util.get_text_height(font_value).height + this.title_standoff : 0;
    return title_extent;
  }

  _tick_extent() {
    let tick_extent;
    if ((this.color_mapper.low != null) && (this.color_mapper.high != null)) {
      tick_extent = max([this.major_tick_out, this.minor_tick_out]);
    } else {
      tick_extent = 0;
    }
    return tick_extent;
  }

  _computed_image_dimensions(): {height: number, width: number} {
    /*
    Heuristics to determine ColorBar image dimensions if set to "auto"

    Note: Returns the height/width values for the ColorBar's scale image, not
    the dimensions of the entire ColorBar.

    If the short dimension (the width of a vertical bar or height of a
    horizontal bar) is set to "auto", the resulting dimension will be set to
    25 px.

    For a ColorBar in a side panel with the long dimension (the height of a
    vertical bar or width of a horizontal bar) set to "auto", the
    resulting dimension will be as long as the adjacent frame edge, so that the
    bar "fits" to the plot.

    For a ColorBar in the plot frame with the long dimension set to "auto", the
    resulting dimension will be the greater of:
      * The length of the color palette * 25px
      * The parallel frame dimension * 0.30
        (i.e the frame height for a vertical ColorBar)
    But not greater than:
      * The parallel frame dimension * 0.80
    */

    let height, width;
    const frame_height = this.plot.plot_canvas.frame._height.value;
    const frame_width = this.plot.plot_canvas.frame._width.value;
    const title_extent = this._title_extent();

    switch (this.orientation) {
      case "vertical":
        if (this.height === 'auto') {
          if (this.panel != null) {
            height = frame_height - (2 * this.padding) - title_extent;
          } else {
            height = max([this.color_mapper.palette.length * SHORT_DIM,
                          frame_height * LONG_DIM_MIN_SCALAR]);
            height = min([height,
                          (frame_height * LONG_DIM_MAX_SCALAR) - (2 * this.padding) - title_extent]);
          }
        } else {
          ({ height } = this);
        }

        width = this.width === 'auto' ? SHORT_DIM : this.width;
        break;

      case "horizontal":
        height = this.height === 'auto' ? SHORT_DIM : this.height;

        if (this.width === 'auto') {
          if (this.panel != null) {
            width = frame_width - (2 * this.padding);
          } else {
            width = max([this.color_mapper.palette.length * SHORT_DIM,
                         frame_width * LONG_DIM_MIN_SCALAR]);
            width = min([width,
                         (frame_width * LONG_DIM_MAX_SCALAR) - (2 * this.padding)]);
          }
        } else {
          ({ width } = this);
        }
        break;
    }

    return {"height": height, "width": width};
  }

  _tick_coordinate_scale(scale_length) {
    /*
    Creates and returns a scale instance that maps the `color_mapper` range
    (low to high) to a screen space range equal to the length of the ColorBar's
    scale image. The scale is used to calculate the tick coordinates in screen
    coordinates for plotting purposes.

    Note: the type of color_mapper has to match the type of scale (i.e.
    a LinearColorMapper will require a corresponding LinearScale instance).
    */

    let scale;
    const ranges = {
      'source_range': new Range1d({
        start: this.color_mapper.low,
        end: this.color_mapper.high,
      }),
      'target_range': new Range1d({
        start: 0,
        end: scale_length}),
    };

    switch (this.color_mapper.type) {
      case "LinearColorMapper": scale = new LinearScale(ranges); break;
      case "LogColorMapper": scale = new LogScale(ranges); break;
    }

    return scale;
  }

  _format_major_labels(initial_labels, major_ticks) {

    const labels = initial_labels;

    // note: passing null as cross_loc probably means MercatorTickFormatters, etc
    // will not function properly in conjunction with colorbars
    const formatted_labels = this.formatter.doFormat(labels, null);

    for (let i = 0, end = major_ticks.length; i < end; i++) {
      if (major_ticks[i] in this.major_label_overrides) {
        formatted_labels[i] = this.major_label_overrides[major_ticks[i]];
      }
    }

    return formatted_labels;
  }

  tick_info() {
    let scale_length;
    let coord;
    const image_dimensions = this._computed_image_dimensions();
    switch (this.orientation) {
      case "vertical": scale_length = image_dimensions.height; break;
      case "horizontal": scale_length = image_dimensions.width; break;
    }

    const scale = this._tick_coordinate_scale(scale_length);

    const [i, j] = this._normals();

    const [start, end] = [this.color_mapper.low, this.color_mapper.high];

    // note: passing null as cross_loc probably means MercatorTickers, etc
    // will not function properly in conjunction with colorbars
    const ticks = this.ticker.get_ticks(start, end, null, null, this.ticker.desired_num_ticks);

    const coords = {
      major: [[], []],
      minor: [[], []],
    };

    const majors = ticks.major;
    const minors = ticks.minor;

    const major_coords = coords.major;
    const minor_coords = coords.minor;

    for (let ii = 0, _end = majors.length; ii < _end; ii++) {
      if ((majors[ii] < start) || (majors[ii] > end)) {
        continue;
      }
      major_coords[i].push(majors[ii]);
      major_coords[j].push(0);
    }

    for (let ii = 0, _end = minors.length; ii < _end; ii++) {
      if ((minors[ii] < start) || (minors[ii] > end)) {
        continue;
      }
      minor_coords[i].push(minors[ii]);
      minor_coords[j].push(0);
    }


    const labels =
        {major:this._format_major_labels(major_coords[i].slice(0), majors)}; // make deep copy

    major_coords[i] = scale.v_compute(major_coords[i]);
    minor_coords[i] = scale.v_compute(minor_coords[i]);

    // Because we want the scale to be reversed
    if (this.orientation === 'vertical') {
      major_coords[i] = new Float64Array(((() => {
        const result = [];
        for (coord of major_coords[i]) {           result.push(scale_length - coord);
        }
        return result;
      })()));
      minor_coords[i] = new Float64Array(((() => {
        const result1 = [];
        for (coord of minor_coords[i]) {           result1.push(scale_length - coord);
        }
        return result1;
      })()));
    }

    return {
      "ticks":ticks,
      "coords":coords,
      "labels":labels,
    };
  }
}
ColorBar.initClass();
