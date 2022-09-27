import {Transform} from "./base"
import {BaseLineGL, LineGLVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {LineView} from "../line"

export class LineGL extends BaseLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LineView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: LineView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!)
  }

  protected override _get_show_buffer(indices: number[], main_gl_glyph: LineGL): Uint8Buffer {
    // If displaying all indices use main glyph's _show.
    // Otherwise use this._show which is updated from the indices.
    const main_show: Uint8Buffer = main_gl_glyph._show!
    let show = main_show

    if (indices.length != main_show.length-1) {
      const n = main_show.length
      const main_show_array = main_show.get_sized_array(n)

      if (this._show == null)
        this._show = new Uint8Buffer(this.regl_wrapper)
      const show_array = this._show.get_sized_array(n)   // equal to npoints+1
      show_array.fill(0)

      for (let k = 0; k < indices.length; k++) {
        if (indices[k+1] == indices[k]+1 && main_show_array[indices[k]+1])
          show_array[indices[k]+1] = 1
      }

      this._show.update()
      show = this._show
    }

    return show
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
