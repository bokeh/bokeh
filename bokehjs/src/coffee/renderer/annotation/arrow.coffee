HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class ArrowView extends PlotWidget
  initialize: (options) ->
    super(options)
    @fill_props = new properties.Fill({obj: @model, prefix: ''})
    @line_props = new properties.Line({obj: @model, prefix: ''})

  render: () ->
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

class Arrow extends HasParent
  default_view: ArrowView
  type: 'Arrow'

  defaults: ->
    return _.extend {}, super(), {
      x_range_name: "default"
      y_range_name: "default"
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'annotation'
      fill_color: '#fff9ba'
      fill_alpha: 0.4
      line_color: '#cccccc'
      line_width: 1
      line_alpha: 0.3
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    }

module.exports =
  Model: Arrow
  View: ArrowView
