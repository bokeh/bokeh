_ = require "underscore"
$ = require "jquery"

p = require "../../core/properties"

Widget = require "./widget"

class PanelView extends Widget.View

  render: () ->
    super()
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
