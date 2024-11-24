import type {Transform} from "./base"
import type {MarkerVisuals} from "./base_marker"
import {BaseMarkerGL} from "./base_marker"
import type {ReglWrapper} from "./regl_wrap"
import {interleave} from "./webgl_utils"
import type {ScatterView} from "../scatter"
import type {MarkerType} from "core/enums"
import type {Uniform} from "core/uniforms"

export class MultiMarkerGL extends BaseMarkerGL {

  // data properties, either all or none are set.
  protected _marker_types?: Uniform<MarkerType | null>
  protected _unique_marker_types: (MarkerType | null)[]

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: ScatterView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: ScatterView, transform: Transform): void {
    // The main glyph has the data, this glyph has the visuals.
    const main_gl_glyph = main_glyph.glglyph!

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

    const ntypes = main_gl_glyph._unique_marker_types.length
    for (const marker_type of main_gl_glyph._unique_marker_types) {
      if (marker_type == null) {
        continue
      }

      let nshow = nmarkers  // Number of markers to show.
      const prev_nmarkers = this._show.length
      const show_array = this._show.get_sized_array(nmarkers)
      if (ntypes > 1 || indices.length < nmarkers) {
        this._show_all = false

        // Reset all show values to zero.
        show_array.fill(0)

        // Set show values of markers to render to 255.
        nshow = 0
        for (const k of indices) {  // Marker index.
          if (ntypes == 1 || main_gl_glyph._marker_types!.get(k) == marker_type) {
            show_array[k] = 255
            nshow++
          }
        }
      } else if (!this._show_all || prev_nmarkers != nmarkers) {
        this._show_all = true
        show_array.fill(255)
      }
      this._show.update()

      if (nshow == 0) {
        continue
      }

      this._draw_one_marker_type(marker_type, transform, main_gl_glyph)
    }
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected _set_data(): void {
    const nmarkers = this.nvertices

    const centers_array = this._centers.get_sized_array(2*nmarkers)
    interleave(this.glyph.sx, this.glyph.sy, nmarkers, BaseMarkerGL.missing_point, centers_array)
    this._centers.update()

    this._widths.set_from_prop(this.glyph.size)
    this._angles.set_from_prop(this.glyph.angle)

    this._marker_types = this.glyph.marker as any // TODO
    this._unique_marker_types = [...new Set(this._marker_types)]
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
    this._auxs.set_from_scalar(0)
  }
}
