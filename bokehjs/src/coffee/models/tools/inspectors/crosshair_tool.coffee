_ = require "underscore"

InspectTool = require "./inspect_tool"
Span = require "../../annotations/span"
p = require "../../../core/properties"

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
        span.update({'location': null})
      else
        if dim == "width"
          span.update({'location': vy})
        else
          span.update({'location': vx})

  _move_exit: (e)->
    for dim in @mget('dimensions')
      span = @mget('spans')[dim]
      span.update({'location': null})

class CrosshairTool extends InspectTool.Model
  default_view: CrosshairToolView
  type: "CrosshairTool"
  tool_name: "Crosshair"

  props: () ->
    return _.extend({}, super(), {
      dimensions: [ p.Array, ["width", "height"] ]
      line_color: [ p.Color, 'black'             ]
      line_width: [ p.Number, 1                  ]
      line_alpha: [ p.Number, 1.0                ]
    })

  nonserializable_attribute_names: () ->
    super().concat(['location_units', 'render_mode', 'spans'])

  defaults: () ->
    return _.extend({}, super(), {
      location_units: "screen"
      render_mode: "css",
    })

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
        silent_update: true
        dimension: "width",
        render_mode: @get("render_mode")
        location_units: @get("location_units")
        line_color: @get("line_color")
        line_width: @get('line_width')
        line_alpha: @get('line_alpha')
      }),
      height: new Span.Model({
        silent_update: true
        dimension: "height"
        render_mode: @get("render_mode")
        location_units: @get("location_units")
        line_color: @get("line_color")
        line_width: @get('line_width')
        line_alpha: @get('line_alpha')
      })
    })

    renderers = @get('plot').get('renderers')
    renderers.push(@get('spans').width)
    renderers.push(@get('spans').height)
    @get('plot').set('renderers', renderers)

module.exports =
  Model: CrosshairTool
  View: CrosshairToolView
