_ = require "underscore"
Span = require "../../renderer/annotation/span"
InspectTool = require "./inspect_tool"

class CrosshairToolView extends InspectTool.View

  _move: (e) ->
    if not @mget('active')
      return
    frame = @plot_model.get('frame')
    canvas = @plot_model.get('canvas')
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    for dim in @mget('dimensions')
      span = @mget('spans')[dim]
      if not frame.contains(vx, vy)
        span.unset('location')
      else
        if dim == "width"
          span.set('location', vy)
        else
          span.set('location', vx)

  _move_exit: (e)->
    for dim in @mget('dimensions')
      span = @mget('spans')[dim]
      span.unset('location')

class CrosshairTool extends InspectTool.Model
  default_view: CrosshairToolView
  type: "CrosshairTool"
  tool_name: "Crosshair"

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('tooltip', () ->
        @_get_dim_tooltip(
          "Crosshair",
          @_check_dims(@get('dimensions'), "crosshair tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

    @set('spans', {
      width: new Span.Model({
                               dimension: "width",
                               render_mode: @get("render_mode"),
                               location_units: @get("location_units"),
                               line_color: @get("line_color"),
                               line_width: @get('line_width'),
                               line_alpha: @get('line_alpha')
                             }),
      height: new Span.Model({
                               dimension: "height",
                               render_mode: @get("render_mode"),
                               location_units: @get("location_units"),
                               line_color: @get("line_color"),
                               line_width: @get('line_width'),
                               line_alpha: @get('line_alpha')
                             })
    })

    renderers = @get('plot').get('renderers')
    renderers.push(@get('spans').width)
    renderers.push(@get('spans').height)
    @get('plot').set('renderers', renderers)

    ast = @display_defaults

  nonserializable_attribute_names: () ->
    super().concat(['location_units', 'render_mode', 'spans'])

  defaults: () ->
    return _.extend({}, super(), {
      dimensions: ["width", "height"]
      location_units: "screen"
      render_mode: "css"
    })

  display_defaults: () ->
    return _.extend {}, super(), {
      line_color: 'black'
      line_width: 1
      line_alpha: 1.0
    }

module.exports =
  Model: CrosshairTool
  View: CrosshairToolView
