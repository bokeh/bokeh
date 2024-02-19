import type {Transform} from "./base"
import {BaseLineGL} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {GlyphView} from "../glyph"

export abstract class SingleLineGL extends BaseLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: GlyphView) {
    super(regl_wrapper, glyph)
  }

  abstract override draw(indices: number[], main_glyph: GlyphView, transform: Transform): void

  protected _draw_impl(indices: number[], transform: Transform, main_gl_glyph: SingleLineGL): void {
    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const data_changed_or_mapped = main_gl_glyph.data_changed || main_gl_glyph.data_mapped

    if (data_changed_or_mapped) {
      main_gl_glyph._set_data(main_gl_glyph.data_changed)
    }

    if ((data_changed_or_mapped && main_gl_glyph._is_dashed) || this._is_dashed) {
      // length_so_far is a data property as it depends on point positions in canvas coordinates
      // but is only needed for dashed lines so it also depends on visual properties.
      // Care needed if base glyph is solid but e.g. nonselection glyph is dashed.
      main_gl_glyph._set_length()
    }

    if (data_changed_or_mapped) {
      main_gl_glyph.data_changed = false
      main_gl_glyph.data_mapped = false
    }

    // Get show buffer to account for selected indices.
    const show = this._get_show_buffer(indices, main_gl_glyph)

    const npoints = main_gl_glyph._points!.length/2 - 2
    const nsegments = npoints - 1
    this._draw_single(main_gl_glyph, transform, 0, 0, nsegments, null, show)
  }

  protected abstract _get_show_buffer(indices: number[], main_gl_glyph: BaseLineGL): Uint8Buffer

  protected _set_data(data_changed: boolean): void {
    // If data_changed is false the underlying glyph data has not changed but has been mapped to
    // different canvas coordinates e.g. via pan or zoom. If data_changed is true the data itself
    // has changed, which also implies it has been mapped.
    const points_array = this._set_data_points()

    if (data_changed) {
      // show flags for data, taking into account NaNs but not selected indices
      // Points array includes extra points at each end
      const npoints = points_array.length/2 - 2

      if (this._show == null) {
        this._show = new Uint8Buffer(this.regl_wrapper)
      }
      const show_array = this._show.get_sized_array(npoints+1)
      this._set_show_single(show_array, points_array)
      this._show.update()
    }
  }

  protected abstract _set_data_points(): Float32Array

  protected _set_length(): void {
    const points_array = this._points!.get_array()
    const show_array = this._show!.get_array()

    // Points array includes extra points at each end
    const npoints = points_array.length/2 - 2

    if (this._length_so_far == null) {
      this._length_so_far = new Float32Buffer(this.regl_wrapper)
    }
    const length_so_far = this._length_so_far.get_sized_array(npoints - 1)
    this._set_length_single(length_so_far, points_array, show_array)
    this._length_so_far.update()
  }
}
