import * as _ from "underscore"

import {Range} from "./range"
import * as p from "../../core/properties"

export class DataRange extends Range
  type: 'DataRange'

  @define {
      names:     [ p.Array, [] ]
      renderers: [ p.Array, [] ]
    }
