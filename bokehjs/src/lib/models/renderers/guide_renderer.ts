import {Renderer, RendererView} from "./renderer"
import type * as p from "core/properties"

export abstract class GuideRendererView extends RendererView {
  declare model: GuideRenderer
  declare visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {
  declare properties: GuideRenderer.Props
  declare __view_type__: GuideRendererView

  constructor(attrs?: Partial<GuideRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.override<GuideRenderer.Props>({
      level: "guide",
    })
  }
}
