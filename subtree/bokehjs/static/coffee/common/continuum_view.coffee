
class ContinuumView extends Backbone.View
  initialize: (options) ->
    #autogenerates id
    if not _.has(options, 'id')
      this.id = _.uniqueId('ContinuumView')

  #bind_bokeh_events is always called after initialize has run
  bind_bokeh_events: () ->
    'pass'

  delegateEvents: (events) ->
    super(events)

  remove: ->
    #handles lifecycle of events bound by safebind

    if _.has(this, 'eventers')
      for own target, val of @eventers
        val.off(null, null, this)
    @trigger('remove')
    super()

  mget: ()->
    # convenience function, calls get on the associated model
    return @model.get.apply(@model, arguments)

  mset: ()->
    # convenience function, calls set on the associated model

    return @model.set.apply(@model, arguments)

  mget_obj: (fld) ->
    # convenience function, calls get_obj on the associated model

    return @model.get_obj(fld)

  render_end: () ->
    "pass"


exports.ContinuumView = ContinuumView