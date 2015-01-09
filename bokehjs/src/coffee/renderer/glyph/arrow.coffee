define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class ArrowView extends Glyph.View

    _fields: ['x0', 'y0', 'x1', 'y1', 'length', 'filled:boolean', 'angle']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@x0, @glyph.x0.units, @y0, @glyph.y0.units)
      [@sx1, @sy1] = @renderer.map_to_screen(@x1, @glyph.x1.units, @y1, @glyph.y1.units)
      @slength = @distance_vector('x0', 'length', 'edge')

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        side = @mget("side")

        for i in indices
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @slength[i] + @angle[i])
            continue

          @props.line.set_vectorize(ctx, i)
          @props.fill.set_vectorize(ctx, i)

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.lineTo(@sx1[i], @sy1[i])
          ctx.stroke()

          @_render_arrow(ctx, @sx0[i], @sy0[i], @sx1[i], @sy1[i], @slength[i], @angle[i], side, @filled[i])

    _render_arrow: (ctx, x0, y0, x1, y1, length, angle, side, filled) ->
      slope = Math.atan2(y1 - y0, x1 - x0)
      dist = Math.abs(length/Math.cos(angle))

      if side == "far" or side == "both"
        angle_top = slope + Math.PI + angle
        x_top = x1 + Math.cos(angle_top)*dist
        y_top = y1 + Math.sin(angle_top)*dist

        angle_bot = slope + Math.PI - angle
        x_bot = x1 + Math.cos(angle_bot)*dist
        y_bot = y1 + Math.sin(angle_bot)*dist

        @_render_head(ctx, x_top, y_top, x1, y1, x_bot, y_bot, filled)

      if side == "near" or side == "both"
        angle_top = slope + angle
        x_top = x0 + Math.cos(angle_top)*dist
        y_top = y0 + Math.sin(angle_top)*dist

        angle_bot = slope - angle
        x_bot = x0 + Math.cos(angle_bot)*dist
        y_bot = y0 + Math.sin(angle_bot)*dist

        @_render_head(ctx, x_top, y_top, x0, y0, x_bot, y_bot, filled)

    _render_head: (ctx, x0, y0, x1, y1, x2, y2, filled) ->
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.lineTo(x2, y2)

      if not filled
        ctx.stroke()
      else
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x0, y0)
        ctx.fill()

      ctx.restore()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Arrow extends Glyph.Model
    default_view: ArrowView
    type: 'Arrow'

    defaults: ->
      return _.extend {}, super(), {
        angle: Math.PI/4
        length: {value: 10, units: "screen"}
        side: "far"
        filled: false
      }

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class Arrows extends Glyph.Collection
    model: Arrow

  return {
    Model: Arrow
    View: ArrowView
    Collection: new Arrows()
  }
