_ = require "underscore"

Model = require "../../model"
p = require "../../core/properties"

class Range extends Model
  type: 'Range'

  initialize: (options) ->
    super(options)
    @listenTo(@, 'change', () ->
      @callback?.execute(@)
    )

  @define {
      callback: [ p.Instance ]
    }

  @internal {
    plots: [ p.Array, [] ]
  }

  reset: () ->

module.exports =
  Model: Range
