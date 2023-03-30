import {BaseGLGlyph, Transform} from "./base"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {LineGlyphProps, LineDashGlyphProps} from "./types"
import {cap_lookup, join_lookup} from "./webgl_utils"
import {GlyphView} from "../glyph"
import {color2rgba} from "core/util/color"
import * as visuals from "core/visuals"
import {resolve_line_dash} from "core/visuals/line"
import {Texture2D} from "regl"

export type LineGLVisuals = {
  readonly line: visuals.LineScalar
}

export abstract class BaseLineGL extends BaseGLGlyph {
  protected _points?: Float32Buffer
  protected _show?: Uint8Buffer  // Applies to segments not points.

  private _antialias: number
  private _miter_limit: number

  protected _color: number[]
  protected _linewidth: number
  protected _line_dash: number[]
  protected _is_closed: boolean

  // Only needed if line has dashes.
  protected _length_so_far?: Float32Buffer
  protected _dash_tex?: Texture2D
  protected _dash_tex_info?: number[]
  protected _dash_scale?: number
  protected _dash_offset?: number

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: GlyphView) {
    super(regl_wrapper, glyph)

    this._antialias = 1.5   // Make this larger to test antialiasing at edges.
    this._miter_limit = 10.0  // Threshold for miters to be replaced by bevels.
  }

  abstract override draw(_indices: number[], main_glyph: GlyphView, transform: Transform): void

  protected _draw_impl(indices: number[], transform: Transform, main_gl_glyph: BaseLineGL): void {
    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    if (main_gl_glyph.data_changed) {
      main_gl_glyph._set_data()
      main_gl_glyph.data_changed = false
    }

    const line_visuals = this._get_visuals().line
    const line_cap = cap_lookup[line_visuals.line_cap.value]
    const line_join = join_lookup[line_visuals.line_join.value]
    const points = main_gl_glyph._points!
    const nsegments = points.length/2 - 3  // Points array includes extra points at each end
    const show = this._get_show_buffer(indices, main_gl_glyph)

    const solid_props: LineGlyphProps = {
      scissor: this.regl_wrapper.scissor,
      viewport: this.regl_wrapper.viewport,
      canvas_size: [transform.width, transform.height],
      pixel_ratio: transform.pixel_ratio,
      line_color: this._color,
      linewidth: this._linewidth,
      antialias: this._antialias,
      miter_limit: this._miter_limit,
      points,
      show,
      nsegments,
      line_join,
      line_cap,
    }
    if (this._is_dashed()) {
      const dashed_props: LineDashGlyphProps = {
        ...solid_props,
        length_so_far: this._length_so_far!,
        dash_tex: this._dash_tex!,
        dash_tex_info: this._dash_tex_info!,
        dash_scale: this._dash_scale!,
        dash_offset: this._dash_offset!,
      }
      this.regl_wrapper.dashed_line()(dashed_props)
    } else {
      this.regl_wrapper.solid_line()(solid_props)
    }
  }

  protected abstract _get_show_buffer(indices: number[], main_gl_glyph: BaseLineGL): Uint8Buffer

  protected abstract _get_visuals(): LineGLVisuals

  protected _is_dashed(): boolean {
    return this._line_dash != null && this._line_dash.length > 0
  }

  protected _set_data(): void {
    const points_array = this._set_data_points()

    // Points array includes extra points at each end
    const npoints = points_array.length/2 - 2

    if (this._show == null)
      this._show = new Uint8Buffer(this.regl_wrapper)
    const show_array = this._show.get_sized_array(npoints+1)

    let start_finite = isFinite(points_array[2]) && isFinite(points_array[3])
    for (let i = 1; i < npoints; i++) {
      const end_finite = isFinite(points_array[2*i+2]) && isFinite(points_array[2*i+3])
      show_array[i] = (start_finite && end_finite) ? 1 : 0
      start_finite = end_finite
    }

    if (this._is_closed) {
      show_array[0] = show_array[npoints-1]
      show_array[npoints] = show_array[1]
    } else {
      show_array[0] = 0
      show_array[npoints] = 0
    }

    this._show.update()

    if (this._is_dashed()) {
      const nsegments = npoints-1

      if (this._length_so_far == null)
        this._length_so_far = new Float32Buffer(this.regl_wrapper)
      const lengths_array = this._length_so_far.get_sized_array(nsegments)

      let length = 0.0
      for (let i = 0; i < nsegments; i++) {
        lengths_array[i] = length
        if (show_array[i+1] == 1)
          length += Math.sqrt((points_array[2*i+4] - points_array[2*i+2])**2 +
                              (points_array[2*i+5] - points_array[2*i+3])**2)
      }

      this._length_so_far.update()
    }
  }

  protected abstract _set_data_points(): Float32Array

  protected _set_visuals(): void {
    const line_visuals = this._get_visuals().line

    const color = color2rgba(line_visuals.line_color.value, line_visuals.line_alpha.value)
    this._color = color.map((val) => val/255)

    this._linewidth = line_visuals.line_width.value
    if (this._linewidth < 1.0) {
      // Linewidth less than 1 is implemented as 1 but with reduced alpha.
      this._color[3] *= this._linewidth
      this._linewidth = 1.0
    }

    this._line_dash = resolve_line_dash(line_visuals.line_dash.value)
    if (this._is_dashed()) {
      [this._dash_tex_info, this._dash_tex, this._dash_scale] =
        this.regl_wrapper.get_dash(this._line_dash)
      this._dash_offset = line_visuals.line_dash_offset.value
    }
  }
}
