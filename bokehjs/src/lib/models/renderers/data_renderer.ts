import {Renderer, RendererView} from "./renderer"
import {Scale} from "../scales/scale"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"

export abstract class DataRendererView extends RendererView {
  model: DataRenderer
  visuals: DataRenderer.Visuals

  get xscale(): Scale {
    return this.coordinates.x_scale
  }

  get yscale(): Scale {
    return this.coordinates.y_scale
  }
}

export namespace DataRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface DataRenderer extends DataRenderer.Attrs {}

export abstract class DataRenderer extends Renderer {
  properties: DataRenderer.Props
  __view_type__: DataRendererView

  constructor(attrs?: Partial<DataRenderer.Attrs>) {
    super(attrs)
  }

  static init_DataRenderer(): void {
    this.override({
      level: 'glyph',
    })
  }

  abstract get_selection_manager(): SelectionManager
}
