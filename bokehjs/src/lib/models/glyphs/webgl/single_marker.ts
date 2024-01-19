import type {Transform} from "./base"
import type {MarkerVisuals} from "./base_marker"
import {BaseMarkerGL} from "./base_marker"
import type {ReglWrapper} from "./regl_wrap"
import type {GLMarkerType} from "./types"
import type {GlyphView} from "../glyph"

export type SingleMarkerGlyphView = GlyphView & {
  visuals: MarkerVisuals
  glglyph?: SingleMarkerGL
}

export abstract class SingleMarkerGL extends BaseMarkerGL {

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: SingleMarkerGlyphView) {
    super(regl_wrapper, glyph)
  }

  abstract get marker_type(): GLMarkerType

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  draw(indices: number[], main_glyph: SingleMarkerGlyphView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!)
  }

  protected _draw_impl(indices: number[], transform: Transform, main_gl_glyph: SingleMarkerGL): void {
    if (main_gl_glyph.data_changed || main_gl_glyph.data_mapped) {
      main_gl_glyph.set_data()
      main_gl_glyph.data_changed = false
      main_gl_glyph.data_mapped = false
    }

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const nmarkers = main_gl_glyph.nvertices

    const prev_nmarkers = this._show.length
    const show_array = this._show.get_sized_array(nmarkers)
    if (indices.length < nmarkers) {
      this._show_all = false

      // Reset all show values to zero.
      show_array.fill(0)

      // Set show values of markers to render to 255.
      for (let j = 0; j < indices.length; j++) {
        show_array[indices[j]] = 255
      }
    } else if (!this._show_all || prev_nmarkers != nmarkers) {
      this._show_all = true
      show_array.fill(255)
    }
    this._show.update()

    this._draw_one_marker_type(main_gl_glyph.marker_type, transform, main_gl_glyph)
  }
}
