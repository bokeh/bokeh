import {Range} from "./range"
import * as p from "core/properties"

export class Range1d extends Range
  type: 'Range1d'

  @define {
      start:  [ p.Number, 0 ]
      end:    [ p.Number, 1 ]
      bounds: [ p.Any       ] # TODO (bev)
      min_interval: [ p.Any ]
      max_interval: [ p.Any ]
    }

  _set_auto_bounds: () ->
    if @bounds == 'auto'
      min = Math.min(@_initial_start, @_initial_end)
      max = Math.max(@_initial_start, @_initial_end)
      @setv({bounds: [min, max]}, {silent: true})

  initialize: (attrs, options) ->
    super(attrs, options)

    @_initial_start = @start
    @_initial_end = @end

    @_set_auto_bounds()

  `
  get min(): number { return Math.min(this.start, this.end) }
  get max(): number { return Math.max(this.start, this.end) }
  get is_reversed(): boolean { return this.start > this.end }
  `

  reset: () ->
    @_set_auto_bounds()
    if @start != @_initial_start or @end != @_initial_end
      @setv({start: @_initial_start, end: @_initial_end})
    else
      @change.emit()
