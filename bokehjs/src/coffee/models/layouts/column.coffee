import {Box, BoxView} from "./box"

export class ColumnView extends BoxView
  className: "bk-grid-column"

export class Column extends Box
  type: 'Column'
  default_view: ColumnView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = false
