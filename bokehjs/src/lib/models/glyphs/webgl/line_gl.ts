import {BaseGLGlyph, Transform} from "./base"
import {LineView} from "../line"
import {ReglWrapper} from "./regl_wrap"
import {color2rgba} from "core/util/color"
import {resolve_line_dash} from "core/visuals/line"
import {Texture2D} from "regl"
import {cap_lookup, join_lookup} from "./webgl_utils"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import {LineGlyphProps, LineDashGlyphProps} from "./types"

export class LineGL extends BaseGLGlyph {
  protected _nsegments: number
  protected _points?: Float32Buffer
  protected _show?: Uint8Buffer  // Applies to segments not points.

  protected _antialias: number
  protected _color: number[]
  protected _linewidth: number
  protected _miter_limit: number
  protected _line_dash: number[]
  protected _is_closed?: boolean

  // Only needed if line has dashes.
  protected _length_so_far?: Float32Buffer
  protected _dash_tex?: Texture2D
  protected _dash_tex_info?: number[]
  protected _dash_scale?: number
  protected _dash_offset?: number

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LineView) {
    super(regl_wrapper, glyph)

    this._antialias = 1.5   // Make this larger to test antialiasing at edges.
    this._miter_limit = 5.0 // Threshold for miters to be replaced by bevels.
  }

  draw(_indices: number[], mainGlyph: LineView, transform: Transform): void {
    // _indices are currently ignored.
    const mainGlGlyph = mainGlyph.glglyph!

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    if (mainGlGlyph.data_changed) {
      mainGlGlyph._set_data()
      mainGlGlyph.data_changed = false
    }

    const line_visuals = this.glyph.visuals.line
    const line_cap = cap_lookup[line_visuals.line_cap.value]
    const line_join = join_lookup[line_visuals.line_join.value]

    if (this._is_dashed()) {
      const props: LineDashGlyphProps = {
        scissor: this.regl_wrapper.scissor,
        viewport: this.regl_wrapper.viewport,
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        line_color: this._color,
        linewidth: this._linewidth,
        antialias: this._antialias,
        miter_limit: this._miter_limit,
        points: mainGlGlyph._points!,
        show: mainGlGlyph._show!,
        nsegments: mainGlGlyph._nsegments,
        line_join,
        line_cap,
        length_so_far: mainGlGlyph._length_so_far!,
        dash_tex: this._dash_tex!,
        dash_tex_info: this._dash_tex_info!,
        dash_scale: this._dash_scale!,
        dash_offset: this._dash_offset!,
      }
      this.regl_wrapper.dashed_line()(props)
    } else {
      const props: LineGlyphProps = {
        scissor: this.regl_wrapper.scissor,
        viewport: this.regl_wrapper.viewport,
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        line_color: this._color,
        linewidth: this._linewidth,
        antialias: this._antialias,
        miter_limit: this._miter_limit,
        points: mainGlGlyph._points!,
        show: mainGlGlyph._show!,
        nsegments: mainGlGlyph._nsegments,
        line_join,
        line_cap,
      }
      this.regl_wrapper.solid_line()(props)
    }
  }

  protected _is_dashed(): boolean {
    return this._line_dash.length > 0
  }

  protected _set_data(): void {
    const npoints = this.glyph.sx.length
    this._nsegments = npoints-1

    this._is_closed = (npoints > 2 &&
                       this.glyph.sx[0] == this.glyph.sx[npoints-1] &&
                       this.glyph.sy[0] == this.glyph.sy[npoints-1] &&
                       isFinite(this.glyph.sx[0]) &&
                       isFinite(this.glyph.sy[0]))

    if (this._points == null)
      this._points = new Float32Buffer(this.regl_wrapper)
    const points_array = this._points.get_sized_array((npoints+2)*2)

    for (let i = 1; i < npoints+1; i++) {
      points_array[2*i  ] = this.glyph.sx[i-1]
      points_array[2*i+1] = this.glyph.sy[i-1]
    }

    if (this._is_closed) {
      points_array[0] = points_array[2*npoints-2]  // Last but one point.
      points_array[1] = points_array[2*npoints-1]
      points_array[2*npoints+2] = points_array[4]  // Second point.
      points_array[2*npoints+3] = points_array[5]
    } else {
      // These are never used by the WebGL shaders, but setting to zero anyway.
      points_array[0] = 0.0
      points_array[1] = 0.0
      points_array[2*npoints+2] = 0.0
      points_array[2*npoints+3] = 0.0
    }

    this._points.update()

    if (this._show == null)
      this._show = new Uint8Buffer(this.regl_wrapper)
    const show_array = this._show.get_sized_array(npoints+1)

    let start_finite = isFinite(this.glyph.sx[0]) && isFinite(this.glyph.sy[0])
    for (let i = 1; i < npoints; i++) {
      const end_finite = isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])
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
      if (this._length_so_far == null)
        this._length_so_far = new Float32Buffer(this.regl_wrapper)
      const lengths_array = this._length_so_far.get_sized_array(this._nsegments)

      let length = 0.0
      for (let i = 0; i < this._nsegments; i++) {
        lengths_array[i] = length
        if (show_array[i+1] == 1)
          length += Math.sqrt((points_array[2*i+4] - points_array[2*i+2])**2 +
                              (points_array[2*i+5] - points_array[2*i+3])**2)
      }

      this._length_so_far.update()
    }
  }

  protected _set_visuals(): void {
    const line_visuals = this.glyph.visuals.line

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
