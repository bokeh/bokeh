import {Glyph, GlyphView} from "./glyph"
import * as hittest from "../../core/hittest"
import * as p from "../../core/properties"
import {max} from "../../core/util/array"

export class RectView extends GlyphView

  _set_data: () ->
    @max_w2 = 0
    if @model.properties.width.units == "data"
      @max_w2 = @max_width/2
    @max_h2 = 0
    if @model.properties.height.units == "data"
      @max_h2 = @max_height/2

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @model.properties.width.units == "data"
      x0 = (@_x[i] - @_width[i]/2 for i in [0...@_x.length])
      vx0 = @renderer.xmapper.v_map_to_target(x0)
      @sx0 = @renderer.plot_view.canvas.v_vx_to_sx(vx0)
      @sw = @sdist(@renderer.xmapper, x0, @_width, 'edge', @model.dilate)
    else
      @sw = @_width
      @sx0 = (@sx[i] - @sw[i]/2 for i in [0...@sx.length])
    if @model.properties.height.units == "data"
      y0 = (@_y[i] - @_height[i]/2 for i in [0...@_y.length])
      y1 = (@_y[i] + @_height[i]/2 for i in [0...@_y.length])
      vy1 = @renderer.ymapper.v_map_to_target(y1)
      @sy1 = @renderer.plot_view.canvas.v_vy_to_sy(vy1)
      @sh = @sdist(@renderer.ymapper, y0, @_height, 'edge', @model.dilate)
    else
      @sh = @_height
      @sy1 = (@sy[i] - @sh[i]/2 for i in [0...@sy.length])
    @ssemi_diag = (Math.sqrt(@sw[i]/2 * @sw[i]/2 + @sh[i]/2 * @sh[i]/2) for i in [0...@sw.length])

  _render: (ctx, indices, {sx, sy, sx0, sy1, sw, sh, _angle}) ->
    if @visuals.fill.doit
      for i in indices
        if isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i])
          continue

        #no need to test the return value, we call fillRect for every glyph anyway
        @visuals.fill.set_vectorize(ctx, i)

        if _angle[i]
          ctx.translate(sx[i], sy[i])
          ctx.rotate(_angle[i])
          ctx.fillRect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-_angle[i])
          ctx.translate(-sx[i], -sy[i])
        else
          ctx.fillRect(sx0[i], sy1[i], sw[i], sh[i])

    if @visuals.line.doit
      ctx.beginPath()

      for i in indices

        if isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i])
          continue

        # fillRect does not fill zero-height or -width rects, but rect(...)
        # does seem to stroke them (1px wide or tall). Explicitly ignore rects
        # with zero width or height to be consistent
        if sw[i]==0 or sh[i]==0
          continue

        if _angle[i]
          ctx.translate(sx[i], sy[i])
          ctx.rotate(_angle[i])
          ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-_angle[i])
          ctx.translate(-sx[i], -sy[i])
        else
          ctx.rect(sx0[i], sy1[i], sw[i], sh[i])

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
        ctx.beginPath()

      ctx.stroke()

  _hit_rect: (geometry) ->
    [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1], true)
    [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1], true)
    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    result = hittest.create_hit_test_result()
    result['1d'].indices = (x.i for x in @index.search(bbox))
    return result

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    scenter_x = (@sx0[i] + @sw[i]/2 for i in [0...@sx0.length])
    scenter_y = (@sy1[i] + @sh[i]/2 for i in [0...@sy1.length])

    max_x2_ddist = max(@_ddist(0, scenter_x, @ssemi_diag))
    max_y2_ddist = max(@_ddist(1, scenter_y, @ssemi_diag))

    x0 = x - max_x2_ddist
    x1 = x + max_x2_ddist
    y0 = y - max_y2_ddist
    y1 = y + max_y2_ddist

    hits = []

    bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    for i in (pt.i for pt in @index.search(bbox))
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)

      if @_angle[i]
        d = Math.sqrt(Math.pow((sx - @sx[i]), 2) + Math.pow((sy - @sy[i]),2))
        s = Math.sin(-@_angle[i])
        c = Math.cos(-@_angle[i])
        px = c * (sx-@sx[i]) - s * (sy-@sy[i]) + @sx[i]
        py = s * (sx-@sx[i]) + c * (sy-@sy[i]) + @sy[i]
        sx = px
        sy = py
        width_in = Math.abs(@sx[i]-sx) <= @sw[i]/2
        height_in = Math.abs(@sy[i]-sy) <= @sh[i]/2
      else
        width_in = sx - @sx0[i] <= @sw[i] and sx - @sx0[i] >= 0
        height_in = sy - @sy1[i] <= @sh[i] and sy - @sy1[i] >= 0

      if height_in and width_in
        hits.push(i)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  _ddist: (dim, spts, spans) ->
    if dim == 0
      vpts = @renderer.plot_view.canvas.v_sx_to_vx(spts)
      mapper = @renderer.xmapper
    else
      vpts = @renderer.plot_view.canvas.v_vy_to_sy(spts)
      mapper = @renderer.ymapper

    vpt0 = vpts
    vpt1 = (vpt0[i] + spans[i] for i in [0...vpt0.length])

    pt0 = mapper.v_map_from_target(vpt0)
    pt1 = mapper.v_map_from_target(vpt1)

    return (Math.abs(pt1[i] - pt0[i]) for i in [0...pt0.length])

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1, index)

  _bounds: (bds) ->
    return @max_wh2_bounds(bds)

export class Rect extends Glyph
  default_view: RectView

  type: 'Rect'

  @coords [['x', 'y']]
  @mixins ['line', 'fill']
  @define {
      angle:  [ p.AngleSpec,   0     ]
      width:  [ p.DistanceSpec       ]
      height: [ p.DistanceSpec       ]
      dilate: [ p.Bool,        false ]
    }
