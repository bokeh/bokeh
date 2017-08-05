import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as p from "core/properties"

export class EllipseView extends XYGlyphView

  _set_data: () ->
    @max_w2 = 0
    if @model.properties.width.units == "data"
      @max_w2 = @max_width/2
    @max_h2 = 0
    if @model.properties.height.units == "data"
      @max_h2 = @max_height/2

  _map_data: () ->
    if @model.properties.width.units == "data"
      @sw = @sdist(@renderer.xscale, @_x, @_width, 'center')
    else
      @sw = @_width
    if @model.properties.height.units == "data"
      @sh = @sdist(@renderer.yscale, @_y, @_height, 'center')
    else
      @sh = @_height

  _render: (ctx, indices, {sx, sy, sw, sh}) ->
     for i in indices
       if isNaN(sx[i]+sy[i]+sw[i]+sh[i]+@_angle[i])
         continue

       ctx.beginPath()
       ctx.ellipse(sx[i], sy[i], sw[i]/2.0, sh[i]/2.0, @_angle[i], 0, 2 * Math.PI)

       if @visuals.fill.doit
         @visuals.fill.set_vectorize(ctx, i)
         ctx.fill()

       if @visuals.line.doit
         @visuals.line.set_vectorize(ctx, i)
         ctx.stroke()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    indices = [index]
    sx = { }
    sx[index] = (x0+x1)/2
    sy = { }
    sy[index] = (y0+y1)/2

    scale = @sw[index] / @sh[index]
    d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8
    sw = { }
    sh = { }
    if scale > 1
      sw[index] = d
      sh[index] = d/scale
    else
      sw[index] = d*scale
      sh[index] = d

    data = {sx, sy, sw, sh}
    @_render(ctx, indices, data)

  _bounds: (bds) ->
    return @max_wh2_bounds(bds)

export class Ellipse extends XYGlyph
  default_view: EllipseView

  type: 'Ellipse'

  @mixins ['line', 'fill']
  @define {
      angle:  [ p.AngleSpec,   0.0 ]
      width:  [ p.DistanceSpec     ]
      height: [ p.DistanceSpec     ]
    }
