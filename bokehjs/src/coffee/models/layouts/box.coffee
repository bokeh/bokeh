import {EQ, GE, Variable, WEAK_EQ} from "core/layout/solver"
import * as p from "core/properties"
import {isString} from "core/util/types"
import {all, max, sum} from "core/util/array"
import {extend} from "core/util/object"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"


export class BoxView extends LayoutDOMView
  className: "bk-grid"

  bind_bokeh_events: () ->
    super()
    @listenTo(@model, 'change:children', @build_child_views)

  get_height: () ->
    children = @model.get_layoutable_children()
    child_heights = children.map((child) -> child._height._value)
    if @model._horizontal
      height = max(child_heights)
    else
      height = sum(child_heights)
    return height

  get_width: () ->
    children = @model.get_layoutable_children()
    child_widths = children.map((child) -> child._width._value)
    if @model._horizontal
      width = sum(child_widths)
    else
      width = max(child_widths)
    return width


export class Box extends LayoutDOM
  default_view: BoxView

  constructor: (attrs, options) ->
    super(attrs, options)

    # for children that want to be the same size
    # as other children, make them all equal to these
    @_child_equal_size_width = new Variable()
    @_child_equal_size_height = new Variable()

    # these are passed up to our parent after basing
    # them on the child box-equal-size vars
    @_box_equal_size_top = new Variable()
    @_box_equal_size_bottom = new Variable()
    @_box_equal_size_left = new Variable()
    @_box_equal_size_right = new Variable()

    # these are passed up to our parent after basing
    # them on the child box-cell-align vars
    @_box_cell_align_top = new Variable()
    @_box_cell_align_bottom = new Variable()
    @_box_cell_align_left = new Variable()
    @_box_cell_align_right = new Variable()

  @define {
    children: [ p.Array, [] ]
  }

  @internal {
    spacing:  [ p.Number, 6 ]
  }

  get_layoutable_children: () ->
    @children

  variables_updated: () ->
    # Use trigger to force re-render
    for child in @get_layoutable_children()
      child.trigger('change')
    @trigger('change')

  get_edit_variables: () ->
    edit_variables = super()
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constrained_variables: () ->
    constrained_variables = super()
    constrained_variables = extend(constrained_variables, {
      'box-equal-size-top' : @_box_equal_size_top
      'box-equal-size-bottom' : @_box_equal_size_bottom
      'box-equal-size-left' : @_box_equal_size_left
      'box-equal-size-right' : @_box_equal_size_right

      'box-cell-align-top' : @_box_cell_align_top
      'box-cell-align-bottom' : @_box_cell_align_bottom
      'box-cell-align-left' : @_box_cell_align_left
      'box-cell-align-right' : @_box_cell_align_right
    })
    return constrained_variables

  get_constraints: () ->
    # Note we don't got and get constraints from _layout_dom parent.
    constraints = []

    children = @get_layoutable_children()
    if children.length == 0
      # No need to continue further if there are no children. Children sure do
      # make life a lot more complicated.
      return constraints

    for child in children
      # Test it's layoutable
      @_test_layoutable(child)

      vars = child.get_constrained_variables()
      var_keys = Object.keys(vars)

      # Make total widget sizes fill the orthogonal direction
      # TODO(bird) Can't we make this shorter by using span which has already picked a
      # dominant direction (we'd just also need to set a doc_span)
      rect = @_child_rect(vars)
      if @_horizontal
        if @_has_var('height', var_keys)
          constraints.push(EQ(rect.height, [ -1, @_height ]))
      else
        if @_has_var('width', var_keys)
          constraints.push(EQ(rect.width, [ -1, @_width ]))

      # Add equal-size constraint
      # - A child's "interesting area" (like the plot area) is the same size as the previous child
      #   (a child can opt out of this by not returning the box-equal-size variables)
      if @_horizontal
        if @_has_var(['box-equal-size-left', 'box-equal-size-right', 'width'], var_keys)
          constraints.push(EQ([-1, vars['box-equal-size-left']], [-1, vars['box-equal-size-right']], vars['width'], @_child_equal_size_width))
      else
        if @_has_var(['box-equal-size-top', 'box-equal-size-bottom', 'height'], var_keys)
          constraints.push(EQ([-1, vars['box-equal-size-top']], [-1, vars['box-equal-size-bottom']], vars['height'], @_child_equal_size_height))

      # Pull child constraints up recursively
      constraints = constraints.concat(child.get_constraints())

    # TODO(bird) - This is the second time we loop through children
    last = @_info(children[0].get_constrained_variables())
    constraints.push(EQ(last.span.start, 0))
    for i in [1...children.length]
      next = @_info(children[i].get_constrained_variables())

      # Each child's start equals the previous child's end (unless we have a fixed layout
      # in which case size may not be available)
      if last.span.size
        constraints.push(EQ(last.span.start, last.span.size, [-1, next.span.start]))

      # The whitespace at end of one child + start of next must equal the box spacing.
      # This must be a weak constraint because it can conflict with aligning the
      # alignable edges in each child. Alignment is generally more important visually than spacing.
      constraints.push(WEAK_EQ(last.whitespace.after, next.whitespace.before, 0 - @spacing))

      # If we can't satisfy the whitespace being equal to box spacing, we should fix
      # it (align things) by increasing rather than decreasing the whitespace.
      constraints.push(GE(last.whitespace.after, next.whitespace.before, 0 - @spacing))
      last = next

    # Child's side has to stick to the end of the box
    if @_horizontal
      if @_has_var('width', var_keys)
        constraints.push(EQ(last.span.start, last.span.size, [-1, @_width]))
    else
      if @_has_var('height', var_keys)
        constraints.push(EQ(last.span.start, last.span.size, [-1, @_height]))

    # align outermost edges in both dimensions
    constraints = constraints.concat(@_align_outer_edges_constraints(true)) # horizontal=true
    constraints = constraints.concat(@_align_outer_edges_constraints(false))

    # line up edges in same-arity boxes
    constraints = constraints.concat(@_align_inner_cell_edges_constraints())

    # build our equal-size bounds from the child ones
    constraints = constraints.concat(@_box_equal_size_bounds(true)) # horizontal=true
    constraints = constraints.concat(@_box_equal_size_bounds(false))

    # propagate cell alignment (between same-arity boxes) up the hierarchy
    constraints = constraints.concat(@_box_cell_align_bounds(true)) # horizontal=true
    constraints = constraints.concat(@_box_cell_align_bounds(false))

    # build our whitespace from the child ones
    constraints = constraints.concat(@_box_whitespace(true)) # horizontal=true
    constraints = constraints.concat(@_box_whitespace(false))

    return constraints

  _has_var: (look_up, var_keys) ->
    look_up_list = if isString(look_up) then [look_up] else look_up
    return all(look_up_list, (x) -> x in var_keys)

  _test_layoutable: (child) ->
    required_constrained_variables = [
      'origin-x',
      'origin-y',
      'whitespace-top',
      'whitespace-right',
      'whitespace-bottom',
      'whitespace-left'
    ]
    if not child.get_constrained_variables?
      throw new Error("#{child} is missing get_constrained_variables method")
    vars = child.get_constrained_variables()
    for key in required_constrained_variables
      if key not in Object.keys(vars)
        throw new Error("#{child} is missing constrained_variable #{key}")
      if not vars[key] instanceof Variable
        throw new Error("#{child} #{key} is not a solver Variable")
    return true

  _child_rect: (vars) ->
    width = vars['width']
    height = vars['height']
    [x, y] = [vars['origin-x'], vars['origin-y']]
    return {x: x, y: y, width: width, height: height}

  _span: (rect) ->
    # return [coordinate, size] pair in box-aligned direction
    if @_horizontal
      {start: rect.x, size: rect.width}
    else
      {start: rect.y, size: rect.height}

  _info: (vars) ->
    if @_horizontal
      whitespace = {before: vars['whitespace-left'], after: vars['whitespace-right']}
    else
      whitespace = {before: vars['whitespace-top'], after: vars['whitespace-bottom']}
    span = @_span(@_child_rect(vars))
    return {span: span, whitespace: whitespace}

  _flatten_cell_edge_variables: (horizontal) ->
    # All alignment happens in terms of the
    # box-cell-align-{left,right,top,bottom} variables. We add
    # "path" information to variables so we know which ones align,
    # where the "path" includes the box arity and box cell we went
    # through.
    #
    # If we have a row of three plots, we should align the top and
    # bottom variables between the three plots.
    #
    # The flattened dictionary in this case (for the top and left
    # only) should be:
    #
    #   box-cell-align-top : [ 3 vars ]
    #   box-cell-align-bottom : [ 3 vars ]
    #
    # We don't do left/right starting from a row, and left/right
    # edges have nothing to align with here.
    #
    # Now say we have a row of three columns, each with three
    # plots (3x3 = 9). We should align the top/bottom variables
    # across the top three, middle three, and bottom three plots,
    # as if those groupings were rows. We do this by flattening
    # starting from the row first, which gets us a dictionary only
    # of top/bottom variables.
    #
    #   box-cell-align-top col-3-0- : [ 3 plots from top of columns ]
    #   box-cell-align-top col-3-1- : [ 3 plots from middle of columns ]
    #   box-cell-align-top col-3-2- : [ 3 plots from bottom of columns ]
    #
    # "col-3-1-" = 3-cell column, cell index 1.
    #
    # In three later, separate calls to
    # _align_inner_cell_edges_constraints() on each column, we'll
    # get the left/right variables:
    #
    #   box-cell-align-left : [ 3 left-column plots ]
    #   box-cell-align-left : [ 3 middle-column plots ]
    #   box-cell-align-left : [ 3 right-column plots ]
    #
    # Now add another nesting - we have a row of three columns,
    # each with three rows, each with three plots. This is
    # arranged 3x9 = 27.
    #
    #   box-cell-align-top col-3-0- : [ 9 plots from top rows of columns ]
    #   box-cell-align-top col-3-1- : [ 9 plots from middle rows of columns ]
    #   box-cell-align-top col-3-2- : [ 9 plots from bottom rows of columns ]
    #
    # When we make the _align_inner_cell_edges_constraints() calls on each of the three
    # columns, each column will return row-pathed values
    #
    #   box-cell-align-left row-3-0-: [  3 plots in left column of left column ]
    #   box-cell-align-left row-3-1-: [  3 plots in middle column of left column ]
    #   box-cell-align-left row-3-2-: [  3 plots in right column of left column ]
    #   ... same for the middle and right columns
    #
    # Anyway in essence what we do is that we add only rows to the
    # path to left/right variables, and only columns to the path
    # to top/bottom variables.
    #
    # If we nest yet another level we would finally get paths with
    # multiple rows or multiple columns in them.

    if horizontal
      relevant_edges = Box._top_bottom_inner_cell_edge_variables
    else
      relevant_edges = Box._left_right_inner_cell_edge_variables

    add_path = horizontal != @_horizontal

    children = @get_layoutable_children()
    arity = children.length
    flattened = {}
    cell = 0
    for child in children
      if child instanceof Box
        cell_vars = child._flatten_cell_edge_variables(horizontal)
      else
        cell_vars = {}

      all_vars = child.get_constrained_variables()
      for name in relevant_edges
        if name of all_vars
          cell_vars[name] = [all_vars[name]]

      for key, variables of cell_vars
        if add_path
          parsed = key.split(" ")
          kind = parsed[0]
          if parsed.length > 1
            path = parsed[1]
          else
            path = ""
          if @_horizontal
            direction = "row"
          else
            direction = "col"
          # TODO should we "ignore" arity-1 boxes potentially by not adding a path suffix?
          new_key = "#{kind} #{direction}-#{arity}-#{cell}-#{path}"
        else
          new_key = key
        if new_key of flattened
          flattened[new_key] = flattened[new_key].concat(variables)
        else
          flattened[new_key] = variables

      cell = cell + 1
    return flattened

  # This should only be called on the toplevel box (twice,
  # once with horizontal=true and once with horizontal=false)
  _align_inner_cell_edges_constraints: () ->
    constraints = []
    if @_is_root
      flattened = @_flatten_cell_edge_variables(@_horizontal)
      for key, variables of flattened
        if variables.length > 1
          #console.log("constraining ", key, " ", variables)
          last = variables[0]
          for i in [1...variables.length]
            constraints.push(EQ(variables[i], [-1, last]))
    return constraints

  # returns a two-item array where each item is a list of edge
  # children from the start and end respectively
  _find_edge_leaves: (horizontal) ->
    children = @get_layoutable_children()

    # console.log("  finding edge leaves in #{children.length}-#{@type}, " +
    #  "our orientation #{@_horizontal} finding #{horizontal} children ", children)

    leaves = [ [] , [] ]
    if children.length > 0
      if @_horizontal == horizontal
        # note start and end may be the same
        start = children[0]
        end = children[children.length - 1]

        if start instanceof Box
          leaves[0] = leaves[0].concat(start._find_edge_leaves(horizontal)[0])
        else
          leaves[0].push(start)

        if end instanceof Box
          leaves[1] = leaves[1].concat(end._find_edge_leaves(horizontal)[1])
        else
          leaves[1].push(end)
      else
        # if we are a column and someone wants the horizontal edges,
        # we return the horizontal edges from all of our children
        for child in children
          if child instanceof Box
            child_leaves = child._find_edge_leaves(horizontal)
            leaves[0] = leaves[0].concat(child_leaves[0])
            leaves[1] = leaves[1].concat(child_leaves[1])
          else
            leaves[0].push(child)
            leaves[1].push(child)

    # console.log("  start leaves ", leaves[0].map((leaf) -> leaf.id)
    # console.log("  end leaves ", leaves[1].map((leaf) -> leaf.id)

    return leaves

  _align_outer_edges_constraints: (horizontal) ->
    # console.log("#{if horizontal then 'horizontal' else 'vertical'} outer edge constraints in #{@get_layoutable_children().length}-#{@type}")

    [start_leaves, end_leaves] = @_find_edge_leaves(horizontal)

    if horizontal
      start_variable = 'on-edge-align-left'
      end_variable = 'on-edge-align-right'
    else
      start_variable = 'on-edge-align-top'
      end_variable = 'on-edge-align-bottom'

    collect_vars = (leaves, name) ->
      #console.log("collecting #{name} in ", leaves)
      edges = []
      for leaf in leaves
        vars = leaf.get_constrained_variables()
        if name of vars
          edges.push(vars[name])
          #vars[name]['_debug'] = "#{name} from #{leaf.id}"
      edges

    start_edges = collect_vars(start_leaves, start_variable)
    end_edges = collect_vars(end_leaves, end_variable)

    result = []
    add_all_equal = (edges) ->
      if edges.length > 1
        first = edges[0]
        for i in [1...edges.length]
          edge = edges[i]
          #console.log("  constraining #{first._debug} == #{edge._debug}")
          result.push(EQ([-1, first], edge))
        null # prevent coffeescript from making a tmp array

    add_all_equal(start_edges)
    add_all_equal(end_edges)

    # console.log("computed constraints ", result)

    return result

  _box_insets_from_child_insets: (horizontal, child_variable_prefix, our_variable_prefix, minimum) ->
    [start_leaves, end_leaves] = @_find_edge_leaves(horizontal)

    if horizontal
      start_variable = "#{child_variable_prefix}-left"
      end_variable = "#{child_variable_prefix}-right"
      our_start = @["#{our_variable_prefix}_left"]
      our_end = @["#{our_variable_prefix}_right"]
    else
      start_variable = "#{child_variable_prefix}-top"
      end_variable = "#{child_variable_prefix}-bottom"
      our_start = @["#{our_variable_prefix}_top"]
      our_end = @["#{our_variable_prefix}_bottom"]

    result = []
    add_constraints = (ours, leaves, name) ->
      edges = []
      for leaf in leaves
        vars = leaf.get_constrained_variables()
        if name of vars
          if minimum
            result.push(GE([-1, ours], vars[name]))
          else
            result.push(EQ([-1, ours], vars[name]))
      null # prevent coffeescript from making a tmp array

    add_constraints(our_start, start_leaves, start_variable)
    add_constraints(our_end, end_leaves, end_variable)

    return result

  _box_equal_size_bounds: (horizontal) ->
    # false = box bounds equal all outer child bounds exactly
    @_box_insets_from_child_insets(horizontal, 'box-equal-size', '_box_equal_size', false)

  _box_cell_align_bounds: (horizontal) ->
    # false = box bounds equal all outer child bounds exactly
    @_box_insets_from_child_insets(horizontal, 'box-cell-align', '_box_cell_align', false)

  _box_whitespace: (horizontal) ->
    # true = box whitespace must be the minimum of child
    # whitespaces (i.e. distance from box edge to the outermost
    # child pixels)
    @_box_insets_from_child_insets(horizontal, 'whitespace', '_whitespace', true)

  @_left_right_inner_cell_edge_variables = [
    'box-cell-align-left',
    'box-cell-align-right'
  ]

  @_top_bottom_inner_cell_edge_variables = [
    'box-cell-align-top',
    'box-cell-align-bottom'
  ]
