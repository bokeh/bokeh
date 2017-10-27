import {Box, BoxView} from "./box"
import * as p from "core/properties"

export class VBarView extends BoxView

  scy: (i) -> return (@stop[i] + @sbottom[i])/2

  _index_data: () ->
    return @_index_box(@_x.length)

  _lrtb: (i) ->
    l = @_x[i] - @_width[i]/2
    r = @_x[i] + @_width[i]/2
    t = Math.max(@_top[i], @_bottom[i])
    b = Math.min(@_top[i], @_bottom[i])
    return [l, r, t, b]

  _map_data: () ->
    frame = @renderer.plot_view.frame

    vx = @renderer.xscale.v_compute(@_x)
    @sx = frame.v_vx_to_sx(vx)

    vtop = @renderer.yscale.v_compute(@_top)
    @stop = frame.v_vy_to_sy(vtop)

    vbottom = (@renderer.yscale.v_compute(@_bottom))
    @sbottom = frame.v_vy_to_sy(vbottom)

    @sleft = []
    @sright = []
    @sw = @sdist(@renderer.xscale, @_x, @_width, 'center')
    for i in [0...@sx.length]
      @sleft.push(@sx[i] - @sw[i]/2)
      @sright.push(@sx[i] + @sw[i]/2)
    return null

export class VBar extends Box
  default_view: VBarView
  type: 'VBar'

  @coords [['x', 'bottom']]
  @define {
    width:  [ p.DistanceSpec  ]
    top:    [ p.NumberSpec    ]
  }
  @override { bottom: 0 }
