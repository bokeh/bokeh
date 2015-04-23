_ = require "underscore"
rbush = require "rbush"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

class QuadView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@left.length]
      if not isNaN(@left[i] + @right[i] + @top[i] + @bottom[i])
        pts.push([@left[i], @bottom[i], @right[i], @top[i], {'i': i}])
    index.load(pts)
    return index

  _render: (ctx, indices, {sleft, sright, stop, sbottom}) ->
    for i in indices
      if isNaN(sleft[i]+stop[i]+sright[i]+sbottom[i])
        continue

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fillRect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i])

      if @visuals.line.do_stroke
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i])
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    sx = @renderer.plot_view.canvas.vx_to_sx(vx)
    sy = @renderer.plot_view.canvas.vy_to_sy(vy)

    hits = []
    for i in [0...@sleft.length]
      if (sx >= @sleft[i] and sx <= @sright[i] and sy >= @stop[i] and
          sy < @sbottom[i])
        hits.push(i)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  scx: (i) ->
    return (@sleft[i] + @sright[i])/2

  scy: (i) ->
    return (@stop[i] + @sbottom[i])/2

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Quad extends Glyph.Model
  default_view: QuadView
  type: 'Quad'
  coords: [ ['right', 'bottom'], ['left', 'top'] ]

module.exports =
  Model: Quad
  View: QuadView