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
}

export interface GuideRenderer extends Renderer, GuideRenderer.Attrs {}

export abstract class GuideRenderer extends Renderer {

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
