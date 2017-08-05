import {Renderer} from "./renderer"
import * as p from "core/properties"

export class GuideRenderer extends Renderer
  type: 'GuideRenderer'

  @define {
      plot:  [ p.Instance               ]
    }

  @override {
    level: 'overlay'
  }
