import type {Transform} from "./base"
import type {MarkerVisuals} from "./base_marker"
import {BaseMarkerGL} from "./base_marker"
import {Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {GLMarkerType} from "./types"
import type {GlyphView} from "../glyph"

export type SingleMarkerGlyphView = GlyphView & {
  visuals: MarkerVisuals
  glglyph?: SingleMarkerGL
}

export abstract class SingleMarkerGL extends BaseMarkerGL {
  protected readonly _show = new Uint8Buffer(this.regl_wrapper)

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
    const main_data_changed = main_gl_glyph.data_changed
    if (main_data_changed || main_gl_glyph.data_mapped) {
      main_gl_glyph.set_data(main_data_changed)
      main_gl_glyph.data_changed = false
      main_gl_glyph.data_mapped = false
    }

    // Update derived glyph data if it has overrides
    const derived_data_changed = this.data_changed
    if (this !== main_gl_glyph && (derived_data_changed || this.data_mapped)) {
      this.set_data(derived_data_changed) // Populate derived buffers
      this.data_changed = false
      this.data_mapped = false
    }

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const nmarkers = main_gl_glyph.nvertices
    const show_all = indices.length >= nmarkers
    const has_show_indices = this._show_indices != null

    const rebuild_show = this._show_nmarkers != nmarkers ||
      (show_all ? has_show_indices : this._have_indices_changed(indices))

    if (rebuild_show) {
      const show_array = this._show.get_sized_array(nmarkers)
      if (show_all) {
        show_array.fill(255)
        this._show_indices = null
      } else {
        show_array.fill(0)
        for (let i = 0; i < indices.length; i++) {
          show_array[indices[i]] = 255
        }
        this._show_indices = indices.slice()
      }
      this._show.update()
      this._show_nmarkers = nmarkers
    }

    this._draw_one_marker_type(this.marker_type, transform, main_gl_glyph, this._show)
  }
}
