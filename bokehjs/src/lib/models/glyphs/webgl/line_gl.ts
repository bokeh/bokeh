import {BaseGLGlyph, Transform} from "./base"
import {LineView} from "../line"
import {ReglWrapper} from "./regl_wrap"
import {color2rgba} from "core/util/color"
import {resolve_line_dash} from "core/visuals/line"
import {Texture2D} from "regl"


const cap_lookup = {butt: 0, round: 1, square: 2}

const join_lookup = {miter: 0, round: 1, bevel: 2}

// Avoiding use of nan or inf to represent missing data in webgl as shaders may
// have reduced floating point precision.  So here using a large-ish negative
// value instead.
const missing_point = -1e10
const missing_point_threshold = -1e9


export class LineGL extends BaseGLGlyph {
  protected _nsegments: number
  protected _points: Float32Array
  protected _projection: Float32Array

  protected _antialias: number
  protected _color: number[]
  protected _miter_limit: number
  protected _line_dash: number[]
  protected _dash_offset: number
  protected _is_closed: boolean

  // Only needed if line has dashes.
  protected _length_so_far: Float32Array | undefined
  protected _dash_tex: Texture2D | undefined
  protected _dash_tex_info: number[] | undefined

  protected _debug_show_mesh: boolean

  constructor(regl_wrapper: ReglWrapper, readonly glyph: LineView) {
    super(regl_wrapper, glyph)

    this._projection = new Float32Array(16)

    this._antialias = 1.5   // Make this larger to test antialiasing at edges.
    this._miter_limit = 5.0 // Threshold for miters to be replaced by bevels.

    this._debug_show_mesh = false
  }

  draw(_indices: number[], _mainGlyph: LineView, transform: Transform): void {
    // _indices and _mainGlyph are currently ignored.

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    if (this.data_changed) {
      this._set_data()
      this.data_changed = false
    }

    const line_visuals = this.glyph.visuals.line
    const linewidth = line_visuals.line_width.value
    const antialias = Math.min(this._antialias, linewidth)
    const cap_type = cap_lookup[line_visuals.line_cap.value]
    const join_type = join_lookup[line_visuals.line_join.value]

    if (this._is_dashed())
      this.regl_wrapper.dashed_line()({
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        color: this._color,
        linewidth,
        antialias,
        miter_limit: this._miter_limit,
        points: this._points,
        nsegments: this._nsegments,
        join_type,
        cap_type,
        length_so_far: this._length_so_far,
        dash_tex: this._dash_tex,
        dash_tex_info: this._dash_tex_info,
        dash_offset: this._dash_offset,
      })
    else
      this.regl_wrapper.solid_line()({
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        color: this._color,
        linewidth,
        antialias,
        miter_limit: this._miter_limit,
        points: this._points,
        nsegments: this._nsegments,
        join_type,
        cap_type,
      })

    if (this._debug_show_mesh)
      this.regl_wrapper.line_mesh()({
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        color: [0, 0, 0, 1],
        linewidth,
        antialias,
        miter_limit: this._miter_limit,
        points: this._points,
        nsegments: this._nsegments,
        join_type,
        cap_type,
      })
  }

  protected _is_dashed(): boolean {
    return this._line_dash.length > 0
  }

  protected _set_data(): void {
    const npoints = this.glyph.sx.length
    this._nsegments = npoints-1

    if (this._is_closed === undefined) {
      this._is_closed = (this.glyph.sx[0] == this.glyph.sx[npoints-1] &&
                         this.glyph.sy[0] == this.glyph.sy[npoints-1] &&
                         isFinite(this.glyph.sx[0]) &&
                         isFinite(this.glyph.sy[0]))
    }

    if (this._points === undefined)
      this._points = new Float32Array((npoints+2)*2)

    for (let i = 1; i < npoints+1; i++) {
      if (isFinite(this.glyph.sx[i-1]) && isFinite(this.glyph.sy[i-1])) {
        this._points[2*i  ] = this.glyph.sx[i-1]
        this._points[2*i+1] = this.glyph.sy[i-1]
      } else {
        this._points[2*i  ] = missing_point
        this._points[2*i+1] = missing_point
      }
    }

    if (this._is_closed) {
      this._points[0] = this._points[2*npoints-2]  // Last but one point.
      this._points[1] = this._points[2*npoints-1]
      this._points[2*npoints+2] = this._points[4]  // Second point.
      this._points[2*npoints+3] = this._points[5]
    } else {
      this._points[0] = missing_point
      this._points[1] = missing_point
      this._points[2*npoints+2] = missing_point
      this._points[2*npoints+3] = missing_point
    }

    if (this._is_dashed()) {
      if (this._length_so_far === undefined)
        this._length_so_far = new Float32Array(this._nsegments)

      let length = 0.0
      for (let i = 0; i < this._nsegments; i++) {
        this._length_so_far[i] = length
        if (this._points[2*i+2] > missing_point_threshold &&
            this._points[2*i+4] > missing_point_threshold)
          length += Math.sqrt((this._points[2*i+4] - this._points[2*i+2])**2 +
                              (this._points[2*i+5] - this._points[2*i+3])**2)
      }
    }
  }

  protected _set_visuals(): void {
    const line_visuals = this.glyph.visuals.line

    const color = color2rgba(line_visuals.line_color.value, line_visuals.line_alpha.value)
    this._color = color.map((val) => val/255)

    this._line_dash = resolve_line_dash(line_visuals.line_dash.value)
    this._dash_offset = line_visuals.line_dash_offset.value

    if (this._is_dashed()) {
      [this._dash_tex_info, this._dash_tex] = this.regl_wrapper.get_dash(this._line_dash)
    }
  }
}
