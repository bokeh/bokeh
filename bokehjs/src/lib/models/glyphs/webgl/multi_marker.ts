import type {Transform} from "./base"
import type {MarkerVisuals} from "./base_marker"
import {BaseMarkerGL} from "./base_marker"
import type {ReglWrapper} from "./regl_wrap"
import {interleave} from "./webgl_utils"
import {Uint8Buffer} from "./buffer"
import type {ScatterView} from "../scatter"
import type {GlyphView} from "../glyph"
import {MarkerType} from "core/enums"
import type {Uniform} from "core/uniforms"
import type {ExtMarkerType} from "core/properties"

export interface MultiMarkerView extends GlyphView {
  readonly size: Uniform<number>
  readonly angle: Uniform<number>
  readonly marker: Uniform<MarkerType | ExtMarkerType | null>
  readonly visuals: GlyphView["visuals"] & MarkerVisuals
}

/**
 * Shared WebGL implementation for glyphs that render marker instances.
 * Adapters supply centers and may map item indices and uniforms to instances.
 * They must set nvertices to the instance count and invalidate data and visuals
 * when the item-to-instance mapping changes, even if its length is unchanged.
 * Main and derived glyphs must use the same adapter and instance ordering.
 */
export abstract class BaseMultiMarkerGL<G extends MultiMarkerView> extends BaseMarkerGL {
  protected _marker_types?: Uniform<MarkerType | ExtMarkerType | null>
  protected _unique_marker_types: (MarkerType | null)[] = []
  private readonly _show_by_type = new Map<MarkerType, Uint8Buffer>()
  private readonly _nshow_by_type = new Map<MarkerType, number>()
  private _show_marker_types?: Uniform<MarkerType | ExtMarkerType | null>

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: G) {
    super(regl_wrapper, glyph)
  }

  private _main_gl_glyph(main_glyph: GlyphView): BaseMultiMarkerGL<MultiMarkerView> {
    const main_gl_glyph = main_glyph.glglyph
    if (!(main_gl_glyph instanceof BaseMultiMarkerGL) || main_gl_glyph.constructor !== this.constructor) {
      throw new Error("expected matching multi-marker WebGL glyphs")
    }
    return main_gl_glyph
  }

  override draw(indices: Int32Array, main_glyph: GlyphView, transform: Transform): void {
    // The main glyph has the geometry, this glyph has the visuals.
    const main_gl_glyph = this._main_gl_glyph(main_glyph)

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
      this._show_marker_types !== marker_types || this._have_indices_changed(indices)

    if (rebuild_show) {
      this._nshow_by_type.clear()

      const marker_indices = main_gl_glyph._marker_indices(indices)
      const is_single_marker_type = marker_types.is_scalar
      if (is_single_marker_type) {
        const single_marker_type = marker_gl._unique_marker_types[0]
        if (single_marker_type != null) {
          const buffer = this._show_by_type.has(single_marker_type) ? this._show_by_type.get(single_marker_type)! : new Uint8Buffer(this.regl_wrapper)
          const array = buffer.get_sized_array(nmarkers).fill(0)
          for (let i = 0; i < marker_indices.length; i++) {
            array[marker_indices[i]] = 255
          }
          this._show_by_type.set(single_marker_type, buffer)
          this._nshow_by_type.set(single_marker_type, marker_indices.length)
        }
      } else {
        for (const buffer of this._show_by_type.values()) {
          buffer.get_sized_array(nmarkers).fill(0)
        }
        for (const marker_type of marker_gl._unique_marker_types) {
          if (marker_type != null && !this._show_by_type.has(marker_type)) {
            const buffer = new Uint8Buffer(this.regl_wrapper)
            buffer.get_sized_array(nmarkers).fill(0)
            this._show_by_type.set(marker_type, buffer)
          }
        }
        for (const index of marker_indices) {
          const marker_type = marker_types.get(index)
          if (MarkerType.valid(marker_type)) {
            this._show_by_type.get(marker_type)!.get_sized_array(nmarkers)[index] = 255
            this._nshow_by_type.set(marker_type, (this._nshow_by_type.get(marker_type) ?? 0) + 1)
          }
        }
      }

      for (const buffer of this._show_by_type.values()) {
        buffer.update()
      }
      this._show_indices = indices.slice()
      this._show_nmarkers = nmarkers
      this._show_marker_types = marker_types
    }

    for (const marker_type of marker_gl._unique_marker_types) {
      if (marker_type == null || this._nshow_by_type.get(marker_type) == null) {
        continue
      }
      this._draw_one_marker_type(marker_type, transform, main_gl_glyph, this._show_by_type.get(marker_type)!)
    }
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected _marker_indices(indices: Int32Array): Int32Array | Uint32Array {
    return indices
  }

  protected abstract _set_centers(nmarkers: number, data_changed: boolean): void

  protected override _set_data(data_changed: boolean = true): void {
    // Establish any item-to-marker mapping before expanding data or visuals.
    this._set_centers(this.nvertices, data_changed)

    this._widths.set_from_prop(this._map_uniform(this.glyph.size))
    this._angles.set_from_prop(this._map_uniform(this.glyph.angle))

    if (data_changed || this._marker_types == null) {
      this._marker_types = this._map_uniform(this.glyph.marker)
      this._unique_marker_types = this._marker_types.unique().filter((marker) => MarkerType.valid(marker))
    }
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
    this._auxs.set_from_scalar(0)
  }
}

export class MultiMarkerGL extends BaseMultiMarkerGL<ScatterView> {
  protected override _set_centers(nmarkers: number, _data_changed: boolean): void {
    const centers = this._centers.get_sized_array(2*nmarkers)
    interleave(this.glyph.sx, this.glyph.sy, nmarkers, BaseMarkerGL.missing_point, centers)
    this._centers.update()
  }
}
