import {RBush} from "core/util/spatial"
import * as Quad from "./quad"
import {Glyph, GlyphView} from "./glyph"
import {CategoricalMapper} from "../mappers/categorical_mapper"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class HBarView extends GlyphView

  _map_data: () ->
    vy = @renderer.ymapper.v_map_to_target(@_y)
    @sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)

    vright = @renderer.xmapper.v_map_to_target(@_right)
    vleft = @renderer.xmapper.v_map_to_target(@_left)

    @sright = @renderer.plot_view.canvas.v_vx_to_sx(vright)
    @sleft = @renderer.plot_view.canvas.v_vx_to_sx(vleft)

    @stop = []
    @sbottom = []
    @sh = @sdist(@renderer.ymapper, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @stop.push(@sy[i] - @sh[i]/2)
      @sbottom.push(@sy[i] + @sh[i]/2)
    return null

  _index_data: () ->
    map_to_synthetic = (mapper, array) ->
      if mapper instanceof CategoricalMapper
        mapper.v_map_to_target(array, true)
      else
        array

    left = map_to_synthetic(@renderer.xmapper, @_left)
    right = map_to_synthetic(@renderer.xmapper, @_right)

    y = map_to_synthetic(@renderer.ymapper, @_y)
    height = map_to_synthetic(@renderer.ymapper, @_height)

    points = []

    for i in [0...y.length]
      l = left[i]
      r = right[i]
      t = y[i] + 0.5 * height[i]
      b = y[i] - 0.5 * height[i]
      if isNaN(l+r+t+b) or not isFinite(l+r+t+b)
        continue
      points.push({minX: l, minY: b, maxX: r, maxY: t, i: i})

    return new RBush(points)

  _render: (ctx, indices, {sleft, sright, stop, sbottom}) ->
    for i in indices
      if isNaN(sleft[i] + stop[i] + sright[i] + sbottom[i])
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

  scx: (i) -> return (@sleft[i] + @sright[i])/2

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

export class HBar extends Glyph
  default_view: HBarView
  type: 'HBar'

  @mixins ['line', 'fill']
  @define {
      y:      [ p.NumberSpec    ]
      height: [ p.DistanceSpec  ]
      left:   [ p.NumberSpec, 0 ]
      right:  [ p.NumberSpec    ]
    }
