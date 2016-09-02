_ = require "underscore"

Glyph = require "./glyph"
p = require "../../core/properties"

class OvalView extends Glyph.View

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
      @sw = @sdist(@renderer.xmapper, @_x, @_width, 'center')
    else
      @sw = @_width
    if @model.properties.height.units == "data"
      @sh = @sdist(@renderer.ymapper, @_y, @_height, 'center')
    else
      @sh = @_height

  _render: (ctx, indices, {sx, sy, sw, sh}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+sw[i]+sh[i]+@_angle[i])
        continue

      ctx.translate(sx[i], sy[i])
      ctx.rotate(@_angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -sh[i]/2)
      ctx.bezierCurveTo( sw[i]/2, -sh[i]/2,  sw[i]/2,  sh[i]/2, 0,  sh[i]/2)
      ctx.bezierCurveTo(-sw[i]/2,  sh[i]/2, -sw[i]/2, -sh[i]/2, 0, -sh[i]/2)
      ctx.closePath()

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.rotate(-@_angle[i])
      ctx.translate(-sx[i], -sy[i])

  draw_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0

    indices = [reference_point]
    sx = { }
    sx[reference_point] = (x0+x1)/2
    sy = { }
    sy[reference_point] = (y0+y1)/2

    scale = @sw[reference_point] / @sh[reference_point]
    d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8
    sw = { }
    sh = { }
    if scale > 1
      sw[reference_point] = d
      sh[reference_point] = d/scale
    else
      sw[reference_point] = d*scale
      sh[reference_point] = d

    data = {sx, sy, sw, sh}
    @_render(ctx, indices, data)

  _bounds: (bds) ->
    return @max_wh2_bounds(bds)

class Oval extends Glyph.Model
  default_view: OvalView

  type: 'Oval'

  @coords [['x', 'y']]
  @mixins ['line', 'fill']
  @define {
      angle:  [ p.AngleSpec,   0.0 ]
      width:  [ p.DistanceSpec     ]
      height: [ p.DistanceSpec     ]
    }

module.exports =
  Model: Oval
  View: OvalView
