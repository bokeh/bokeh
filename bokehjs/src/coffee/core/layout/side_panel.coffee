{EQ, GE} = require "./solver"
LayoutCanvas = require "./layout_canvas"

p = require "../../core/properties"
{logger} = require "../../core/logging"


update_constraints = (view) ->
  if view.model.props.visible?
    if view.mget('visible') is false
      # if not visible, avoid applying constraints until visible again
      return
  size = view._get_size()
  if not view._last_size?
    view._last_size = -1
  if size == view._last_size
    return
  solver = view.model.document.solver()
  view._last_size = size
  if view._size_constraint?
      solver.remove_constraint(view._size_constraint)
  view._size_constraint = GE(view.model.panel._size, -size)
  solver.add_constraint(view._size_constraint)
  return null


class SidePanel extends LayoutCanvas.Model

  @internal {
    side: [ p.String ]
  }

  initialize: (attrs, options)->
    super(attrs, options)
    side = @get('side')
    if side == "above"
      @_dim = 0
      @_normals = [0, -1]
      @_size = @_height
      @_anchor = @_bottom
    else if side == "below"
      @_dim = 0
      @_normals = [0, 1]
      @_size = @_height
      @_anchor = @_top
    else if side == "left"
      @_dim = 1
      @_normals = [-1, 0]
      @_size = @_width
      @_anchor = @_right
    else if side == "right"
      @_dim = 1
      @_normals = [1, 0]
      @_size = @_width
      @_anchor = @_left
    else
      logger.error("unrecognized side: '#{ side }'")

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
  Model: SidePanel
  update_constraints: update_constraints
