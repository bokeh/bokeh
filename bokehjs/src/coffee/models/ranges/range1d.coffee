_ = require "underscore"

Range = require "./range"
p = require "../../core/properties"

class Range1d extends Range.Model
  type: 'Range1d'

  @define {
      start:  [ p.Number, 0 ]
      end:    [ p.Number, 1 ]
      bounds: [ p.Any       ] # TODO (bev)
      min_interval: [ p.Any ]
      max_interval: [ p.Any ]
    }

  _set_auto_bounds: () ->
    if @get('bounds') == 'auto'
      min = Math.min(@_initial_start, @_initial_end)
      max = Math.max(@_initial_start, @_initial_end)
      @set('bounds', [min, max])

  constructor: () ->
    # new Range1d({start: start, end: end}) or Range1d(start, end)
    if this instanceof Range1d
      return super(arguments...)
    else
      [start, end] = arguments
      return new Range1d({start: start, end: end})

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('min',
        () -> Math.min(@get('start'), @get('end'))
      , true)
    @add_dependencies('min', this, ['start', 'end'])

    @define_computed_property('max',
        () -> Math.max(@get('start'), @get('end'))
      , true)
    @add_dependencies('max', this, ['start', 'end'])

    @_initial_start = @get('start')
    @_initial_end = @get('end')

    @_set_auto_bounds()

  reset: () ->
    @set({start: @_initial_start, end: @_initial_end})
    @_set_auto_bounds()

module.exports =
  Model: Range1d
