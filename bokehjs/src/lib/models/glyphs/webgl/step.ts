import type {Transform} from "./base"
import type {BaseLineVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import {SingleLineGL} from "./single_line"
import type {StepView} from "../step"
import {assert} from "core/util/assert"

export class StepGL extends SingleLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: StepView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: StepView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!)
  }

  protected override _get_show_buffer(indices: number[], main_gl_glyph: StepGL): Uint8Buffer {
    const main_show: Uint8Buffer = main_gl_glyph._show!
    let show = main_show

    const n = main_show.length
    const expected_full_length = main_gl_glyph.glyph.x.length

    if (indices.length != expected_full_length) {
      const main_show_array = main_show.get_sized_array(n)

      if (this._show == null) {
        this._show = new Uint8Buffer(this.regl_wrapper)
      }
      const show_array = this._show.get_sized_array(n)   // equal to npoints+1
      show_array.fill(0)

      if (indices.length > 1) {
        for (let k = 0; k < indices.length; k++) {
          const i = indices[k]
          const inext = indices[k+1]
          const idx = i*2 + 1
          if (i == inext-1) {
            show_array[idx] = main_show_array[idx]
            show_array[idx+1] = main_show_array[idx+1]
          }
        }
      }

      this._show.update()
      show = this._show
    }

    return show
  }

  protected override _get_visuals(): BaseLineVisuals {
    return this.glyph.visuals.line
  }

  protected override _set_data_points(): Float32Array {
    const indices: number[] = new Array(this.glyph.sx.length)
    for (let i = 0; i < indices.length; i++) {
      indices[i] = i
    }

    // Same as canvas renderer. Includes padding
    const {xs, ys} = this.glyph.build_step_path(indices)
    const npoints = xs.length
    const is_closed = (npoints > 2 && xs[0] === xs[npoints-1] && ys[0] === ys[npoints-1] &&
               isFinite(xs[0]) && isFinite(ys[0]))

    if (this._points == null) {
      this._points = new Float32Buffer(this.regl_wrapper)
    }
    const points_array = this._points.get_sized_array((npoints+2)*2)

    let j = 2

    for (let k = 0; k < npoints; k++) {
      const x = xs[k]
      const y = ys[k]
      points_array[j++] = isFinite(x) ? x : NaN
      points_array[j++] = isFinite(y) ? y : NaN
    }

    assert(j == npoints*2 + 2)

    if (is_closed) {
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
