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

  export type Visuals = Renderer.Visuals

  export interface Opts extends Renderer.Opts {}
}

export interface GuideRenderer extends GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {

  constructor(attrs?: Partial<GuideRenderer.Attrs>, opts?: GuideRenderer.Opts) {
    super(attrs, opts)
  }

  static initClass() {
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
