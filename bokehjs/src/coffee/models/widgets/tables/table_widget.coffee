import {Widget} from "../widget"
import {CDSView} from "../../sources/cds_view"
import * as p from "core/properties"

export class TableWidget extends Widget
  type: "TableWidget"

  initialize: (options) ->
    super(options)

    if not @view.source?
      @view.source = @source
      @view.compute_indices()

  @define {
      source: [ p.Instance ]
      view:   [ p.Instance, () -> new CDSView() ]
    }
