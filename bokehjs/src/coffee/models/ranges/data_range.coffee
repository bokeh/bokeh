import * as _ from "underscore"

import * as Range from "./range"
import * as p from "../../core/properties"

class DataRange extends Range.Model
  type: 'DataRange'

  @define {
      names:     [ p.Array, [] ]
      renderers: [ p.Array, [] ]
    }

module.exports =
  Model: DataRange
