_ = require "underscore"
$ = require "jquery"
BokehView = require "../../core/bokeh_view"
Widget = require "./widget"

class PanelView extends BokehView

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.empty()
    return @

class Panel extends Widget.Model
  type: "Panel"
  default_view: PanelView

  defaults: () ->
    return _.extend {}, super(), {
      title: ""
      child: null
      closable: false
    }

module.exports =
  Model: Panel
  View: PanelView
