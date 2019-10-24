import {Renderer, RendererView} from "./renderer"
import * as p from "core/properties"

export abstract class GuideRendererView extends RendererView {
  model: GuideRenderer
  visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
  }

  export type Visuals = Renderer.Visuals
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {
  properties: GuideRenderer.Props
  __view_type__: GuideRendererView

  constructor(attrs?: Partial<GuideRenderer.Attrs>) {
    super(attrs)
  }

  static init_GuideRenderer(): void {
    this.define<GuideRenderer.Props>({
      x_range_name: [ p.String, "default" ],
      y_range_name: [ p.String, "default" ],
    })

    this.override({
      level: "guide",
    })
  }
}
