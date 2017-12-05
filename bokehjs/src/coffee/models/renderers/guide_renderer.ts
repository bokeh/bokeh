import {Renderer, RendererView} from "./renderer"
import {Plot} from "../plots/plot"
import * as p from "core/properties"

export class GuideRendererView extends RendererView {
  visuals: GuideRenderer.Visuals
}

export class GuideRenderer extends Renderer {
  plot: Plot
}

GuideRenderer.prototype.type = "GuideRenderer"

GuideRenderer.define({
  plot: [ p.Instance ]
})

GuideRenderer.override({
  level: "overlay"
})

export module GuideRenderer {
  export type Visuals = Renderer.Visuals
}
