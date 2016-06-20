_ = require "underscore"

ActionTool = require "./action_tool"
p = require "../../../core/properties"

class HelpToolView extends ActionTool.View
  do: () ->
    window.open(@mget('redirect'))

class HelpTool extends ActionTool.Model
  default_view: HelpToolView
  type: "HelpTool"
  tool_name: "Help"
  icon: "bk-tool-icon-help"

  @define {
      help_tooltip: [
        p.String,
        'Click the question mark to learn more about Bokeh plot tools.'
      ]
      redirect:     [
        p.String
        'http://bokeh.pydata.org/en/latest/docs/user_guide/tools.html'
      ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @override_computed_property('tooltip', () ->@get('help_tooltip'))

module.exports =
  Model: HelpTool,
  View: HelpToolView,
