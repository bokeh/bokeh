_ = require "underscore"
$ = require "jquery"

Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

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

  @define {
      title:    [ p.String,  ""    ]
      child:    [ p.Instance       ]
      closable: [ p.Bool,    false ]
    }

module.exports =
  Model: Panel
  View: PanelView
