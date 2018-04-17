import {Renderer, RendererView} from "./renderer"
import {Plot} from "../plots/plot"
import * as p from "core/properties"

export abstract class GuideRendererView extends RendererView {
  model: GuideRenderer
  visuals: GuideRenderer.Visuals
}

export namespace GuideRenderer {
  export interface Attrs extends Renderer.Attrs {
    plot: Plot
  }

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

    this.define({
      plot: [ p.Instance ],
    })

    this.override({
      level: "overlay",
    })
  }
}
GuideRenderer.initClass()
