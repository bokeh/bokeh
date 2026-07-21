import type {Transform} from "./base"
import type {BaseLineVisuals} from "./base_line"
import {Float32Buffer, Uint8Buffer} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import {SingleLineGL} from "./single_line"
import type {LineView} from "../line"
import type {DataMapping} from "./data_mapping"
import {
  create_data_mapping, data_mapping_is_precise, is_valid_data_point, missing_data_value, pack_data_points,
  with_data_origin,
} from "./data_mapping"
import {resolve_line_dash} from "core/visuals/line"
import {normalize_dash_pattern} from "./dash_cache"
import type {Vec2} from "regl"

export class LineGL extends SingleLineGL {
  private _data_origin: Vec2 = [0, 0]
  private _data_error: Vec2 = [0, 0]
  private _variants_are_solid?: boolean
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: LineView) {
    super(regl_wrapper, glyph)
  }

  override set_data_changed(): void {
    this._data_error = [0, 0]
    super.set_data_changed()
  }

  override draw(indices: number[], main_glyph: LineView, transform: Transform): void {
    this._draw_impl(indices, transform, main_glyph.glglyph!)
  }

  private _all_render_variants_are_solid(): boolean {
    if (this._variants_are_solid != null) {
      return this._variants_are_solid
    }
    const parent = this.glyph.parent
    const views = [
      parent.glyph,
      parent.decimated_glyph,
      parent.selection_glyph,
      parent.nonselection_glyph,
      parent.hover_glyph,
      parent.muted_glyph,
    ].filter((view) => view != null) as LineView[]

    for (const view of views) {
      const {line_dash} = view.visuals.line
      if (normalize_dash_pattern(resolve_line_dash(line_dash.get(0))).length != 0) {
        this._variants_are_solid = false
        return this._variants_are_solid
      }
    }
    this._variants_are_solid = true
    return this._variants_are_solid
  }

  override set_visuals_changed(): void {
    this._variants_are_solid = undefined
    super.set_visuals_changed()
  }

  override get data_mapping(): DataMapping | null {
    if (!this._all_render_variants_are_solid()) {
      return null
    }
    const {x_scale, y_scale} = this.glyph.renderer.coordinates
    const mapping = create_data_mapping(x_scale, y_scale)
    if (mapping == null || !data_mapping_is_precise(mapping, this._data_error)) {
      return null
    }
    return with_data_origin(mapping, this._data_origin)
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
        this._show = this.own(new Uint8Buffer(this.regl_wrapper))
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
    const {data_mapping} = this
    const x = data_mapping != null ? this.glyph.x : this.glyph.sx
    const y = data_mapping != null ? this.glyph.y : this.glyph.sy
    const npoints = x.length

    if (this._points == null) {
      this._points = this.own(new Float32Buffer(this.regl_wrapper))
    }
    const points_array = this._points.get_sized_array((npoints+2)*2)
    if (data_mapping != null) {
      const {origin, error} = pack_data_points(points_array, x, y, data_mapping, 1)
      this._data_origin = origin
      this._data_error = error
      if (!data_mapping_is_precise(data_mapping, error)) {
        this.glyph.ensure_screen_data()
        this._set_points_single(points_array, this.glyph.sx, this.glyph.sy)
        this._points.update()
        return points_array
      }
      const set_missing = (point: number) => {
        const offset = 2*point
        points_array[offset] = missing_data_value
        points_array[offset + 1] = missing_data_value
      }
      const is_closed = npoints > 2 && x[0] == x[npoints - 1] && y[0] == y[npoints - 1] &&
        is_valid_data_point(x[0], y[0], data_mapping)
      if (is_closed) {
        points_array.copyWithin(0, 2*(npoints - 1), 2*npoints)
        points_array.copyWithin(2*(npoints + 1), 4, 6)
      } else {
        set_missing(0)
        set_missing(npoints + 1)
      }
    } else {
      this._set_points_single(points_array, x, y)
    }
    this._points.update()

    return points_array
  }

  protected override _set_data(data_changed: boolean): void {
    const points_array = this._set_data_points()
    if (data_changed) {
      const npoints = this.nvertices
      if (this._show == null) {
        this._show = this.own(new Uint8Buffer(this.regl_wrapper))
      }
      const show = this._show.get_sized_array(npoints + 1)
      const {data_mapping} = this
      if (data_mapping == null) {
        this._set_show_single(show, points_array)
      } else {
        const {x, y} = this.glyph
        let start_valid = npoints > 0 && is_valid_data_point(x[0], y[0], data_mapping)
        for (let i = 1; i < npoints; i++) {
          const end_valid = is_valid_data_point(x[i], y[i], data_mapping)
          show[i] = start_valid && end_valid ? 1 : 0
          start_valid = end_valid
        }
        const closed = npoints > 2 && x[0] == x[npoints - 1] && y[0] == y[npoints - 1]
        if (closed) {
          show[0] = show[npoints - 1]
          show[npoints] = show[1]
        } else {
          show[0] = 0
          show[npoints] = 0
        }
      }
      this._show.update()
    }
  }
}
