_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"
Glyph = require "./glyph"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class VBarView extends Quad.View

  # _index_data: () ->
  #   index = rbush()
  #   pts = []
  #   for i in [0...@x.length]
  #     if not isNaN(@x[i] + @width[i] + @top[i] + @bottom[i])
  #       w2 = @width[i]/2
  #       pts.push([@x[i]-w2, @bottom[i], @x[i]+w2, @top[i], {'i': i}])
  #   index.load(pts)
  #   return index

  _map_data: () ->
    # Vectorize map to target, map all data space coordinates to screen space
    @sx = @renderer.xmapper.v_map_to_target(@x)
    @stop = @renderer.ymapper.v_map_to_target(@top)
    @sbottom = @renderer.ymapper.v_map_to_target(@bottom)
    # Gets the width.
    @sw = @sdist(@renderer.xmapper, @x, @width, 'center')
    for i in [0...@sw.length]
      @sleft[i] = @sx[i] - @sw[i]/2
      @sright[i] = @sx[i] + @sw[i]/2

class VBar extends Quad.Model
  default_view: VBarView
  type: 'VBar'

  # Mixins automatically provide additional properties associated with
  # lines - width, transparency, color, etc.
  # fill - alpha, color, etc.
  @mixins ['line', 'fill']
  # These should match the Python API closely (more or less).
  @define {
      x:      [ p.NumberSpec   ]
      width:  [ p.DistanceSpec ]
      top:    [ p.NumberSpec   ]
      bottom: [ p.NumberSpec   ]
    }

module.exports =
  Model: VBar
  View: VBarView
