import {Renderer, RendererView} from "./renderer"

export abstract class GuideRendererView extends RendererView {
  model: GuideRenderer
  visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export interface Attrs extends Renderer.Attrs {}

  export interface Props extends Renderer.Props {}

  export type Visuals = Renderer.Visuals
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {

  properties: GuideRenderer.Props

  constructor(attrs?: Partial<GuideRenderer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "GuideRenderer"

    this.override({
      level: "overlay",
    })
  }
}
GuideRenderer.initClass()
