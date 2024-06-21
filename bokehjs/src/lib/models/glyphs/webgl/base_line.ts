import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {LineGlyphProps, LineDashGlyphProps} from "./types"
import type {GlyphView} from "../glyph"
import type * as visuals from "core/visuals"
import {resolve_line_dash} from "core/visuals/line"
import type {Framebuffer2D, Texture2D} from "regl"
import type {Arrayable} from "core/types"

export type BaseLineVisuals = visuals.LineVector | visuals.LineScalar

export abstract class BaseLineGL extends BaseGLGlyph {
  protected readonly _antialias: number = 1.5  // Make this larger to test antialiasing at edges.
  protected readonly _miter_limit = 10.0  // Threshold for miters to be replaced by bevels.

  // data properties
  protected _points?: Float32Buffer
  protected _show?: Uint8Buffer  // Applies to segments not points.

  // visual properties
  protected readonly _linewidth = new Float32Buffer(this.regl_wrapper)
  protected readonly _line_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  protected readonly _line_cap = new Uint8Buffer(this.regl_wrapper)
  protected readonly _line_join = new Uint8Buffer(this.regl_wrapper)

  protected _is_dashed = false

  // visual properties that are only used if line is dashed.
  protected _length_so_far?: Float32Buffer  // Depends on both data and visuals.
  protected _dash_tex: (Texture2D | null)[] = []
  protected _dash_tex_info?: Float32Buffer
  protected _dash_scale?: Float32Buffer
  protected _dash_offset?: Float32Buffer

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: GlyphView) {
    super(regl_wrapper, glyph)
  }

  abstract override draw(_indices: number[], main_glyph: GlyphView, transform: Transform): void

  protected _draw_single(main_gl_glyph: BaseLineGL, transform: Transform, line_offset: number, point_offset: number,
                         nsegments: number, framebuffer: Framebuffer2D | null, show: Uint8Buffer | null = null): void {
    const solid_props: LineGlyphProps = {
      scissor: this.regl_wrapper.scissor,
      viewport: this.regl_wrapper.viewport,
      canvas_size: [transform.width, transform.height],
      antialias: this._antialias / transform.pixel_ratio,
      miter_limit: this._miter_limit,
      points: main_gl_glyph._points!,
      show: show ?? main_gl_glyph._show!,
      nsegments,
      linewidth: this._linewidth,
      line_color: this._line_color,
      line_cap: this._line_cap,
      line_join: this._line_join,
      framebuffer,
      point_offset,
      line_offset,
    }
    if (this._is_dashed && this._dash_tex[line_offset] != null) {
      const dashed_props: LineDashGlyphProps = {
        ...solid_props,
        length_so_far: main_gl_glyph._length_so_far!,
        dash_tex: this._dash_tex[line_offset],
        dash_tex_info: this._dash_tex_info!,
        dash_scale: this._dash_scale!,
        dash_offset: this._dash_offset!,
      }
      this.regl_wrapper.dashed_line()(dashed_props)
    } else {
      this.regl_wrapper.solid_line()(solid_props)
    }
  }

  protected abstract _get_visuals(): BaseLineVisuals

  protected abstract _set_data(data_changed: boolean): void

  protected _set_length_single(length_so_far: Float32Array, points: Float32Array, show: Uint8Array): void {
    // Set length so far for a single line from the points and show flags for that line.
    // Only needed if line is dashed.
    const nsegments = length_so_far.length

    let length = 0.0
    for (let i = 0; i < nsegments; i++) {
      length_so_far[i] = length
      if (show[i+1] == 1) {
        length += Math.sqrt((points[2*i + 4] - points[2*i + 2])**2 +
                            (points[2*i + 5] - points[2*i + 3])**2)
      } else {
        // Reset to zero at invalid point.
        length = 0.0
      }
    }
  }

  protected _set_points_single(points: Float32Array, sx: Arrayable<number>, sy: Arrayable<number>): void {
    // Set points array for a single line.
    const npoints = points.length/2 - 2
    const is_closed = (npoints > 2 && sx[0] == sx[npoints-1] && sy[0] == sy[npoints-1] &&
                       isFinite(sx[0] + sy[0]))

    for (let i = 1; i < npoints+1; i++) {
      points[2*i  ] = sx[i-1]
      points[2*i+1] = sy[i-1]
    }

    if (is_closed) {
      points[0] = points[2*npoints-2]  // Last but one point.
      points[1] = points[2*npoints-1]
      points[2*npoints+2] = points[4]  // Second point.
      points[2*npoints+3] = points[5]
    } else {
      points[0] = 0.0
      points[1] = 0.0
      points[2*npoints+2] = 0.0
      points[2*npoints+3] = 0.0
    }
  }

  protected _set_show_single(show: Uint8Array, points: Float32Array): void {
    // Set show flags for a single line from the points of that line.
    // Do not show line segments which have a NaN coordinate at either end, and
    // also take account of line being closed (start and end points identical).
    const npoints = points.length/2 - 2
    let start_finite = isFinite(points[2] + points[3])
    for (let i = 1; i < npoints; i++) {
      const end_finite = isFinite(points[2*i+2] + points[2*i+3])
      show[i] = (start_finite && end_finite) ? 1 : 0
      start_finite = end_finite
    }

    const is_closed = npoints > 2 && points[0] == points[2*npoints-2] && points[1] == points[2*npoints-1]
    if (is_closed) {
      show[0] = show[npoints-1]
      show[npoints] = show[1]
    } else {
      show[0] = 0
      show[npoints] = 0
    }
  }

  protected _set_visuals(): void {
    const line_visuals = this._get_visuals()

    this._line_color.set_from_color(line_visuals.line_color, line_visuals.line_alpha)
    this._linewidth.set_from_prop(line_visuals.line_width)
    this._line_cap.set_from_line_cap(line_visuals.line_cap)
    this._line_join.set_from_line_join(line_visuals.line_join)

    const {line_dash} = line_visuals
    this._is_dashed = !(line_dash.is_Scalar() && line_dash.get(0).length == 0)

    if (this._is_dashed) {
      if (this._dash_offset == null) {
        this._dash_offset = new Float32Buffer(this.regl_wrapper)
      }
      this._dash_offset.set_from_prop(line_visuals.line_dash_offset)

      const n = line_dash.length

      if (this._dash_tex_info == null) {
        this._dash_tex_info = new Float32Buffer(this.regl_wrapper, 4)
      }
      const dash_tex_info = this._dash_tex_info.get_sized_array(4*n)

      if (this._dash_scale == null) {
        this._dash_scale = new Float32Buffer(this.regl_wrapper)
      }
      const dash_scale = this._dash_scale.get_sized_array(n)

      // All other dash properties are assumed vector rather than scalar.
      for (let i = 0; i < n; i++) {
        const arr = resolve_line_dash(line_dash.get(i))
        if (arr.length > 0) {
          // This line is dashed
          const [tex_info, tex, scale] = this.regl_wrapper.get_dash(arr)
          this._dash_tex.push(tex)
          for (let j = 0; j < 4; j++) {
            dash_tex_info[4*i + j] = tex_info[j]
          }
          dash_scale[i] = scale
        } else {
          // This line is solid
          this._dash_tex.push(null)
          dash_tex_info.fill(0, 4*i, 4*(i+1))
          dash_scale[i] = 0
        }
      }

      this._dash_tex_info.update()
      this._dash_scale.update()
    }
  }
}
