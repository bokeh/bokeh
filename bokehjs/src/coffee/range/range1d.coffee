_ = require "underscore"
Range = require "./range"

class Range1d extends Range.Model
  type: 'Range1d'

  _set_auto_bounds: () ->
    if @get('bounds') == 'auto'
      min = Math.min(@_initial_start, @_initial_end)
      max = Math.max(@_initial_start, @_initial_end)
      @set('bounds', [min, max])

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('min',
        () -> Math.min(@get('start'), @get('end'))
      , true)
    @add_dependencies('min', this, ['start', 'end'])

    @register_property('max',
        () -> Math.max(@get('start'), @get('end'))
      , true)
    @add_dependencies('max', this, ['start', 'end'])

    @_initial_start = @get('start')
    @_initial_end = @get('end')

    @_set_auto_bounds()

  reset: () ->
    @set({start: @_initial_start, end: @_initial_end})
    @_set_auto_bounds()

  defaults: ->
    return _.extend {}, super(), {
      start: 0
      end: 1
      bounds: 'auto'
    }

module.exports =
  Model: Range1d
