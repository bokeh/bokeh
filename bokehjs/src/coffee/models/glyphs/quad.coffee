import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import {CategoricalMapper} from "../mappers/categorical_mapper"
import * as hittest from "core/hittest"

export class QuadView extends GlyphView

  _index_data: () ->
    map_to_synthetic = (mapper, array) ->
      if mapper instanceof CategoricalMapper
        mapper.v_map_to_target(array, true)
      else
        array

    left = map_to_synthetic(@renderer.xmapper, @_left)
    right = map_to_synthetic(@renderer.xmapper, @_right)

    top = map_to_synthetic(@renderer.ymapper, @_top)
    bottom = map_to_synthetic(@renderer.ymapper, @_bottom)

    points = []
    for i in [0...left.length]
      l = left[i]
      r = right[i]
      t = top[i]
      b = bottom[i]
      if isNaN(l+r+t+b) or not isFinite(l+r+t+b)
        continue
      points.push({minX: l, minY: b, maxX: r, maxY: t, i: i})

    return new RBush(points)

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

    hits = @index.indices({minX: x, minY: y, maxX: x, maxY: y})

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  get_anchor_point: (anchor, i, spt) ->
    left = Math.min(@sleft[i], @sright[i])
    right = Math.max(@sright[i], @sleft[i])
    top = Math.min(@stop[i], @sbottom[i])     # screen coordinates !!!
    bottom = Math.max(@sbottom[i], @stop[i])  #

    switch anchor
      when 'top_left'      then {x: left,             y: top              }
      when 'top_center'    then {x: (left + right)/2, y: top              }
      when 'top_right'     then {x: right,            y: top              }
      when 'center_right'  then {x: right,            y: (top + bottom)/2 }
      when 'bottom_right'  then {x: right,            y: bottom           }
      when 'bottom_center' then {x: (left + right)/2, y: bottom           }
      when 'bottom_left'   then {x: left,             y: bottom           }
      when 'center_left'   then {x: left,             y: (top + bottom)/2 }
      when 'center'        then {x: (left + right)/2, y: (top + bottom)/2 }

  scx: (i) ->
    return (@sleft[i] + @sright[i])/2

  scy: (i) ->
    return (@stop[i] + @sbottom[i])/2

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class Quad extends Glyph
  default_view: QuadView

  type: 'Quad'

  @coords [['right', 'bottom'], ['left', 'top']]
  @mixins ['line', 'fill']
