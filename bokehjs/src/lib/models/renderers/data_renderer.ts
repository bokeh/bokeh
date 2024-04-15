import {Renderer, RendererView} from "./renderer"
import type {GlyphView} from "../glyphs/glyph"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/data_range1d"
import {auto_ranged} from "../ranges/data_range1d"
import type {SelectionManager} from "core/selection_manager"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type * as p from "core/properties"
import type {Rect} from "core/types"

export abstract class DataRendererView extends RendererView implements AutoRanged {
  declare model: DataRenderer
  declare visuals: DataRenderer.Visuals

  get xscale(): Scale {
    return this.coordinates.x_scale
  }

  get yscale(): Scale {
    return this.coordinates.y_scale
  }

  protected abstract get glyph_view(): GlyphView

  readonly [auto_ranged] = true

  bounds(): Rect {
    return this.glyph_view.bounds()
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

  constructor(attrs?: Partial<DataRenderer.Attrs>) {
    super(attrs)
  }

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
