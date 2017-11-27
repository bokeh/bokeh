import {GE} from "./solver"
import {LayoutCanvas} from "./layout_canvas"

import * as p from "core/properties"
import {logger} from "core/logging"
import {isString} from "core/util/types"

# This table lays out the rules for configuring the baseline, alignment, etc. of
# title text, based on it's location and orientation
#
# side    orient        baseline   align     angle   normal-dist
# ------------------------------------------------------------------------------
# above   parallel      bottom     center    0       height
#         normal        middle     left      -90     width
#         horizontal    bottom     center    0       height
#         [angle > 0]   middle     left              width * sin + height * cos
#         [angle < 0]   middle     right             width * sin + height * cos
#
# below   parallel      top        center    0       height
#         normal        middle     right     90      width
#         horizontal    top        center    0       height
#         [angle > 0]   middle     right             width * sin + height * cos
#         [angle < 0]   middle     left              width * sin + height * cos
#
# left    parallel      bottom     center    90      height
#         normal        middle     right     0       width
#         horizontal    middle     right     0       width
#         [angle > 0]   middle     right             width * cos + height * sin
#         [angle < 0]   middle     right             width * cos + height + sin
#
# right   parallel      bottom     center   -90      height
#         normal        middle     left     0        width
#         horizontal    middle     left     0        width
#         [angle > 0]   middle     left              width * cos + height * sin
#         [angle < 0]   middle     left              width * cos + height + sin

pi2 = Math.PI/2
ALPHABETIC = 'alphabetic'
TOP = 'top'
BOTTOM = 'bottom'
MIDDLE = 'middle'
HANGING = 'hanging'
LEFT = 'left'
RIGHT = 'right'
CENTER = 'center'

_angle_lookup = {
  above:
    parallel   : 0
    normal     : -pi2
    horizontal : 0
    vertical   : -pi2
  below:
    parallel   : 0
    normal     : pi2
    horizontal : 0
    vertical   : pi2
  left:
    parallel   : -pi2
    normal     : 0
    horizontal : 0
    vertical   : -pi2
  right:
    parallel   : pi2
    normal     : 0
    horizontal : 0
    vertical   : pi2
}

_baseline_lookup = {
  above:
    justified  : TOP
    parallel   : ALPHABETIC
    normal     : MIDDLE
    horizontal : ALPHABETIC
    vertical   : MIDDLE
  below:
    justified  : BOTTOM
    parallel   : HANGING
    normal     : MIDDLE
    horizontal : HANGING
    vertical   : MIDDLE
  left:
    justified  : TOP
    parallel   : ALPHABETIC
    normal     : MIDDLE
    horizontal : MIDDLE
    vertical   : ALPHABETIC
  right:
    justified  : TOP
    parallel   : ALPHABETIC
    normal     : MIDDLE
    horizontal : MIDDLE
    vertical   : ALPHABETIC
}

_align_lookup = {
  above:
    justified  : CENTER
    parallel   : CENTER
    normal     : LEFT
    horizontal : CENTER
    vertical   : LEFT
  below:
    justified  : CENTER
    parallel   : CENTER
    normal     : LEFT
    horizontal : CENTER
    vertical   : LEFT
  left:
    justified  : CENTER
    parallel   : CENTER
    normal     : RIGHT
    horizontal : RIGHT
    vertical   : CENTER
  right:
    justified  : CENTER
    parallel   : CENTER
    normal     : LEFT
    horizontal : LEFT
    vertical   : CENTER
}

_align_lookup_negative = {
  above  : RIGHT
  below  : LEFT
  left   : RIGHT
  right  : LEFT
}

_align_lookup_positive = {
  above  : LEFT
  below  : RIGHT
  left   : RIGHT
  right  : LEFT
}

export _view_sizes = new WeakMap() # <View, number>

export update_panel_constraints = (view) ->
  size = view.get_size()

  s = view.solver

  if view._size_constraint? and s.has_constraint(view._size_constraint)
    if _view_sizes.get(view) == size
      return
    s.remove_constraint(view._size_constraint)

  _view_sizes.set(view, size)

  view._size_constraint = GE(view.model.panel._size, -size)
  s.add_constraint(view._size_constraint)

export class SidePanel extends LayoutCanvas
  type: "SidePanel"

  @internal {
    side: [ p.String ]
  }

  toString: () ->
    return "#{@type}(#{@id}, #{@side})"

  initialize: (attrs, options)->
    super(attrs, options)
    switch @side
      when "above"
        @_dim = 0
        @_normals = [0, -1]
        @_size = @_height
      when "below"
        @_dim = 0
        @_normals = [0, 1]
        @_size = @_height
      when "left"
        @_dim = 1
        @_normals = [-1, 0]
        @_size = @_width
      when "right"
        @_dim = 1
        @_normals = [1, 0]
        @_size = @_width
      else
        logger.error("unrecognized side: '#{ @side }'")

  @getters {
    is_horizontal: () -> @side == "above" or @side == "below"
    is_vertical: () -> @side == "left" or @side == "right"
  }

  apply_label_text_heuristics: (ctx, orient) ->
    side = @side

    if isString(orient)
      baseline = _baseline_lookup[side][orient]
      align = _align_lookup[side][orient]

    else if orient == 0
      baseline = _baseline_lookup[side][orient]
      align = _align_lookup[side][orient]

    else if orient < 0
      baseline = 'middle'
      align = _align_lookup_negative[side]

    else if orient > 0
      baseline = 'middle'
      align = _align_lookup_positive[side]

    ctx.textBaseline = baseline
    ctx.textAlign = align
    return ctx

  get_label_angle_heuristic: (orient) ->
    side = @side
    return _angle_lookup[side][orient]
