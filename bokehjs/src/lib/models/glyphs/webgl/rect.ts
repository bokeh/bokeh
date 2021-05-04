import {BaseGLGlyph, Transform} from "./base"
import {ReglWrapper} from "./regl_wrap"
import {RectGlyphProps, RectHatchGlyphProps} from "./types"
import {color_to_uint8_array, prop_as_array, hatch_pattern_prop_as_array, line_join_prop_as_array} from "./webgl_utils"
import {RectView} from "../rect"

// Avoiding use of nan or inf to represent missing data in webgl as shaders may
// have reduced floating point precision.  So here using a large-ish negative
// value instead.
const missing_point = -10000

export class RectGL extends BaseGLGlyph {
  protected _antialias: number

  protected _centers: Float32Array
  protected _widths: Float32Array
  protected _heights: Float32Array
  protected _angles: number[] | Float32Array
  protected _linewidths: number[] | Float32Array
  protected _line_rgba: Uint8Array
  protected _fill_rgba: Uint8Array
  protected _line_joins: number[] | Float32Array
  protected _show: Uint8Array
  protected _show_all: boolean

  // Only needed if have hatch pattern.
  protected _have_hatch: boolean
  protected _hatch_patterns?: number[] | Float32Array
  protected _hatch_scales?: number[] | Float32Array
  protected _hatch_weights?: number[] | Float32Array
  protected _hatch_rgba?: Uint8Array

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: RectView) {
    super(regl_wrapper, glyph)

    this._antialias = 1.5
  }

  draw(indices: number[], main_glyph: RectView, transform: Transform): void {
    // The main glyph has the data, this glyph has the visuals.
    const mainGlGlyph = main_glyph.glglyph!

    if (mainGlGlyph.data_changed) {
      mainGlGlyph._set_data()
      mainGlGlyph.data_changed = false
    }

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const nmarkers = mainGlGlyph._centers.length / 2
    if (this._show == null)
      this._show = new Uint8Array(nmarkers)

    if (indices.length < nmarkers) {
      this._show_all = false

      // Reset all show values to zero.
      for (let i = 0; i < nmarkers; i++)
        this._show[i] = 0

      // Set show values of markers to render to 255.
      for (let j = 0; j < indices.length; j++) {
        this._show[indices[j]] = 255
      }
    } else if (!this._show_all) {
      this._show_all = true
      for (let i = 0; i < nmarkers; i++)
        this._show[i] = 255
    }

    if (this._have_hatch) {
      const props: RectHatchGlyphProps = {
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        center: mainGlGlyph._centers,
        width: mainGlGlyph._widths,
        height: mainGlGlyph._heights,
        angle: mainGlGlyph._angles,
        nmarkers,
        antialias: this._antialias,
        linewidth: this._linewidths,
        line_color: this._line_rgba,
        fill_color: this._fill_rgba,
        line_join: this._line_joins,
        show: this._show,
        hatch_pattern: this._hatch_patterns!,
        hatch_scale: this._hatch_scales!,
        hatch_weight: this._hatch_weights!,
        hatch_color: this._hatch_rgba!,
      }
      this.regl_wrapper.rect_hatch()(props)
    } else {
      const props: RectGlyphProps = {
        canvas_size: [transform.width, transform.height],
        pixel_ratio: transform.pixel_ratio,
        center: mainGlGlyph._centers,
        width: mainGlGlyph._widths,
        height: mainGlGlyph._heights,
        angle: mainGlGlyph._angles,
        nmarkers,
        antialias: this._antialias,
        linewidth: this._linewidths,
        line_color: this._line_rgba,
        fill_color: this._fill_rgba,
        line_join: this._line_joins,
        show: this._show,
      }
      this.regl_wrapper.rect_no_hatch()(props)
    }
  }

  protected _set_data(): void {
    const nmarkers = this.glyph.sx.length

    if (this._centers == null || this._centers.length != nmarkers*2)
      this._centers = new Float32Array(nmarkers*2)

    for (let i = 0; i < nmarkers; i++) {
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        this._centers[2*i  ] = this.glyph.sx[i]
        this._centers[2*i+1] = this.glyph.sy[i]
      } else {
        this._centers[2*i  ] = missing_point
        this._centers[2*i+1] = missing_point
      }
    }

    this._widths = this.glyph.sw
    this._heights = this.glyph.sh
    this._angles = prop_as_array(this.glyph.angle)
  }

  protected _set_visuals(): void {
    const fill = this.glyph.visuals.fill
    const line = this.glyph.visuals.line

    this._linewidths = prop_as_array(line.line_width)
    this._line_joins = line_join_prop_as_array(line.line_join)

    // These create new Uint8Arrays each call.  Should reuse instead.
    this._line_rgba = color_to_uint8_array(line.line_color, line.line_alpha)
    this._fill_rgba = color_to_uint8_array(fill.fill_color, fill.fill_alpha)

    this._have_hatch = this.glyph.visuals.hatch.doit
    if (this._have_hatch) {
      const hatch = this.glyph.visuals.hatch

      this._hatch_patterns = hatch_pattern_prop_as_array(hatch.hatch_pattern)
      this._hatch_scales = prop_as_array(hatch.hatch_scale)
      this._hatch_weights = prop_as_array(hatch.hatch_weight)
      this._hatch_rgba = color_to_uint8_array(hatch.hatch_color, hatch.hatch_alpha)
    }
  }
}
