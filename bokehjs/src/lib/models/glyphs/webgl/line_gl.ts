import {Transform} from "./base"
import {BaseLineGL, LineGLVisuals} from "./base_line"
import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {LineView} from "../line"

export class LineGL extends BaseLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LineView) {
    super(regl_wrapper, glyph)
  }

  override draw(_indices: number[], main_glyph: LineView, transform: Transform): void {
    // _indices are ignored.
    this._draw_impl(transform, main_glyph.glglyph!)
  }

  protected override _get_visuals(): LineGLVisuals {
    return this.glyph.visuals
  }

  protected override _set_data_points(): Float32Array {
    const sx = this.glyph.sx
    const sy = this.glyph.sy

    const npoints = sx.length

    this._is_closed = (npoints > 2 && sx[0] == sx[npoints-1] && sy[0] == sy[npoints-1] &&
                       isFinite(sx[0]) && isFinite(sy[0]))

    if (this._points == null)
      this._points = new Float32Buffer(this.regl_wrapper)
    const points_array = this._points.get_sized_array((npoints+2)*2)

    for (let i = 1; i < npoints+1; i++) {
      points_array[2*i  ] = sx[i-1]
      points_array[2*i+1] = sy[i-1]
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

    return points_array
  }
}
