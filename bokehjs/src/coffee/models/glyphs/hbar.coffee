import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class HBarView extends GlyphView

  _map_data: () ->
    vy = @renderer.yscale.v_compute(@_y)
    @sy = @renderer.plot_view.canvas.v_vy_to_sy(vy)

    vright = @renderer.xscale.v_compute(@_right)
    @sright = @renderer.plot_view.canvas.v_vx_to_sx(vright)

    vleft = @renderer.xscale.v_compute(@_left)
    @sleft = @renderer.plot_view.canvas.v_vx_to_sx(vleft)

    @stop = []
    @sbottom = []
    @sh = @sdist(@renderer.yscale, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @stop.push(@sy[i] - @sh[i]/2)
      @sbottom.push(@sy[i] + @sh[i]/2)
    return null

  _index_data: () ->
    points = []

    for i in [0...@_y.length]
      l = Math.min(@_left[i], @_right[i])
      r = Math.max(@_left[i], @_right[i])
      t = @_y[i] + 0.5 * @_height[i]
      b = @_y[i] - 0.5 * @_height[i]
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
    x = @renderer.xscale.invert(vx)
    y = @renderer.yscale.invert(vy)

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

  @coords [['y', 'left']]
  @mixins ['line', 'fill']
  @define {
    height: [ p.DistanceSpec  ]
    right:  [ p.NumberSpec    ]
  }
  @override { left: 0 }
