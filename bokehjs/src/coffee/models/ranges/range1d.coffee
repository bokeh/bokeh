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
      initial_start: [p.Number, 0]
      initial_end: [p.Number, 1]
    }

  _set_auto_bounds: () ->
    if @bounds == 'auto'
      min = Math.min(@initial_start, @initial_end)
      max = Math.max(@initial_start, @initial_end)
      @setv({bounds: [min, max]}, {silent: true})

  constructor: () ->
    # new Range1d({start: start, end: end}) or Range1d(start, end)
    if this instanceof Range1d
      return super(arguments...)
    else
      [start, end] = arguments
      return new Range1d({start: start, end: end})

  initialize: (attrs, options) ->
    super(attrs, options)

    @initial_start = @start
    @initial_end = @end

    @_set_auto_bounds()

  @getters {
    min: () -> Math.min(@start, @end)
    max: () -> Math.max(@start, @end)
  }

  reset: () ->
    @_set_auto_bounds()
    if @start != @initial_start or @end != @initial_end
      @setv({start: @initial_start, end: @initial_end})
    else
      @change.emit()
