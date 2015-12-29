_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"

class HBarView extends Quad.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@y.length]
      if not isNaN(@y[i] + @height[i] + @left[i] + @right[i])
        h2 = @height[i]/2
        pts.push([@left[i], @y[i]-h2, @right[i], @y[i]+h2, {'i': i}])
    index.load(pts)
    return index

  _map_data: () ->
    console.log "HBAR MAP"
    @sy = @renderer.ymapper.v_map_to_target(@y)
    @sh = @sdist(@renderer.ymapper, @y, @height, 'center')
    for i in [0...@sh.length]
      @stop[i] = @sy[i] + @sh[i]/2
      @sbottom[i] = @sy[i] - @sh[i]/2

class HBar extends Quad.Model
  default_view: HBarView
  type: 'HBar'
  fields: [ 'y', 'left', 'right', 'height' ]

module.exports =
  Model: HBar
  View: HBarView