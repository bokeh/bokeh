import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import * as hittest from "core/hittest"
import * as p from "core/properties"

export class VBarView extends GlyphView

  _map_data: () ->
    @sx = @renderer.xscale.v_compute(@_x)

    vtop = @renderer.yscale.v_compute(@_top)
    @stop = @renderer.plot_view.canvas.v_vy_to_sy(vtop)

    vbottom = (@renderer.yscale.v_compute(@_bottom))
    @sbottom = @renderer.plot_view.canvas.v_vy_to_sy(vbottom)

    @sleft = []
    @sright = []
    @sw = @sdist(@renderer.xscale, @_x, @_width, 'center')
    for i in [0...@sx.length]
      @sleft.push(@sx[i] - @sw[i]/2)
      @sright.push(@sx[i] + @sw[i]/2)
    return null

  _index_data: () ->
    points = []

    for i in [0...@_x.length]
      l = @_x[i] - @_width[i]/2
      r = @_x[i] + @_width[i]/2
      t = Math.max(@_top[i], @_bottom[i])
      b = Math.min(@_top[i], @_bottom[i])
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
    x = @renderer.xscale.invert(vx)
    y = @renderer.yscale.invert(vy)

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

  @coords [['x', 'bottom']]
  @mixins ['line', 'fill']
  @define {
    width:  [ p.DistanceSpec  ]
    top:    [ p.NumberSpec    ]
  }
  @override { bottom: 0 }
