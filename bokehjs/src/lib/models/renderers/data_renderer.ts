import {PolarCoordinateTransform} from "../coordinates/polar_mapping"
import {logger} from "core/logging"
import {Renderer, RendererView} from "./renderer"
import type {GlyphView} from "../glyphs/glyph"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/data_range1d"
import {auto_ranged} from "../ranges/data_range1d"
import type {WindowAxis} from "core/enums"
import type {SelectionManager} from "core/selection_manager"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import type {Rect} from "core/types"

export abstract class DataRendererView extends RendererView implements AutoRanged {
  declare model: DataRenderer
  declare visuals: DataRenderer.Visuals

  override get uses_plot_coordinate_system(): boolean {
    return true
  }

  get polar_transform(): PolarCoordinateTransform | null {
    const transform = this.coordinates
    return transform instanceof PolarCoordinateTransform ? transform : null
  }

  protected get supports_polar(): boolean {
    return false
  }

  private _reported_polar_unsupported = false

  override get is_renderable(): boolean {
    if (!super.is_renderable) {
      return false
    }
    if (this.polar_transform != null && this.parent instanceof DataRendererView && !this.parent.is_renderable) {
      return false
    }
    if (this.polar_transform != null && !this.supports_polar) {
      if (!this._reported_polar_unsupported) {
        logger.warn(`Skipping ${this.model.type}: this renderer or its visual-state glyphs are not supported by PolarMapping`)
        this._reported_polar_unsupported = true
      }
      return false
    }
    this._reported_polar_unsupported = false
    return true
  }

  override paint(ctx: Context2d): void {
    const polar = this.polar_transform
    const outer = this.plot_view.polar_transform
    if (polar == null && outer == null) {
      super.paint(ctx)
      return
    }
    if (!this.is_renderable) {
      this.mark_finished()
      return
    }
    ctx.save()
    try {
      ctx.beginPath()
      if (outer != null) {
        outer.trace(ctx)
        ctx.clip()
      }
      if (polar != null && polar != outer) {
        ctx.beginPath()
        polar.trace(ctx)
        ctx.clip()
      }
      super.paint(ctx)
    } finally {
      ctx.restore()
    }
  }

  get xscale(): Scale {
    return this.coordinates.x_scale
  }

  get yscale(): Scale {
    return this.coordinates.y_scale
  }

  protected abstract get glyph_view(): GlyphView

  readonly [auto_ranged] = true

  bounds(window_axis: WindowAxis = "none"): Rect {
    return this.glyph_view.bounds(window_axis)
  }

  log_bounds(): Rect {
    return this.glyph_view.log_bounds()
  }

  abstract hit_test(geometry: Geometry): HitTestResult
}

export namespace DataRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface DataRenderer extends DataRenderer.Attrs {}

export abstract class DataRenderer extends Renderer {
  declare properties: DataRenderer.Props
  declare __view_type__: DataRendererView

  static {
    this.override<DataRenderer.Props>({
      level: "glyph",
    })
  }

  abstract get_selection_manager(): SelectionManager

  get selection_manager(): SelectionManager {
    return this.get_selection_manager()
  }
}
