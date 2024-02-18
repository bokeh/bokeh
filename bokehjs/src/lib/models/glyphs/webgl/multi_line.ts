import type {Framebuffer2D, Texture2D} from "regl"
import type {Transform} from "./base"
import {BaseLineGL} from "./base_line"
import type {BaseLineVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {AccumulateProps} from "./types"
import type {MultiLineView} from "../multi_line"

export class MultiLineGL extends BaseLineGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: MultiLineView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: MultiLineView, transform: Transform): void {
    // Indices refer to whole lines not line segments
    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const main_gl_glyph = main_glyph.glglyph!
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

    const {data_size} = this.glyph  // Number of lines
    let framebuffer: Framebuffer2D | null = null
    let tex: Texture2D | null = null
    if (data_size > 1) {
      [framebuffer, tex] = this.regl_wrapper.framebuffer_and_texture
    }

    let point_offset = 0
    let prev_index = -1
    for (const index of indices) {
      for (let i = prev_index+1; i < index; i++) {
        // Account for offsets of lines not displayed
        const npoints = main_glyph.sxs.get(i).length
        point_offset += (npoints + 2)*2
      }

      const npoints = main_glyph.sxs.get(index).length
      const nsegments = npoints - 1  // Points array includes extra points at each end

      // Not necessary if just a single line
      if (framebuffer != null) {
        this.regl_wrapper.clear_framebuffer(framebuffer)
      }

      this._draw_single(main_gl_glyph, transform, index, point_offset, nsegments, framebuffer)

      if (framebuffer != null) {
        // Accumulate framebuffer to WebGL canvas
        const accumulate_props: AccumulateProps = {
          scissor: this.regl_wrapper.scissor,
          viewport: this.regl_wrapper.viewport,
          framebuffer_tex: tex!,
        }

        this.regl_wrapper.accumulate()(accumulate_props)
      }

      point_offset += (npoints + 2)*2
      prev_index = index
    }
  }

  protected _get_visuals(): BaseLineVisuals {
    return this.glyph.visuals.line
  }

  protected _set_data(data_changed: boolean): void {
    // If data_changed is false the underlying glyph data has not changed but has been mapped to
    // different canvas coordinates e.g. via pan or zoom. If data_changed is true the data itself
    // has changed, which also implies it has been mapped.

    // Set data properties which are points and show flags for data
    // (taking into account NaNs but not selected indices)
    const line_count = this.glyph.data_size
    const total_point_count =  this.glyph.sxs.data.length

    if (this._points == null) {
      this._points = new Float32Buffer(this.regl_wrapper)
    }
    const points_array = this._points.get_sized_array((total_point_count + 2*line_count)*2)

    let point_offset = 0
    for (let i = 0; i < line_count; i++) {
      // Process a single line at a time.
      const sx = this.glyph.sxs.get(i)
      const sy = this.glyph.sys.get(i)
      const npoints = sx.length

      const points = points_array.subarray(point_offset, point_offset + (npoints+2)*2)
      this._set_points_single(points, sx, sy)

      point_offset += (npoints + 2)*2
    }

    this._points.update()

    if (data_changed) {
      if (this._show == null) {
        this._show = new Uint8Buffer(this.regl_wrapper)
      }
      const show_array = this._show.get_sized_array(total_point_count + line_count)

      let point_offset = 0
      let show_offset = 0
      for (let i = 0; i < line_count; i++) {
        // Process a single line at a time.
        const sx = this.glyph.sxs.get(i)
        const npoints = sx.length

        const points = points_array.subarray(point_offset, point_offset + (npoints+2)*2)

        const show = show_array.subarray(show_offset, show_offset + npoints+1)
        this._set_show_single(show, points)

        point_offset += (npoints + 2)*2
        show_offset += npoints + 1
      }

      this._show.update()
    }
  }

  protected _set_length(): void {
    const line_count = this.glyph.data_size
    const total_point_count =  this.glyph.sxs.data.length

    const points_array = this._points!.get_array()
    const show_array = this._show!.get_array()

    if (this._length_so_far == null) {
      this._length_so_far = new Float32Buffer(this.regl_wrapper)
    }
    const length_so_far = this._length_so_far.get_sized_array(total_point_count - line_count)

    let point_offset = 0
    let show_offset = 0
    let length_offset = 0
    for (let i = 0; i < line_count; i++) {
      const sx = this.glyph.sxs.get(i)
      const npoints = sx.length
      const nsegments = npoints - 1

      const points = points_array.subarray(point_offset, point_offset + (npoints+2)*2)
      const show = show_array.subarray(show_offset, show_offset + npoints+1)
      const length = length_so_far.subarray(length_offset, length_offset + nsegments)
      this._set_length_single(length, points, show)

      point_offset += (npoints + 2)*2
      show_offset += npoints + 1
      length_offset += nsegments
    }

    this._length_so_far.update()
  }
}
