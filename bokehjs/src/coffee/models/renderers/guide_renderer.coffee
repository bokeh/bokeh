import * as _ from "underscore"

import * as Renderer from "./renderer"
import * as p from "../../core/properties"

class GuideRenderer extends Renderer.Model
  type: 'GuideRenderer'

  @define {
      plot:  [ p.Instance               ]
    }

  @override {
    level: 'overlay'
  }

export {
  GuideRenderer as Model
}
