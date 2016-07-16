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
    # debugger
    # Vectorize map to target, map all data space coordinates to screen space
    @sx = @renderer.xmapper.v_map_to_target(@_x)
    @stop = @renderer.ymapper.v_map_to_target(@_top)
    @sbottom = @renderer.ymapper.v_map_to_target(@_bottom)
    # Gets the width.
    @sw = @sdist(@renderer.xmapper, @_x, @_width, 'center')
    debugger
    for i in [0...@sx.length]
      @sleft[i] = @sx[i] - @sw[i]/2
      @sright[i] = @sx[i] + @sw[i]/2
    return null

  _render: (ctx, indices, {sleft, sright, stop, sbottom}) ->
    debugger
    super(ctx, indices, {sleft, sright, stop, sbottom})


class VBar extends Quad.Model
  default_view: VBarView
  type: 'VBar'

  # Mixins automatically provide additional properties associated with
  # lines - width, transparency, color, etc.
  # fill - alpha, color, etc.
  # Quad.View already has this, so do not uncomment the next line.
  # @mixins ['line', 'fill']
  # These should match the Python API closely (more or less).
  @define {
      x:      [ p.NumberSpec   ]
      width:  [ p.DistanceSpec ]
      # top and bottom are already defined, so no need to re-define.
      # do not uncomment the next two lines.
      # top:    [ p.NumberSpec   ]
      # bottom: [ p.NumberSpec   ]
    }

module.exports =
  Model: VBar
  View: VBarView
