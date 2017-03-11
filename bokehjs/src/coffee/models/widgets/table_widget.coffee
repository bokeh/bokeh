import {Widget} from "./widget"
import * as p from "core/properties"

export class TableWidget extends Widget
  type: "TableWidget"

  @define {
      source: [ p.Instance ]
    }
