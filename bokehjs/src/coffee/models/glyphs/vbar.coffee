_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"
Glyph = require "./glyph"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class VBarView extends Glyph.View

  _map_data: () ->
    # Vectorize map to target, map all data space coordinates to screen space
    @sx = @renderer.xmapper.v_map_to_target(@_x)
    vtop = @renderer.ymapper.v_map_to_target(@_top)
    vbottom = (@renderer.ymapper.v_map_to_target(@_bottom))

    @stop = @plot_view.canvas.v_vy_to_sy(vtop)
    @sbottom = @plot_view.canvas.v_vy_to_sy(vbottom)

    @sleft = []
    @sright = []
    @sw = @sdist(@renderer.xmapper, @_x, @_width, 'center')
    for i in [0...@sx.length]
      @sleft.push(@sx[i] - @sw[i]/2)
      @sright.push(@sx[i] + @sw[i]/2)
    return null

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

class VBar extends Glyph.Model
  default_view: VBarView
  type: 'VBar'

  @mixins ['line', 'fill']
  @define {
      x:      [ p.NumberSpec    ]
      width:  [ p.DistanceSpec  ]
      top:    [ p.NumberSpec    ]
      bottom: [ p.NumberSpec, 0 ]
    }

module.exports =
  Model: VBar
  View: VBarView
