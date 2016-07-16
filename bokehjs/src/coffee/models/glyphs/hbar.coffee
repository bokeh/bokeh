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
    vy = @renderer.ymapper.v_map_to_target(@_y)
    @sy = @plot_view.canvas.v_vy_to_sy(vy)

    @sright = @renderer.ymapper.v_map_to_target(@_right)
    @sleft = (@renderer.ymapper.v_map_to_target(@_left))

    @stop = []
    @sbottom = []
    @sh = @sdist(@renderer.xmapper, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @stop.push(@sy[i] - @sh[i]/2)
      @sbottom.push(@sy[i] + @sh[i]/2)
    return null

  _render: (ctx, indices, {sleft, sright, stop, sbottom}) ->
    console.log(sleft)
    console.log(sright)
    console.log(stop)
    console.log(sbottom)
    for i in indices
      # console.log(sleft[i], stop[i], sright[i], sbottom[i])
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
      y:      [ p.NumberSpec   ]
      height: [ p.DistanceSpec ]
      left:   [ p.NumberSpec   ]
      right:  [ p.NumberSpec   ]
    }

module.exports =
  Model: HBar
  View: HBarView
