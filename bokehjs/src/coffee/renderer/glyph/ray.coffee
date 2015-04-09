_ = require "underscore"
Glyph = require "./glyph"

class RayView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    @slength = @sdist(@renderer.xmapper, @x, @length)

  _render: (ctx, indices, {sx, sy, slength, angle}) ->
    if @visuals.line.do_stroke

      width = @renderer.plot_view.frame.get('width')
      height = @renderer.plot_view.frame.get('height')
      inf_len = 2 * (width + height)
      for i in [0...slength.length]
        if slength[i] == 0
          slength[i] = inf_len

      for i in indices
        if isNaN(sx[i]+sy[i]+angle[i]+slength[i])
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(angle[i])

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(slength[i], 0)

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

        ctx.rotate(-angle[i])
        ctx.translate(-sx[i], -sy[i])

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Ray extends Glyph.Model
  default_view: RayView
  type: 'Ray'
  visuals: ['line']
  distances: ['length']
  angles: ['angle']

module.exports =
  Model: Ray
  View: RayView