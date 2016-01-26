_ = require "underscore"
ActionTool = require "./action_tool"


class HelpToolView extends ActionTool.View
  do: () ->
  	window.open(@mget('redirect'))


class HelpTool extends ActionTool.Model
  default_view: HelpToolView
  type: "HelpTool"
  tool_name: "Help"
  icon: "bk-tool-icon-help"

  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('tooltip', () ->@get('help_tooltip'))

  defaults: ->
    return _.extend {}, super(), {
      help_tooltip: 'Click the question mark to learn more about Bokeh plot tools.'
      redirect: 'http://bokeh.pydata.org/en/latest/docs/user_guide/tools.html'
    }

module.exports =
  Model: HelpTool,
  View: HelpToolView,
