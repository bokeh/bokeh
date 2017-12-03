import {Renderer} from "./renderer"
import {Plot} from "../plots/plot"
import * as p from "core/properties"

export class GuideRenderer extends Renderer
  type: 'GuideRenderer'

  `
  plot: Plot
  `

  @define {
    plot:  [ p.Instance ]
  }

  @override {
    level: 'overlay'
  }
