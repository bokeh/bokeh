import {Transform} from "./base"
import {BaseLineGL, LineGLVisuals} from "./base_line"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {StepView} from "../step"
import {assert, unreachable} from "core/util/assert"

export class StepGL extends BaseLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: StepView) {
    super(regl_wrapper, glyph)
  }

  override draw(_indices: number[], main_glyph: StepView, transform: Transform): void {
    // _indices are ignored.
    this._draw_impl(transform, main_glyph.glglyph!)
  }

  protected override _get_visuals(): LineGLVisuals {
    return this.glyph.visuals
  }

  protected override _set_data_points(): Float32Array {
    const sx = this.glyph.sx
    const sy = this.glyph.sy
    const mode = this.glyph.model.mode

    let npoints = sx.length

    this._is_closed = (npoints > 2 && sx[0] == sx[npoints-1] && sy[0] == sy[npoints-1] &&
                       isFinite(sx[0]) && isFinite(sy[0]))

    const nstep_points = mode == "center" ? 2*npoints : 2*npoints-1

    if (this._points == null)
      this._points = new Float32Buffer(this.regl_wrapper)
    const points_array = this._points.get_sized_array((nstep_points+2)*2)

    // WebGL renderer needs just one of (x, y) coordinates of inserted step points
    // to be NaN for it to be rendered correctly.
    let is_finite = isFinite(sx[0] + sy[0])
    let j = 2
    if (mode == "center") {
      points_array[j++] = is_finite ? sx[0] : NaN
      points_array[j++] = sy[0]
    }
    for (let i = 0; i < npoints-1; i++) {
      const next_finite = isFinite(sx[i+1] + sy[i+1])
      switch (mode) {
        case "before":
          points_array[j++] = is_finite ? sx[i] : NaN
          points_array[j++] = sy[i]
          if (i < npoints-1) {
            points_array[j++] = is_finite && next_finite ? sx[i] : NaN
            points_array[j++] = sy[i+1]
          }
          break
        case "after":
          points_array[j++] = is_finite ? sx[i] : NaN
          points_array[j++] = sy[i]
          if (i < npoints-1) {
            points_array[j++] = is_finite && next_finite ? sx[i+1] : NaN
            points_array[j++] = sy[i]
          }
          break
        case "center":
          if (is_finite && next_finite) {
            const midx = (sx[i] + sx[i+1])/2
            points_array[j++] = midx
            points_array[j++] = sy[i]
            points_array[j++] = midx
            points_array[j++] = sy[i+1]
          } else {
            points_array[j++] = is_finite ? sx[i] : NaN
            points_array[j++] = sy[i]
            points_array[j++] = next_finite ? sx[i+1] : NaN
            points_array[j++] = sy[i+1]
          }
          break
        default:
          unreachable()
      }
      is_finite = next_finite
    }
    points_array[j++] = is_finite ? sx[npoints-1] : NaN
    points_array[j++] = is_finite ? sy[npoints-1] : NaN
    assert(j == nstep_points*2 + 2)

    npoints = nstep_points

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

    return points_array
  }
}
