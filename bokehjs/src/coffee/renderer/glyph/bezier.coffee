
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class BezierView extends Glyph.View

    _fields : ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1']
    _properties: ['line']

    _map_data: () ->
      [@sx0,  @sy0]  = @plot_view.map_to_screen(@x0,  @glyph_props.x0.units,  @y0, @glyph_props.y0.units)
      [@sx1,  @sy1]  = @plot_view.map_to_screen(@x1,  @glyph_props.x1.units,  @y1, @glyph_props.y1.units)
      [@scx0, @scy0] = @plot_view.map_to_screen(@cx0, @glyph_props.cx0.units, @cy0, @glyph_props.cy0.units)
      [@scx1, @scy1] = @plot_view.map_to_screen(@cx1, @glyph_props.cx1.units, @cy1, @glyph_props.cy1.units)

    _render: (ctx, indices, glyph_props) ->
      if glyph_props.line_properties.do_stroke

        for i in indices

          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx0[i] + @scy0[i] + @scx1[i] + @scy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.bezierCurveTo(@scx0[i], @scy0[i], @scx1[i], @scy1[i], @sx1[i], @sy1[i])

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Bezier extends Glyph.Model
    default_view: BezierView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Bezier,
    "View": BezierView,
  }

