import {Renderer, RendererView} from "./renderer"
import * as p from "core/properties"

export abstract class GuideRendererView extends RendererView {
  model: GuideRenderer
  visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {
  properties: GuideRenderer.Props

  constructor(attrs?: Partial<GuideRenderer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.override({
      level: "overlay",
    })
  }
}
GuideRenderer.initClass()
