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
    vertical   : RIGHT
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

export update_constraints = (view) ->
  v = view

  if v.model.props.visible?
    if v.model.visible is false
      # if not visible, avoid applying constraints until visible again
      return

  # Constrain size based on contents (may not have changed)
  size = v._get_size()

  if not v._last_size?
    v._last_size = -1

  if size == v._last_size
    return

  s = v.model.document.solver()

  v._last_size = size
  if v._size_constraint?
    s.remove_constraint(v._size_constraint, true)
  v._size_constraint = GE(v.model.panel._size, -size)
  s.add_constraint(v._size_constraint)

  # Constrain Full Dimension - link it to the plot (only needs to be done once)
  # If axis is on the left, then it is the full height of the plot.
  # If axis is on the top, then it is the full width of the plot.
  if not v._full_set?
    v._full_set = false
  if not v._full_set
    side = v.model.panel.side
    if side in ['above', 'below']
      s.add_constraint(EQ(v.model.panel._width, [-1, v.plot_model.canvas._width]))
    if side in ['left', 'right']
      s.add_constraint(EQ(v.model.panel._height, [-1, v.plot_model.canvas._height]))
    v._full_set = true


export class SidePanel extends LayoutCanvas

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
        @_anchor = @_bottom
      when "below"
        @_dim = 0
        @_normals = [0, 1]
        @_size = @_height
        @_anchor = @_top
      when "left"
        @_dim = 1
        @_normals = [-1, 0]
        @_size = @_width
        @_anchor = @_right
      when "right"
        @_dim = 1
        @_normals = [1, 0]
        @_size = @_width
        @_anchor = @_left
      else
        logger.error("unrecognized side: '#{ @side }'")

  get_constraints: () ->
    #
    # TODO (bird): Investigate changing the convention of when constraints are added
    # so that if a side panel was added later, then these constraints would be
    # picked up. (This would also play into the ability to remove a panel from
    # the canvas).
    #
    constraints = []
    constraints.push(GE(@_top))
    constraints.push(GE(@_bottom))
    constraints.push(GE(@_left))
    constraints.push(GE(@_right))
    constraints.push(GE(@_width))
    constraints.push(GE(@_height))
    constraints.push(EQ(@_left, @_width, [-1, @_right]))
    constraints.push(EQ(@_bottom, @_height, [-1, @_top]))
    return constraints

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
