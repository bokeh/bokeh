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
const missing_point = -1e10


type MarkerLikeView = ScatterView | CircleView


function color_to_uint8_array(color_prop: Uniform<uint32>, alpha_prop: Uniform<number>, indices: number[]): Uint8Array {
  const ncolors: number = color_prop.is_Scalar() && alpha_prop.is_Scalar() ? 1 : indices.length
  const rgba: Uint8Array = new Uint8Array(4*ncolors)

  for (let j = 0; j < ncolors; j++) {
    const i = indices[j]
    const [r, g, b, a] = color2rgba(color_prop.get(i), alpha_prop.get(i))
    rgba[4*j  ] = r
    rgba[4*j+1] = g
    rgba[4*j+2] = b
    rgba[4*j+3] = a
  }
  return rgba
}


function prop_as_array(prop: Uniform<number>, indices: number[]): number[] | Float32Array {
  if (prop === undefined)
    return []
  else if (prop.is_Scalar())
    return [prop.value]
  else {
    const array = new Float32Array(indices.length)
    for (let j = 0; j < indices.length; j++) {
      const i = indices[j]
      array[j] = prop.get(i)
    }
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

  draw(indices: number[], _main_glyph: MarkerLikeView, transform: Transform): void {

    if (this.visuals_changed) {
      this._set_visuals(indices)
      this.visuals_changed = false
    }

    if (this.data_changed) {
      this._set_data(indices)
      this.data_changed = false
    }

    if (this._centers === undefined || this._sizes.length == 0) {
      // This is needed (temporarily) to avoid problems with multiple circles.
      console.log('aborting draw early', (this._centers === undefined), this._sizes.length)
      return
    }

    this.regl_wrapper.marker(this._marker_type)({
      canvas_size: [transform.width, transform.height],
      pixel_ratio: transform.pixel_ratio,
      center: this._centers,
      nmarkers: indices.length,
      antialias: this._antialias,
      size: this._sizes,
      angle: this._angles,
      linewidth: this._linewidths,
      fg_color: this._line_rgba,
      bg_color: this._fill_rgba,
    })
  }

  protected _set_data(indices: number[]): void {
    const nmarkers = indices.length

    if (this._centers === undefined || this._centers.length != nmarkers*2)
      this._centers = new Float32Array(nmarkers*2)

    for (let j = 0; j < nmarkers; j++) {
      const i = indices[j]
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        this._centers[2*j  ] = this.glyph.sx[i]
        this._centers[2*j+1] = this.glyph.sy[i]
      } else {
        this._centers[2*j  ] = missing_point
        this._centers[2*j+1] = missing_point
      }
    }

    // If marker is a circle with radius specified, need to update here rather
    // than in _set_visuals as need to respond to change of scale.
    if (this.glyph instanceof CircleView && this.glyph.radius != null) {
      this._sizes = new Float32Array(nmarkers)

      for (let j = 0; j < nmarkers; j++) {
        const i = indices[j]
        this._sizes[j] = this.glyph.sradius[i]*2
      }
    }
  }

  protected _set_visuals(indices: number[]): void {
    const fill = this.glyph.visuals.fill
    const line = this.glyph.visuals.line

    // If marker is a circle with radius specified, sizes are updated in
    // _set_data instead.
    if (!(this.glyph instanceof CircleView && this.glyph.radius != null))
      this._sizes = prop_as_array(this.glyph.size, indices)

    this._angles = prop_as_array(this.glyph.angle, indices)
    this._linewidths = prop_as_array(line.line_width, indices)

    // These create new Uint8Arrays each call.  Should reuse instead.
    this._line_rgba = color_to_uint8_array(line.line_color, line.line_alpha, indices)
    this._fill_rgba = color_to_uint8_array(fill.fill_color, fill.fill_alpha, indices)
  }
}
