import {Renderer, RendererView} from "./renderer"
import * as p from "core/properties"

export abstract class GuideRendererView extends RendererView {
  override model: GuideRenderer
  override visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props

  export type Visuals = Renderer.Visuals
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {
  override properties: GuideRenderer.Props
  override __view_type__: GuideRendererView

  constructor(attrs?: Partial<GuideRenderer.Attrs>) {
    super(attrs)
  }

  static init_GuideRenderer(): void {
    this.override<GuideRenderer.Props>({
      level: "guide",
    })
  }
}
