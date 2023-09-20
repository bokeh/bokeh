import {Renderer, RendererView} from "./renderer"
import type {GlyphView} from "../glyphs/glyph"
import type {Scale} from "../scales/scale"
import type {AutoRanged} from "../ranges/auto_ranged"
import {Dimensions, auto_ranged} from "../ranges/auto_ranged"
import type {SelectionManager} from "core/selection_manager"
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

  bounds_dimensions(): Dimensions {
    return this.model.auto_ranging
  }

  bounds(): Rect {
    return this.glyph_view.bounds()
  }

  log_bounds(): Rect {
    return this.glyph_view.log_bounds()
  }
}

export namespace DataRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    auto_ranging: p.Property<Dimensions>
  }

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
    this.define<DataRenderer.Props>(() => ({
      auto_ranging: [ Dimensions, "both" ],
    }))

    this.override<DataRenderer.Props>({
      level: "glyph",
    })
  }

  abstract get_selection_manager(): SelectionManager

  get selection_manager(): SelectionManager {
    return this.get_selection_manager()
  }
}
