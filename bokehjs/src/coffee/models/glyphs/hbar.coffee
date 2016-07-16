_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"
Glyph = require "./glyph"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class HBarView extends Glyph.View

  # Temporarily commented out. To be put back later.
  # _index_data: () ->
  #   index = rbush()
  #   pts = []
  #   for i in [0...@x.length]
  #     if not isNaN(@x[i] + @height[i] + @top[i] + @bottom[i])
  #       w2 = @height[i]/2
  #       pts.push([@x[i]-w2, @bottom[i], @x[i]+w2, @top[i], {'i': i}])
  #   index.load(pts)
  #   return index

  _map_data: () ->
    # Vectorize map to target, map all data space coordinates to screen space
    @sy = @renderer.xmapper.v_map_to_target(@_y)
    vright = @renderer.ymapper.v_map_to_target(@_right)
    vleft = (@renderer.ymapper.v_map_to_target(@_left))

    @stop = @plot_view.canvas.v_vy_to_sy(vright)
    @sbottom = @plot_view.canvas.v_vy_to_sy(vleft)

    @sleft = []
    @sright = []
    @sw = @sdist(@renderer.xmapper, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @sleft.push(@sy[i] - @sw[i]/2)
      @sright.push(@sy[i] + @sw[i]/2)
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

class HBar extends Glyph.Model
  default_view: HBarView
  type: 'HBar'

  @mixins ['line', 'fill']
  @define {
      y:      [ p.NumberSpec   ]
      height: [ p.DistanceSpec ]
      left:   [ p.NumberSpec   ]
      right:  [ p.NumberSpec   ]
    }

module.exports =
  Model: HBar
  View: HBarView
