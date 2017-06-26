import {Widget} from "../widget"
import {CDSView} from "../../sources/cds_view"
import * as p from "core/properties"

export class TableWidget extends Widget
  type: "TableWidget"

  initialize: (options) ->
    super(options)

    if not @view?
      @view = new CDSView({'source': @data_source})

  @define {
      source: [ p.Instance ]
      view:   [ p.Instance ]
    }
