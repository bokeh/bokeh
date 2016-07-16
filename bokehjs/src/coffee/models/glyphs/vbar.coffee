_ = require "underscore"
rbush = require "rbush"
Quad = require "./quad"

class VBarView extends Quad.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@x.length]
      if not isNaN(@x[i] + @width[i] + @top[i] + @bottom[i])
        w2 = @width[i]/2
        pts.push([@x[i]-w2, @bottom[i], @x[i]+w2, @top[i], {'i': i}])
    index.load(pts)
    return index

  _map_data: () ->
    @sx = @renderer.xmapper.v_map_to_target(@x)
    @sw = @sdist(@renderer.xmapper, @x, @width, 'center')
    for i in [0...@sw.length]
      @sleft[i] = @sx[i] - @sw[i]/2
      @sright[i] = @sx[i] + @sw[i]/2

class VBar extends Quad.Model
  default_view: VBarView
  type: 'VBar'
  fields: [ 'x', 'top', 'bottom', 'width' ]

module.exports =
  Model: VBar
  View: VBarView