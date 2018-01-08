import {Box, BoxView} from "./box"

export class QuadView extends BoxView

  get_anchor_point: (anchor, i, spt) ->
    left = Math.min(@sleft[i], @sright[i])
    right = Math.max(@sright[i], @sleft[i])
    top = Math.min(@stop[i], @sbottom[i])     # screen coordinates !!!
    bottom = Math.max(@sbottom[i], @stop[i])  #

    switch anchor
      when 'top_left'      then {x: left,             y: top              }
      when 'top_center'    then {x: (left + right)/2, y: top              }
      when 'top_right'     then {x: right,            y: top              }
      when 'center_right'  then {x: right,            y: (top + bottom)/2 }
      when 'bottom_right'  then {x: right,            y: bottom           }
      when 'bottom_center' then {x: (left + right)/2, y: bottom           }
      when 'bottom_left'   then {x: left,             y: bottom           }
      when 'center_left'   then {x: left,             y: (top + bottom)/2 }
      when 'center'        then {x: (left + right)/2, y: (top + bottom)/2 }

  scx: (i) ->
    return (@sleft[i] + @sright[i])/2

  scy: (i) ->
    return (@stop[i] + @sbottom[i])/2

  _index_data: () ->
    return @_index_box(@_right.length)

  _lrtb: (i) ->
    l = @_left[i]
    r = @_right[i]
    t = @_top[i]
    b = @_bottom[i]
    return [l, r, t, b]

export class Quad extends Box
  default_view: QuadView
  type: 'Quad'

  @coords [['right', 'bottom'], ['left', 'top']]
