import {Renderer, RendererView} from "./renderer"
import {GlyphView} from "../glyphs/glyph"
import {Scale} from "../scales/scale"
import {type CartesianFrameView} from "../canvas/cartesian_frame"
import {type PlotView} from "../plots/plot"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"

export abstract class DataRendererView extends RendererView {
  override model: DataRenderer
  override parent: CartesianFrameView
  override visuals: DataRenderer.Visuals

  override get plot_view(): PlotView {
    return this.parent.parent as PlotView
  }

  get xscale(): Scale {
    return this.coordinates.x_scale
  }

  get yscale(): Scale {
    return this.coordinates.y_scale
  }

  abstract get glyph_view(): GlyphView
}

export namespace DataRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface DataRenderer extends DataRenderer.Attrs {}

export abstract class DataRenderer extends Renderer {
  override properties: DataRenderer.Props
  override __view_type__: DataRendererView

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
