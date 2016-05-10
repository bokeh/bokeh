{EQ, GE} = require "./solver"
LayoutCanvas = require "./layout_canvas"

p = require "../../core/properties"
{logger} = require "../../core/logging"

# Some terms:
#
# - Size: is the narrower (usually) dimension that is calculated based on 
#         the contents of the panel
# - Full: is the other dimension which we want to extend to either the full
#         height or width. Extending to full height or width means it's easy to
#         calculate mid-way for alignment.


update_constraints = (view) ->
  v = view

  if v.model.props.visible?
    if v.mget('visible') is false
      # if not visible, avoid applying constraints until visible again
      return

  size = v._get_size()

  if not v._last_size?
    v._last_size = -1

  if size == v._last_size
    return

  s = v.model.document.solver()

  v._last_size = size
  if v._size_constraint?
      s.remove_constraint(v._size_constraint)
  v._size_constraint = GE(v.model.panel._size, -size)
  s.add_constraint(v._size_constraint)

  # Set Full (only needs to be done once)
  if not v._full_set?
    v._full_set = false
  if not v._full_set
    side = v.model.panel.get('side')
    if side in ['above', 'below']
      s.add_constraint(EQ(v.model.panel._width, [-1, v.plot_model.canvas._width]))
    if side in ['left', 'right']
      s.add_constraint(EQ(v.model.panel._height, [-1, v.plot_model.canvas._height]))
    v._full_set = true


class SidePanel extends LayoutCanvas.Model

  @internal {
    side: [ p.String ]
    plot: [ p.Instance ]
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
