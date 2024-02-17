import type {Transform} from "./base"
import type {BaseLineVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import {SingleLineGL} from "./single_line"
import type {LineView} from "../line"

export class LineGL extends SingleLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LineView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: LineView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!)
  }

  protected override _get_show_buffer(indices: number[], main_gl_glyph: LineGL): Uint8Buffer {
    // If displaying all indices use main glyph's _show.
    // Otherwise use this._show which is updated from the indices and uses
    // main glyph's show to identify if (x, y) are finite or not.
    const main_show: Uint8Buffer = main_gl_glyph._show!
    let show = main_show

    if (indices.length != main_show.length-1) {
      const nonselection = this.glyph.parent.nonselection_glyph == this.glyph
      const n = main_show.length
      const main_show_array = main_show.get_sized_array(n)

      if (this._show == null) {
        this._show = new Uint8Buffer(this.regl_wrapper)
      }
      const show_array = this._show.get_sized_array(n)   // equal to npoints+1
      show_array.fill(0)

      let iprev = indices[0] // Previous index
      if (nonselection && iprev > 0) {
        show_array[iprev] = main_show_array[iprev] // Start of first line
      }

      for (let k = 1; k < indices.length; k++) {
        const i = indices[k]

        if (i == iprev+1) {
          show_array[i] = main_show_array[i]
        } else if (nonselection) {
          // Gap in indices, end previous line and start new one
          show_array[iprev+1] = main_show_array[iprev+1]
          show_array[i] = main_show_array[i]
        }

        iprev = i
      }

      // iprev is now the last index
      if (nonselection && iprev != n-2) {
        show_array[iprev+1] = main_show_array[iprev+1] // End of last line
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
    const sx = this.glyph.sx
    const sy = this.glyph.sy
    const npoints = sx.length

    if (this._points == null) {
      this._points = new Float32Buffer(this.regl_wrapper)
    }
    const points_array = this._points.get_sized_array((npoints+2)*2)
    this._set_points_single(points_array, sx, sy)
    this._points.update()

    return points_array
  }
}
