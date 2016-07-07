_ = require "underscore"
rbush = require "rbush"

Glyph = require "./glyph"
CategoricalMapper = require "../mappers/categorical_mapper"
hittest = require "../../common/hittest"

class QuadView extends Glyph.View

  _index_data: () ->
    map_to_synthetic = (mapper, array) ->
      if mapper instanceof CategoricalMapper.Model
        mapper.v_map_to_target(array, true)
      else
        array

    left = map_to_synthetic(@renderer.xmapper, @_left)
    right = map_to_synthetic(@renderer.xmapper, @_right)

    top = map_to_synthetic(@renderer.ymapper, @_top)
    bottom = map_to_synthetic(@renderer.ymapper, @_bottom)

    index = rbush()
    pts = []

    for i in [0...left.length]
      l = left[i]
      if isNaN(l) or not isFinite(l)
        continue
      r = right[i]
      if isNaN(r) or not isFinite(r)
        continue
      t = top[i]
      if isNaN(t) or not isFinite(t)
        continue
      b = bottom[i]
      if isNaN(b) or not isFinite(b)
        continue
      pts.push({minX: l, minY: b, maxX: r, maxY: t, i: i})

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

    hits = (x.i for x in @index.search({minX: x, minY: y, maxX: x, maxY: y}))

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  get_anchor_point: (anchor, i, spt) ->
    left = Math.min(@sleft[i], @sright[i])
    right = Math.max(@sright[i], @sleft[i])
    top = Math.min(@stop[i], @sbottom[i])     # screen coordinates !!!
    bottom = Math.max(@sbottom[i], @stop[i])  #

    switch anchor
      when "top_left"      then {x: left,             y: top              }
      when "top_center"    then {x: (left + right)/2, y: top              }
      when "top_right"     then {x: right,            y: top              }
      when "right_center"  then {x: right,            y: (top + bottom)/2 }
      when "bottom_right"  then {x: right,            y: bottom           }
      when "bottom_center" then {x: (left + right)/2, y: bottom           }
      when "bottom_left"   then {x: left,             y: bottom           }
      when "left_center"   then {x: left,             y: (top + bottom)/2 }
      when "center"        then {x: (left + right)/2, y: (top + bottom)/2 }

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
