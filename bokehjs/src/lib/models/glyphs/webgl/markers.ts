import {BaseGLGlyph, Transform} from "./base"
import {ReglWrapper} from "./regl_wrap"
import {ScatterView} from "../scatter"
import {CircleView} from "../circle"
import {MarkerType} from "core/enums"
import {uint32} from "core/types"
import {Uniform} from "core/uniforms"
import {color2rgba} from "core/util/color"


// Avoiding use of nan or inf to represent missing data in webgl as shaders may
// have reduced floating point precision.  So here using a large-ish negative
// value instead.
const missing_point = -10000


type MarkerLikeView = ScatterView | CircleView


function color_to_uint8_array(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>): Uint8Array {
  const ncolors: number = Math.max(color_prop.length, alpha_prop.length)
  const rgba: Uint8Array = new Uint8Array(4*ncolors)

  for (let i = 0; i < ncolors; i++) {
    const [r, g, b, a] = color2rgba(color_prop.get(i), alpha_prop.get(i))
    rgba[4*i  ] = r
    rgba[4*i+1] = g
    rgba[4*i+2] = b
    rgba[4*i+3] = a
  }
  return rgba
}


function prop_as_array(prop: Uniform<number>): number[] | Float32Array {
  if (prop === undefined)
    return []
  else if (prop.is_Scalar())
    return [prop.value]
  else {
    const array = new Float32Array(prop.length)
    for (let i = 0; i < prop.length; i++)
      array[i] = prop.get(i)
    return array
  }
}


// Base class for markers. All markers share the same GLSL, except for one
// function in the fragment shader that defines the marker geometry and is
// enabled through a #define.
export class MarkerGL extends BaseGLGlyph {
  protected _marker_type: MarkerType
  protected _linewidth: number
  protected _antialias: number

  protected _centers: Float32Array
  protected _sizes: number[] | Float32Array
  protected _angles: number[] | Float32Array
  protected _linewidths: number[] | Float32Array
  protected _line_rgba: Uint8Array
  protected _fill_rgba: Uint8Array
  protected _show: Uint8Array
  protected _show_all: boolean

  static is_supported(marker_type: MarkerType): boolean {
    switch (marker_type) {
      case "asterisk":
      case "circle":
      case "circle_cross":
      case "circle_dot":
      case "circle_x":
      case "circle_y":
      case "cross":
      case "dash":
      case "diamond":
      case "diamond_cross":
      case "diamond_dot":
      case "dot":
      case "hex":
      case "hex_dot":
      case "inverted_triangle":
      case "plus":
      case "square":
      case "square_cross":
      case "square_dot":
      case "square_pin":
      case "square_x":
      case "star":
      case "star_dot":
      case "triangle":
      case "triangle_dot":
      case "triangle_pin":
      case "x":
      case "y":
        return true
      default:
        return false
    }
  }

  constructor(regl_wrapper: ReglWrapper, readonly glyph: MarkerLikeView, readonly marker_type: MarkerType) {
    super(regl_wrapper, glyph)

    this._marker_type = marker_type
    this._antialias = 0.8
    this._show_all = false
  }

  draw(indices: number[], main_glyph: MarkerLikeView, transform: Transform): void {
    // The main glyph has the data, this glyph has the visuals.
    const mainGlGlyph = main_glyph.glglyph!

    // Temporary solution for circles to always force call to _set_data.
    // Correct solution depends on keeping the webgl properties constant and
    // only changing the indices, which in turn depends on the correct webgl
    // instanced rendering.
    if (mainGlGlyph.data_changed || this.glyph instanceof CircleView) {
      mainGlGlyph._set_data()
      mainGlGlyph.data_changed = false
    }

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const nmarkers = mainGlGlyph._centers.length / 2
    if (this._show === undefined)
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

    this.regl_wrapper.marker(this._marker_type)({
      canvas_size: [transform.width, transform.height],
      pixel_ratio: transform.pixel_ratio,
      center: mainGlGlyph._centers,
      size: mainGlGlyph._sizes,
      angle: mainGlGlyph._angles,
      nmarkers,
      antialias: this._antialias,
      linewidth: this._linewidths,
      line_color: this._line_rgba,
      fill_color: this._fill_rgba,
      show: this._show,
    })
  }

  protected _set_data(): void {
    const nmarkers = this.glyph.sx.length

    if (this._centers === undefined || this._centers.length != nmarkers*2)
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

    if (this.glyph instanceof CircleView && this.glyph.radius != null) {
      this._sizes = new Float32Array(nmarkers)
      for (let i = 0; i < nmarkers; i++)
        this._sizes[i] = this.glyph.sradius[i]*2
    } else
      this._sizes = prop_as_array(this.glyph.size)

    this._angles = prop_as_array(this.glyph.angle)
  }

  protected _set_visuals(): void {
    const fill = this.glyph.visuals.fill
    const line = this.glyph.visuals.line

    this._linewidths = prop_as_array(line.line_width)

    // These create new Uint8Arrays each call.  Should reuse instead.
    this._line_rgba = color_to_uint8_array(line.line_color, line.line_alpha)
    this._fill_rgba = color_to_uint8_array(fill.fill_color, fill.fill_alpha)
  }
}
