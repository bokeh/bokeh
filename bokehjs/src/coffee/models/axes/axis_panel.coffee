{EQ, GE} = require "../../core/layout/solver"
LayoutCanvas = require "../layouts/layout_canvas"

class AxisPanel extends LayoutCanvas.Model

  get_constraints: () ->
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

module.exports =
  Model: AxisPanel
