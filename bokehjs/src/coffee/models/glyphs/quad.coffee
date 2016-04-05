_ = require "underscore"
rbush = require "rbush"

Glyph = require "./glyph"
hittest = require "../../common/hittest"

class QuadView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@_left.length]
      if not isNaN(@_left[i] + @_right[i] + @_top[i] + @_bottom[i])
        pts.push([@_left[i], @_bottom[i], @_right[i], @_top[i], {'i': i}])
    index.load(pts)
    return index

  _render: (ctx, indices, {sleft, sright, stop, sbottom}) ->
    for i in indices
      if isNaN(sleft[i]+stop[i]+sright[i]+sbottom[i])
        continue

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fillRect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i])

      if @visuals.line.doit
        ctx.beginPath()
        ctx.rect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i])
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    hits = (x[4].i for x in @index.search([x, y, x, y]))

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

  @coords [['right', 'bottom'], ['left', 'top']]
  @mixins ['line', 'fill']

module.exports =
  Model: Quad
  View: QuadView
