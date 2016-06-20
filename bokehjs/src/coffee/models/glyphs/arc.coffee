_ = require "underscore"

Glyph = require "./glyph"
p = require "../../core/properties"

class ArcView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _map_data: () ->
    if @model.properties.radius.units == "data"
      @sradius = @sdist(@renderer.xmapper, @_x, @_radius)
    else
      @sradius = @_radius

  _render: (ctx, indices, {sx, sy, sradius, _start_angle, _end_angle}) ->
    if @visuals.line.doit
      direction = @model.properties.direction.value()
      for i in indices
        if isNaN(sx[i]+sy[i]+sradius[i]+_start_angle[i]+_end_angle[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction)

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Arc extends Glyph.Model
  default_view: ArcView

  type: 'Arc'

  @coords [['x', 'y']]
  @mixins ['line']
  @define {
      direction:   [ p.Direction,   'anticlock' ]
      radius:      [ p.DistanceSpec             ]
      start_angle: [ p.AngleSpec                ]
      end_angle:   [ p.AngleSpec                ]
    }

module.exports =
  Model: Arc
  View: ArcView
