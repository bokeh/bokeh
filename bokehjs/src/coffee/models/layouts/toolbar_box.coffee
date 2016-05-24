Box = require "./box"

Toolbar = require "../tools/toolbar"
p = require "../../core/properties"

class ToolbarBoxView extends Box.View
  className: "bk-toolbar-box"

class ToolbarBox extends Box.Model
  type: 'ToolbarBox'
  default_view: ToolbarBoxView

  initialize: (options) ->
    super(options)
    if @orientation is "horizontal"
      @_horizontal = true
      @toolbar._sizeable = @toolbar._height
      @toolbar.location = 'above'
    else
      @_horizontal = false
      @toolbar._sizeable = @toolbar._width
      @toolbar.location = 'left'

  get_layoutable_children: () ->
    [@toolbar]

  @define {
    toolbar: [ p.Instance, () -> new Toolbar.Model() ]
    orientation: [ p.Orientation, "horizontal" ]
  }


module.exports =
  View: ToolbarBoxView
  Model: ToolbarBox
