ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class SimpleAppView extends ContinuumView

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.html('')
    layout = @mget('layout')
    @layout_view = new layout.default_view(model: layout)
    @$el.append(@layout_view.$el)
    return @

class SimpleApp extends HasParent
  type: "SimpleApp"
  default_view: SimpleAppView

module.exports =
  "Model": SimpleApp
  "View": SimpleAppView