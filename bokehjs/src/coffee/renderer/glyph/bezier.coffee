define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class BezierView extends Glyph.View

    _fields : ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1']
    _properties: ['line']

    _map_data: () ->
      [@sx0,  @sy0]  = @renderer.map_to_screen(@x0,  @glyph.x0.units,  @y0,  @glyph.y0.units)
      [@sx1,  @sy1]  = @renderer.map_to_screen(@x1,  @glyph.x1.units,  @y1,  @glyph.y1.units)
      [@scx0, @scy0] = @renderer.map_to_screen(@cx0, @glyph.cx0.units, @cy0, @glyph.cy0.units)
      [@scx1, @scy1] = @renderer.map_to_screen(@cx1, @glyph.cx1.units, @cy1, @glyph.cy1.units)

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx0[i] + @scy0[i] + @scx1[i] + @scy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.bezierCurveTo(@scx0[i], @scy0[i], @scx1[i], @scy1[i], @sx1[i], @sy1[i])

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Bezier extends Glyph.Model
    default_view: BezierView
    type: 'Bezier'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Beziers extends Glyph.Collection
    model: Bezier

  return {
    Model: Bezier
    View: BezierView
    Collection: new Beziers()
  }
