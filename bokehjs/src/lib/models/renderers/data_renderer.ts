import {Renderer, RendererView} from "./renderer"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"

export abstract class DataRendererView extends RendererView {
  model: DataRenderer
  visuals: DataRenderer.Visuals
}

export namespace DataRenderer {
  export interface Attrs extends Renderer.Attrs {
    x_range_name: string
    y_range_name: string
  }

  export interface Props extends Renderer.Props {
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
  }

  export type Visuals = Renderer.Visuals
}

export interface DataRenderer extends DataRenderer.Attrs {}

export abstract class DataRenderer extends Renderer {
  properties: DataRenderer.Props

  constructor(attrs?: Partial<DataRenderer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DataRenderer"

    this.define({
      x_range_name: [ p.String, 'default' ],
      y_range_name: [ p.String, 'default' ],
    })
  }

  abstract get_selection_manager(): SelectionManager
}
DataRenderer.initClass()
