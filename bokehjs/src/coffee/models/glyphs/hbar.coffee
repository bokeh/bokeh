import {Box, BoxView} from "./box"
import * as p from "core/properties"

export class HBarView extends BoxView

  scx: (i) -> return (@sleft[i] + @sright[i])/2

  _index_data: () ->
    return @_index_box(@_y.length)

  _lrtb: (i) ->
    l = Math.min(@_left[i], @_right[i])
    r = Math.max(@_left[i], @_right[i])
    t = @_y[i] + 0.5 * @_height[i]
    b = @_y[i] - 0.5 * @_height[i]
    return [l, r, t, b]

  _map_data: () ->
    @sy = @renderer.yscale.v_compute(@_y)
    @sright = @renderer.xscale.v_compute(@_right)
    @sleft = @renderer.xscale.v_compute(@_left)

    @stop = []
    @sbottom = []
    @sh = @sdist(@renderer.yscale, @_y, @_height, 'center')
    for i in [0...@sy.length]
      @stop.push(@sy[i] - @sh[i]/2)
      @sbottom.push(@sy[i] + @sh[i]/2)
    return null

export class HBar extends Box
  default_view: HBarView
  type: 'HBar'

  @coords [['left', 'y']]
  @define {
    height: [ p.DistanceSpec  ]
    right:  [ p.NumberSpec    ]
  }
  @override { left: 0 }
