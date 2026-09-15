import type {Transform} from "./base"
import type {MarkerVisuals} from "./base_marker"
import {BaseMarkerGL} from "./base_marker"
import type {ReglWrapper} from "./regl_wrap"
import {interleave} from "./webgl_utils"
import type {ScatterView} from "../scatter"
import {MarkerType} from "core/enums"
import type {Uniform} from "core/uniforms"
import type {ExtMarkerType} from "core/properties"
import {Uint8Buffer} from "./buffer"

export class MultiMarkerGL extends BaseMarkerGL {

  // data properties, either all or none are set.
  protected _marker_types?: Uniform<MarkerType | ExtMarkerType | null>
  protected _unique_marker_types: (MarkerType | null)[]
  private readonly _show_by_type = new Map<MarkerType, Uint8Buffer>()
  private readonly _nshow_by_type = new Map<MarkerType, number>()
  private _show_indices: number[] | null = null
  private _show_nmarkers: number = -1
  private _show_marker_types?: Uniform<MarkerType | ExtMarkerType | null>

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: ScatterView) {
    super(regl_wrapper, glyph)
  }

  override draw(indices: number[], main_glyph: ScatterView, transform: Transform): void {
    // The main glyph has the data, this glyph has the visuals.
    const main_gl_glyph = main_glyph.glglyph!

    const main_data_changed = main_gl_glyph.data_changed
    if (main_data_changed || main_gl_glyph.data_mapped) {
      main_gl_glyph.set_data(main_data_changed)
      main_gl_glyph.data_changed = false
      main_gl_glyph.data_mapped = false
    }

    const derived_data_changed = this.data_changed
    if (this !== main_gl_glyph && (derived_data_changed || this.data_mapped)) {
      this.set_data(derived_data_changed)
      this.data_changed = false
      this.data_mapped = false
    }

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
    }

    const nmarkers = main_gl_glyph.nvertices

    const marker_gl = this !== main_gl_glyph && this._marker_types != null ? this : main_gl_glyph
    const marker_types = marker_gl._marker_types!
    const rebuild_show = main_data_changed || derived_data_changed || this._show_nmarkers != nmarkers ||
      this._show_marker_types !== marker_types || this._show_indices?.length != indices.length ||
      !indices.every((index, i) => this._show_indices![i] == index)

    if (rebuild_show) {
      for (const buffer of this._show_by_type.values()) {
        buffer.get_sized_array(nmarkers).fill(0)
      }
      this._nshow_by_type.clear()
      for (const marker_type of marker_gl._unique_marker_types) {
        if (marker_type != null && !this._show_by_type.has(marker_type)) {
          const buffer = new Uint8Buffer(this.regl_wrapper)
          buffer.get_sized_array(nmarkers).fill(0)
          this._show_by_type.set(marker_type, buffer)
        }
      }
      for (const index of indices) {
        const marker_type = marker_types.get(index)
        if (MarkerType.valid(marker_type)) {
          this._show_by_type.get(marker_type)!.get_sized_array(nmarkers)[index] = 255
          this._nshow_by_type.set(marker_type, (this._nshow_by_type.get(marker_type) ?? 0) + 1)
        }
      }
      for (const buffer of this._show_by_type.values()) {
        buffer.update()
      }
      this._show_indices = [...indices]
      this._show_nmarkers = nmarkers
      this._show_marker_types = marker_types
    }

    for (const marker_type of marker_gl._unique_marker_types) {
      if (marker_type == null || this._nshow_by_type.get(marker_type) == null) {
        continue
      }
      this._draw_one_marker_type(marker_type, transform, main_gl_glyph, this._show_by_type.get(marker_type))
    }
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected override _set_data(data_changed: boolean = true): void {
    const nmarkers = this.nvertices

    // Always update positions, sizes, and angles (for streaming updates)
    const centers_array = this._centers.get_sized_array(2*nmarkers)
    interleave(this.glyph.sx, this.glyph.sy, nmarkers, BaseMarkerGL.missing_point, centers_array)
    this._centers.update()

    this._widths.set_from_prop(this.glyph.size)
    this._angles.set_from_prop(this.glyph.angle)

    if (data_changed || this._marker_types == null) {
      this._marker_types = this.glyph.marker
      this._unique_marker_types = this._marker_types.unique().filter((marker) => MarkerType.valid(marker))
    }
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
    this._auxs.set_from_scalar(0)
  }
}
