import {EQ, GE} from "./solver"
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

# Some terms:
#
# - Size: is the narrower (usually) dimension that is calculated based on
#         the contents of the panel
# - Full: is the other dimension which we want to extend to either the full
#         height or width. Extending to full height or width means it's easy to
#         calculate mid-way for alignment.

export update_panel_constraints = (view) ->
  if view.model.props.visible? and not view.model.visible
    # if not visible, avoid applying constraints until visible again
    return

  s = view.solver

  if view._size_constraint? and s.has_constraint(view._size_constraint)
    s.remove_constraint(view._size_constraint)
  view._size_constraint = GE(view.model.panel._size, -view._get_size())
  s.add_constraint(view._size_constraint)

  # Constrain Full Dimension - link it to the plot (only needs to be done once)
  # If axis is on the left, then it is the full height of the plot.
  # If axis is on the top, then it is the full width of the plot.

  if view._full_constraint? and s.has_constraint(view._full_constraint)
    s.remove_constraint(view._full_constraint)

  view._full_constraint = switch view.model.panel.side
    when 'above', 'below' then EQ(view.model.panel._width,  [-1, view.plot_model.canvas._width])
    when 'left', 'right'  then EQ(view.model.panel._height, [-1, view.plot_model.canvas._height])

  s.add_constraint(view._full_constraint)

export class SidePanel extends LayoutCanvas
  type: "SidePanel"

  @internal {
    side: [ p.String ]
    plot: [ p.Instance ]
  }

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
