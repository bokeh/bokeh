_ = require "underscore"
Glyph = require "./glyph"

class OvalView extends Glyph.View

  _set_data: () ->
    @max_w2 = 0
    if @distances.width.units == "data"
      @max_w2 = @max_width/2
    @max_h2 = 0
    if @distances.height.units == "data"
      @max_h2 = @max_height/2

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @distances.width.units == "data"
      @sw = @sdist(@renderer.xmapper, @x, @width, 'center')
    else
      @sw = @width
    if @distances.height.units == "data"
      @sh = @sdist(@renderer.ymapper, @y, @height, 'center')
    else
      @sh = @height

  _render: (ctx, indices, {sx, sy, sw, sh}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+sw[i]+sh[i]+@angle[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -sh[i]/2)
      ctx.bezierCurveTo( sw[i]/2, -sh[i]/2,  sw[i]/2,  sh[i]/2, 0,  sh[i]/2)
      ctx.bezierCurveTo(-sw[i]/2,  sh[i]/2, -sw[i]/2, -sh[i]/2, 0, -sh[i]/2)
      ctx.closePath()

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.rotate(-@angle[i])
      ctx.translate(-sx[i], -sy[i])

  draw_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0

    indices = [reference_point]
    sx = { }
    sx[reference_point] = (x0+x1)/2
    sy = { }
    sy[reference_point] = (y0+y1)/2

    scale = @sw[reference_point] / @sh[reference_point]
    d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8
    sw = { }
    sh = { }
    if scale > 1
      sw[reference_point] = d
      sh[reference_point] = d/scale
    else
      sw[reference_point] = d*scale
      sh[reference_point] = d

    @_render(ctx, indices, sx, sy, sw, sh)

  _bounds: (bds) ->
    return [
      [bds[0][0]-@max_w2, bds[0][1]+@max_w2],
      [bds[1][0]-@max_h2, bds[1][1]+@max_h2]
    ]

class Oval extends Glyph.Model
  default_view: OvalView
  type: 'Oval'
  distances: ['width', 'height']
  angles: ['angle']

  display_defaults: ->
    return _.extend {}, super(), {
      angle: 0.0
    }

module.exports =
  Model: Oval
  View: OvalView