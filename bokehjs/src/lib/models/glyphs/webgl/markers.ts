import {BaseGLGlyph, Transform} from "./base"
import {ReglWrapper} from "./regl_wrap"
import {ScatterView} from "../scatter"
import {CircleView} from "../circle"
import {MarkerType} from "core/enums"
import {uint32} from "core/types"
import {Uniform} from "core/uniforms"
import {map} from "core/util/arrayable"
import {color2rgba} from "core/util/color"


// Avoiding use of nan or inf to represent missing data in webgl as shaders may
// have reduced floating point precision.  So here using a large-ish negative
// value instead.
const missing_point = -1e10


type MarkerLikeView = ScatterView | CircleView


function color_to_uint8_array(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>): Uint8Array {
  const ncolors: number = color_prop.is_Scalar() && alpha_prop.is_Scalar() ? 1 : color_prop.length
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


function prop_as_array(prop: any): any {
  return prop.is_Scalar() ? [prop.value] : prop.array
}


// Base class for markers. All markers share the same GLSL, except for one
// function that defines the marker geometry.
export class MarkerGL extends BaseGLGlyph {
  protected _marker_type: MarkerType
  protected _linewidth: number
  protected _antialias: number

  protected _centers: Float32Array
  protected _line_rgba: Uint8Array
  protected _fill_rgba: Uint8Array

  static is_supported(marker_type: MarkerType): boolean {
    switch (marker_type) {
      case "asterisk":
      case "circle":
      case "circle_cross":
      case "circle_x":
      case "cross":
      case "diamond":
      case "diamond_cross":
      case "hex":
      case "inverted_triangle":
      case "square":
      case "square_cross":
      case "square_x":
      case "star":
      case "triangle":
      case "x":
        return true
      default:
        return false
    }
  }

  constructor(regl_wrapper: ReglWrapper, readonly glyph: MarkerLikeView, readonly marker_type: MarkerType) {
    super(regl_wrapper, glyph)

    this._marker_type = marker_type
    this._antialias = 0.8
  }

  draw(_indices: number[], main_glyph: MarkerLikeView, transform: Transform): void {
    // The main glyph has the data, *this* glyph has the visuals.
    const mainGlGlyph = main_glyph.glglyph!

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    if (mainGlGlyph.data_changed) {
      mainGlGlyph._set_data()
      mainGlGlyph.data_changed = false
    }

    const size = (this.glyph instanceof CircleView && this.glyph.radius != null)
      ? map(this.glyph.sradius, (radius) => 2*radius)
      : prop_as_array(this.glyph.size)

    this.regl_wrapper.marker(this._marker_type)({
      canvas_size: [transform.width, transform.height],
      pixel_ratio: transform.pixel_ratio,
      center: this._centers,
      nmarkers: this._centers.length / 2,
      antialias: this._antialias,
      size,
      angle: prop_as_array(this.glyph.angle),
      linewidth: prop_as_array(this.glyph.visuals.line.line_width),
      fg_color: this._line_rgba,
      bg_color: this._fill_rgba,
    })
  }

  protected _set_data(): void {
    const nmarkers = this.glyph.sx.length

    if (this._centers === undefined)
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
  }

  protected _set_visuals(): void {
    const fill = this.glyph.visuals.fill
    const line = this.glyph.visuals.line

    // These create new Uint8Arrays each call.  Should reuse instead.
    this._line_rgba = color_to_uint8_array(line.line_color, line.line_alpha)
    this._fill_rgba = color_to_uint8_array(fill.fill_color, fill.fill_alpha)
  }
}
