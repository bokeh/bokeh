_ = require "underscore"

Model = require "../../model"
p = require "../../core/properties"

class Range extends Model
  type: 'Range'

  initialize: (options) ->
    super(options)
    @listenTo(@, 'change', () -> @callback?.execute(@))

  @define {
      callback: [ p.Instance ]
    }

  @internal {
    plots: [ p.Array, [] ]
  }

  reset: () ->
    """
    This method should be reimplemented by subclasses and ensure that
    the callback, if exists, is executed at completion.
    """
    @trigger('change')

module.exports =
  Model: Range
