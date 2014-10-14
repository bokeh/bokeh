define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class QuadraticView extends Glyph.View

    _fields: ['x0', 'y0', 'x1', 'y1', 'cx', 'cy']
    _properties: ['line']

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@x0, @glyph.x0.units, @y0, @glyph.y0.units)
      [@sx1, @sy1] = @renderer.map_to_screen(@x1, @glyph.x1.units, @y1, @glyph.y1.units)
      [@scx, @scy] = @renderer.map_to_screen(@cx, @glyph.cx.units, @cy, @glyph.cy.units)

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx[i] + @scy[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.quadraticCurveTo(@scx[i], @scy[i], @sx1[i], @sy1[i])

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Quadratic extends Glyph.Model
    default_view: QuadraticView
    type: 'Quadratic'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Quadratics extends Glyph.Collection
    model: Quadratic

  return {
    Model: Quadratic
    View: QuadraticView
    Collection: new Quadratics()
  }
