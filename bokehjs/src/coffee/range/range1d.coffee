_ = require "underscore"
Range = require "./range"

class Range1d extends Range.Model
  type: 'Range1d'

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

  reset: () ->
    @set({start: @_initial_start, end: @_initial_end})

  defaults: ->
    return _.extend {}, super(), {
      start: 0
      end: 1
    }

module.exports =
  Model: Range1d