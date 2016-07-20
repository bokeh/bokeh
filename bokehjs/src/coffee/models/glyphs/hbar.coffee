_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"
Glyph = require "./glyph"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class HBarView extends Glyph.View

  _map_data: () ->
    # Vectorize map to target, map all data space coordinates to screen space
    vy = @renderer.ymapper.v_map_to_target(@_y)
    @sy = @plot_view.canvas.v_vy_to_sy(vy)
    vright = @renderer.xmapper.v_map_to_target(@_right)
    vleft = @renderer.xmapper.v_map_to_target(@_left)

    @sright = @plot_view.canvas.v_vx_to_sx(vright)
    @sleft = @plot_view.canvas.v_vx_to_sx(vleft)

    @stop = []
    @sbottom = []
    @sh = @sdist(@renderer.ymapper, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @stop.push(@sy[i] - @sh[i]/2)
      @sbottom.push(@sy[i] + @sh[i]/2)
    return null

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

class HBar extends Glyph.Model
  default_view: HBarView
  type: 'HBar'

  @mixins ['line', 'fill']
  @define {
      y:      [ p.NumberSpec    ]
      height: [ p.DistanceSpec  ]
      left:   [ p.NumberSpec, 0 ]
      right:  [ p.NumberSpec    ]
    }

module.exports =
  Model: HBar
  View: HBarView
