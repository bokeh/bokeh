import * as _ from "underscore"

import {Model} from "../../model"
import * as p from "../../core/properties"

class Range extends Model
  type: 'Range'

  @define {
      callback: [ p.Instance ]
    }

  @internal {
    plots: [ p.Array, [] ]
  }

  reset: () ->

export {
  Range as Model
}
