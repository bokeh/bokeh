import {RBush} from "core/util/spatial"
import * as Quad from "./quad"
import {Glyph, GlyphView} from "./glyph"
import {CategoricalMapper} from "../mappers/categorical_mapper"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class VBarView extends GlyphView

  _map_data: () ->
    @sx = @renderer.xmapper.v_map_to_target(@_x)

    vtop = @renderer.ymapper.v_map_to_target(@_top)
    vbottom = (@renderer.ymapper.v_map_to_target(@_bottom))
    @stop = @renderer.plot_view.canvas.v_vy_to_sy(vtop)
    @sbottom = @renderer.plot_view.canvas.v_vy_to_sy(vbottom)

    @sleft = []
    @sright = []
    @sw = @sdist(@renderer.xmapper, @_x, @_width, 'center')
    for i in [0...@sx.length]
      @sleft.push(@sx[i] - @sw[i]/2)
      @sright.push(@sx[i] + @sw[i]/2)
    return null

  _index_data: () ->
    map_to_synthetic = (mapper, array) ->
      if mapper instanceof CategoricalMapper
        mapper.v_map_to_target(array, true)
      else
        array

    x = map_to_synthetic(@renderer.xmapper, @_x)
    width = map_to_synthetic(@renderer.xmapper, @_width)

    top = map_to_synthetic(@renderer.ymapper, @_top)
    bottom = map_to_synthetic(@renderer.ymapper, @_bottom)

    points = []
    for i in [0...x.length]
      l = x[i] - width[i]/2
      r = x[i] + width[i]/2
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

  scy: (i) -> return (@stop[i] + @sbottom[i])/2

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class VBar extends Glyph
  default_view: VBarView
  type: 'VBar'

  @mixins ['line', 'fill']
  @define {
      x:      [ p.NumberSpec    ]
      width:  [ p.DistanceSpec  ]
      top:    [ p.NumberSpec    ]
      bottom: [ p.NumberSpec, 0 ]
    }
