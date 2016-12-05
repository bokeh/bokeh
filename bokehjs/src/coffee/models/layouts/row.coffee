import {Box, BoxView} from "./box"

export class RowView extends BoxView
  className: "bk-grid-row"

export class Row extends Box
  type: 'Row'
  default_view: RowView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = true
