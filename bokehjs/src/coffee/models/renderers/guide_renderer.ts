import {Renderer, RendererView} from "./renderer"
import {Plot} from "../plots/plot"
import * as p from "core/properties"

export class GuideRendererView extends RendererView {
  visuals: GuideRenderer.Visuals
}

export class GuideRenderer extends Renderer {

  static initClass() {
    this.prototype.type = "GuideRenderer"

    this.define({
      plot: [ p.Instance ],
    })

    this.override({
      level: "overlay",
    })
  }

  plot: Plot
}

GuideRenderer.initClass()

export module GuideRenderer {
  export type Visuals = Renderer.Visuals
}
