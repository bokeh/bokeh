import type {Framebuffer2D, Texture2D} from "regl"
import type {Transform} from "./base"
import {BaseLineGL} from "./base_line"
import type {BaseLineVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {AccumulateProps} from "./types"
import type {GlyphView} from "../glyph"
import type {ScreenLine} from "../curve"

export interface PathGlyphView extends GlyphView {
  readonly visuals: GlyphView["visuals"] & {line: BaseLineVisuals}
  glglyph?: PathGL
  webgl_lines(): ScreenLine[]
  webgl_line_indices?(indices: number[], line_count: number): number[]
}

/** Render screen-space line collections produced by arbitrary glyph geometry.
 * Each source row normally produces one line, while scalar glyphs such as
 * Spline can return one aggregate line and override webgl_line_indices(). */
export class PathGL extends BaseLineGL {
  private _point_offsets: number[] = []
  private _point_counts: number[] = []
  private _line_count = 0

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: PathGlyphView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: GlyphView, transform: Transform): void {
    const main_path = main_glyph as PathGlyphView
    const main_gl = main_path.glglyph!

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const data_changed_or_mapped = main_gl.data_changed || main_gl.data_mapped
    if (data_changed_or_mapped) {
      main_gl._set_data(main_gl.data_changed)
    }
    if ((data_changed_or_mapped && main_gl._is_dashed) || this._is_dashed) {
      main_gl._set_length()
    }
    if (data_changed_or_mapped) {
      main_gl.data_changed = false
      main_gl.data_mapped = false
    }

    const selected = this.glyph.webgl_line_indices?.(indices, main_gl._line_count) ??
      indices.filter((index) => index >= 0 && index < main_gl._line_count)

    let framebuffer: Framebuffer2D | null = null
    let texture: Texture2D | null = null
    if (main_gl._line_count > 1) {
      [framebuffer, texture] = this.regl_wrapper.framebuffer_and_texture
    }

    for (const index of selected) {
      const nsegments = main_gl._point_counts[index] - 1
      if (nsegments <= 0) {
        continue
      }
      if (framebuffer != null) {
        this.regl_wrapper.clear_framebuffer(framebuffer)
      }
      const scissor = this._draw_single(
        main_gl, transform, index, main_gl._point_offsets[index], nsegments, framebuffer,
      )
      if (framebuffer != null) {
        const props: AccumulateProps = {
          scissor,
          viewport: this.regl_wrapper.viewport,
          framebuffer_tex: texture!,
        }
        this.regl_wrapper.accumulate()(props)
      }
    }
  }

  protected override _get_visuals(): BaseLineVisuals {
    return this.glyph.visuals.line
  }

  protected override _set_data(_data_changed: boolean): void {
    const lines = this.glyph.webgl_lines()
    this._line_count = lines.length
    this._point_offsets.length = lines.length
    this._point_counts.length = lines.length

    let total_points = 0
    for (const {sx, sy} of lines) {
      total_points += Math.min(sx.length, sy.length)
    }

    if (this._points == null) {
      this._points = this.own(new Float32Buffer(this.regl_wrapper))
    }
    const points_array = this._points.get_sized_array((total_points + 2*lines.length)*2)

    let point_offset = 0
    for (let i = 0; i < lines.length; i++) {
      const {sx, sy} = lines[i]
      const npoints = Math.min(sx.length, sy.length)
      this._point_offsets[i] = point_offset
      this._point_counts[i] = npoints
      const points = points_array.subarray(point_offset, point_offset + (npoints + 2)*2)
      this._set_points_single(points, sx, sy)
      point_offset += (npoints + 2)*2
    }
    this._points.update()

    if (this._show == null) {
      this._show = this.own(new Uint8Buffer(this.regl_wrapper))
    }
    const show_array = this._show.get_sized_array(total_points + lines.length)
    point_offset = 0
    let show_offset = 0
    for (let i = 0; i < lines.length; i++) {
      const npoints = this._point_counts[i]
      const points = points_array.subarray(point_offset, point_offset + (npoints + 2)*2)
      const show = show_array.subarray(show_offset, show_offset + npoints + 1)
      this._set_show_single(show, points)
      point_offset += (npoints + 2)*2
      show_offset += npoints + 1
    }
    this._show.update()
  }

  private _set_length(): void {
    const points_array = this._points!.get_array()
    const show_array = this._show!.get_array()
    const length_count = this._point_counts.reduce((total, count) => total + Math.max(0, count - 1), 0)
    if (this._length_so_far == null) {
      this._length_so_far = this.own(new Float32Buffer(this.regl_wrapper))
    }
    const lengths = this._length_so_far.get_sized_array(length_count)

    let point_offset = 0
    let show_offset = 0
    let length_offset = 0
    for (const npoints of this._point_counts) {
      const nsegments = Math.max(0, npoints - 1)
      const points = points_array.subarray(point_offset, point_offset + (npoints + 2)*2)
      const show = show_array.subarray(show_offset, show_offset + npoints + 1)
      const length = lengths.subarray(length_offset, length_offset + nsegments)
      this._set_length_single(length, points, show)
      point_offset += (npoints + 2)*2
      show_offset += npoints + 1
      length_offset += nsegments
    }
    this._length_so_far.update()
  }
}
