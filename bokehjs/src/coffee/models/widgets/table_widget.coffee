import * as _ from "underscore"

import * as Widget from "./widget"
import * as p from "../../core/properties"

class TableWidget extends Widget.Model
  type: "TableWidget"

  @define {
      source: [ p.Instance ]
    }

module.exports =
  Model: TableWidget
