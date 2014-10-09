
define [
  "underscore"
  "common/collection"
  "renderer/annotation/span"
  "./inspect_tool"
], (_, Collection, Span, InspectTool) ->

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
        width: new Span.Model({dimension: "width"}),
        height: new Span.Model({dimension: "height"})
      })
      renderers = @get('plot').get('renderers')
      renderers.push(@get('spans').width)
      renderers.push(@get('spans').height)
      @get('plot').set('renderers', renderers)

    defaults: () ->
      return _.extend({}, super(), {
        dimensions: ["width", "height"]
      })

  class CrosshairTools extends Collection
    model: CrosshairTool

  return {
    "Model": CrosshairTool
    "Collection": new CrosshairTools(),
    "View": CrosshairToolView
  }
