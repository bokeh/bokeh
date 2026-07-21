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
import type {DataMapping} from "./data_mapping"
import {create_data_mapping, data_mapping_is_precise, pack_data_points, with_data_origin} from "./data_mapping"
import type {Vec2} from "regl"

export class MultiMarkerGL extends BaseMarkerGL {
  private _center_mapping_signature: string | null | undefined
  private _data_origin: Vec2 = [0, 0]
  private _data_error: Vec2 = [0, 0]

  // data properties, either all or none are set.
  protected _marker_types?: Uniform<MarkerType | ExtMarkerType | null>
  protected _unique_marker_types: (MarkerType | null)[]
  private readonly _show_by_type = new Map<MarkerType, Uint8Buffer>()
  private readonly _nshow_by_type = new Map<MarkerType, number>()
  private readonly _visible_marker_by_index = new Map<number, MarkerType>()
  private _show_nmarkers: number = -1
  private _show_marker_types?: Uniform<MarkerType | ExtMarkerType | null>

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: ScatterView) {
    super(regl_wrapper, glyph)
  }

  override set_data_changed(): void {
    this._data_error = [0, 0]
    super.set_data_changed()
  }

  override get data_mapping(): DataMapping | null {
    const {x_scale, y_scale} = this.glyph.renderer.coordinates
    const mapping = create_data_mapping(x_scale, y_scale)
    if (mapping == null || !data_mapping_is_precise(mapping, this._data_error)) {
      return null
    }
    return with_data_origin(mapping, this._data_origin)
  }

  override draw(indices: number[], main_glyph: ScatterView, transform: Transform): void {
    // The main glyph has the data, this glyph has the visuals.
    const main_gl_glyph = main_glyph.glglyph!

    const main_data_changed = main_gl_glyph.data_changed
    const main_mapping_signature = main_gl_glyph.data_mapping?.signature ?? null
    const main_mapping_changed = main_mapping_signature != main_gl_glyph._center_mapping_signature
    if (main_data_changed || main_mapping_changed || (main_gl_glyph.data_mapped && main_mapping_signature == null)) {
      main_gl_glyph.set_data(main_data_changed)
      main_gl_glyph._center_mapping_signature = main_gl_glyph.data_mapping?.signature ?? null
    }
    main_gl_glyph.data_changed = false
    main_gl_glyph.data_mapped = false

    const derived_data_changed = this.data_changed
    const derived_mapping_signature = this.data_mapping?.signature ?? null
    const derived_mapping_changed = derived_mapping_signature != this._center_mapping_signature
    if (this !== main_gl_glyph &&
        (derived_data_changed || derived_mapping_changed || (this.data_mapped && derived_mapping_signature == null))) {
      this.set_data(derived_data_changed)
      this._center_mapping_signature = this.data_mapping?.signature ?? null
    }
    if (this !== main_gl_glyph) {
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
    const full_rebuild = main_data_changed || derived_data_changed || this._show_nmarkers != nmarkers ||
      this._show_marker_types !== marker_types
    const selection_changed = this.revision_changed("selection", "multi-marker-masks")

    if (full_rebuild) {
      const current_types = new Set(marker_gl._unique_marker_types.filter((marker) => marker != null))
      for (const [marker_type, buffer] of this._show_by_type) {
        if (!current_types.has(marker_type)) {
          this.release(buffer)
          this._show_by_type.delete(marker_type)
        }
      }
      this._nshow_by_type.clear()
      this._visible_marker_by_index.clear()
      for (const marker_type of marker_gl._unique_marker_types) {
        if (marker_type != null) {
          let buffer = this._show_by_type.get(marker_type)
          if (buffer == null) {
            buffer = this.own(new Uint8Buffer(this.regl_wrapper))
            this._show_by_type.set(marker_type, buffer)
          }
          buffer.get_sized_array(nmarkers).fill(0)
        }
      }
      for (const index of indices) {
        const marker_type = marker_types.get(index)
        if (MarkerType.valid(marker_type)) {
          this._show_by_type.get(marker_type)!.get_sized_array(nmarkers)[index] = 255
          this._nshow_by_type.set(marker_type, (this._nshow_by_type.get(marker_type) ?? 0) + 1)
          this._visible_marker_by_index.set(index, marker_type)
        }
      }
      for (const buffer of this._show_by_type.values()) {
        buffer.update()
      }
      this._show_nmarkers = nmarkers
      this._show_marker_types = marker_types
    } else if (selection_changed) {
      this._patch_selection_masks(indices, marker_types, nmarkers)
    }
    if (full_rebuild || selection_changed) {
      this.consume_revision("selection", "multi-marker-masks")
    }

    for (const marker_type of marker_gl._unique_marker_types) {
      if (marker_type == null || this._nshow_by_type.get(marker_type) == null) {
        continue
      }
      this._draw_one_marker_type(marker_type, transform, main_gl_glyph, this._show_by_type.get(marker_type))
    }
  }

  private _patch_selection_masks(
    indices: number[], marker_types: Uniform<MarkerType | ExtMarkerType | null>, nmarkers: number,
  ): void {
    const next = new Map<number, MarkerType>()
    for (const index of indices) {
      const marker_type = marker_types.get(index)
      if (MarkerType.valid(marker_type)) {
        next.set(index, marker_type)
      }
    }
    const remaining = new Map(next)
    const changed = new Map<MarkerType, number[]>()
    const update = (marker_type: MarkerType, index: number, visible: boolean): void => {
      this._show_by_type.get(marker_type)!.get_sized_array(nmarkers)[index] = visible ? 255 : 0
      let changed_indices = changed.get(marker_type)
      if (changed_indices == null) {
        changed_indices = []
        changed.set(marker_type, changed_indices)
      }
      changed_indices.push(index)
      const count = (this._nshow_by_type.get(marker_type) ?? 0) + (visible ? 1 : -1)
      if (count == 0) {
        this._nshow_by_type.delete(marker_type)
      } else {
        this._nshow_by_type.set(marker_type, count)
      }
    }

    for (const [index, previous_type] of this._visible_marker_by_index) {
      const next_type = remaining.get(index)
      if (next_type == previous_type) {
        remaining.delete(index)
      } else {
        update(previous_type, index, false)
        if (next_type != null) {
          update(next_type, index, true)
          remaining.delete(index)
        }
      }
    }
    for (const [index, marker_type] of remaining) {
      update(marker_type, index, true)
    }

    for (const [marker_type, changed_indices] of changed) {
      const buffer = this._show_by_type.get(marker_type)!
      if (changed_indices.length <= nmarkers/4) {
        buffer.update_ranges(changed_indices)
      } else {
        buffer.update()
      }
    }
    this._visible_marker_by_index.clear()
    for (const [index, marker_type] of next) {
      this._visible_marker_by_index.set(index, marker_type)
    }
  }

  protected override _get_visuals(): MarkerVisuals {
    return this.glyph.visuals
  }

  protected override _set_data(data_changed: boolean = true): void {
    const nmarkers = this.nvertices

    // Always update positions, sizes, and angles (for streaming updates)
    const {data_mapping} = this
    const centers_array = this._centers.get_sized_array(2*nmarkers)
    if (data_mapping != null) {
      const {origin, error} = pack_data_points(centers_array, this.glyph.x, this.glyph.y, data_mapping)
      this._data_origin = origin
      this._data_error = error
      if (!data_mapping_is_precise(data_mapping, error)) {
        this.glyph.ensure_screen_data()
        interleave(this.glyph.sx, this.glyph.sy, nmarkers, BaseMarkerGL.missing_point, centers_array)
      }
    } else {
      interleave(this.glyph.sx, this.glyph.sy, nmarkers, BaseMarkerGL.missing_point, centers_array)
    }
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
