
define [
  "underscore",
  "backbone",
  "common/ticking",
  "./axis"
], (_, Backbone, ticking, Axis) ->

  class LinearAxisView extends Axis.View
    initialize: (options) ->
      options.formatter = new ticking.BasicTickFormatter()
      super(options)

  class LinearAxis extends Axis.Model
    default_view: LinearAxisView
    type: 'LinearAxis'

    initialize: (attrs, options)->
      options.scale = new ticking.BasicScale()
      super(attrs, options)

    display_defaults: () ->
      super()

  class LinearAxes extends Backbone.Collection
     model: LinearAxis

  return {
    "Model": LinearAxis,
    "Collection": new LinearAxes(),
    "View": LinearAxisView
  }
