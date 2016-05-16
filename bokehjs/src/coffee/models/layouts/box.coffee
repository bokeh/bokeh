_ = require "underscore"
$ = require "jquery"
build_views = require "../../common/build_views"

BokehView = require "../../core/bokeh_view"
{EQ, GE, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "./layout_dom"


class BoxView extends BokehView
  className: "bk-grid"

  initialize: (options) ->
    super(options)

    children = @model.get_layoutable_children()
    @child_views = {}
    build_views(@child_views, children)
  
    for own key, child_view of @child_views
      @$el.append(child_view.$el)

    @bind_bokeh_events()

    if @model._is_root == true
      resize = () -> $(window).trigger('resize')
      # I haven't found a way to not trigger this multiple times.
      # The problem is that the widgets need to be rendererd before we can
      # figure out what size we want them.
      _.delay(resize, 5)
      _.delay(resize, 15)

  bind_bokeh_events: () ->
    @listenTo(@model.document.solver(), 'resize', () => @model.variables_updated())
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.addClass(@mget('responsive'))

    if @mget('responsive') == 'width'
      @update_constraints()

    LayoutDOM.render_dom(@)

  update_constraints: () ->
    s = @model.document.solver()
    height = 0
    for own key, child_view of @child_views
      height += child_view.el.scrollHeight
    s.suggest_value(@model._height, height)
  

class Box extends LayoutDOM.Model
  default_view: BoxView

  constructor: (attrs, options) ->
    super(attrs, options)

    # for children that want to be the same size
    # as other children, make them all equal to these
    @_child_equal_size_width = new Variable("_child_equal_size_width #{@id}")
    @_child_equal_size_height = new Variable("_child_equal_size_height #{@id}")

    # these are passed up to our parent after basing
    # them on the child box-equal-size vars
    @_box_equal_size_top = new Variable("_box_equal_size_top #{@id}")
    @_box_equal_size_bottom = new Variable("_box_equal_size_bottom #{@id}")
    @_box_equal_size_left = new Variable("_box_equal_size_left #{@id}")
    @_box_equal_size_right = new Variable("_box_equal_size_right #{@id}")

    # these are passed up to our parent after basing
    # them on the child box-cell-align vars
    @_box_cell_align_top = new Variable("_box_equal_size_top #{@id}")
    @_box_cell_align_bottom = new Variable("_box_equal_size_bottom #{@id}")
    @_box_cell_align_left = new Variable("_box_equal_size_left #{@id}")
    @_box_cell_align_right = new Variable("_box_equal_size_right #{@id}")

  @define {
    children: [ p.Array, [] ]
  }

  @internal {
    spacing:  [ p.Number, 6 ]
  }

  _ensure_origin_variables: (child) ->
    if '__Box_x' not of child
      child['__Box_x'] = new Variable("child_origin_x #{@id}")
    if '__Box_y' not of child
      child['__Box_y'] = new Variable("child_origin_y #{@id}")
    return [child['__Box_x'], child['__Box_y']]

  get_constraints: () ->
    children = @get_layoutable_children()
    result = []
    if children.length != 0
      child_rect = (child) =>
        vars = child.get_constrained_variables()
        width = vars['width']
        height = vars['height']
        [x, y] = @_ensure_origin_variables(child)
        [x, y, width, height]

      # return [coordinate, size] pair in box-aligned direction
      span = (rect) =>
        if @_horizontal
          [rect[0], rect[2]]
        else
          [rect[1], rect[3]]

      whitespace = (child) =>
        vars = child.get_constrained_variables()
        if @_horizontal
          [vars['whitespace-left'], vars['whitespace-right']]
        else
          [vars['whitespace-top'], vars['whitespace-bottom']]

      add_equal_size_constraints = (child, constraints) =>
        # child's "interesting area" (like the plot area) is the
        # same size as the previous child (a child can opt out of
        # this by not returning the box-equal-size variables)

        vars = child.get_constrained_variables()

        if @_horizontal
          if 'box-equal-size-left' of vars
            constraints.push(EQ([-1, vars['box-equal-size-left']], [-1, vars['box-equal-size-right']], vars['width'], @_child_equal_size_width))
        else
          if child.get('grow') == true
            if 'box-equal-size-top' of vars
              constraints.push(EQ([-1, vars['box-equal-size-top']], [-1, vars['box-equal-size-bottom']], vars['height'], @_child_equal_size_height))

      info = (child) =>
        {
          span: span(child_rect(child))
          whitespace: whitespace(child)
        }

      spacing = @get('spacing')

      for child in children

        # make total widget sizes fill the orthogonal direction
        rect = child_rect(child)
        if @_horizontal
          result.push(EQ(rect[3], [ -1, @_height ]))
        else
          result.push(EQ(rect[2], [ -1, @_width ]))

        add_equal_size_constraints(child, result)

        # pull child constraints up recursively
        result = result.concat(child.get_constraints())

      last = info(children[0])
      result.push(EQ(last.span[0], 0))
      for i in [1...children.length]
        next = info(children[i])
        # each child's start equals the previous child's end
        result.push(EQ(last.span[0], last.span[1], [-1, next.span[0]]))
        # the whitespace at end of one child + start of next must equal
        # the box spacing. This must be a weak constraint because it can
        # conflict with aligning the alignable edges in each child.
        # Alignment is generally more important visually than spacing.
        
        # TODO This was in havoc's original layout algorithm but it causes
        # plots to fail in box layouts. I'm not sure WEAK_EQ works.
        # result.push(WEAK_EQ(last.whitespace[1], next.whitespace[0], 0 - spacing))

        # if we can't satisfy the whitespace being equal to box spacing,
        # we should fix it (align things) by increasing rather than decreasing
        # the whitespace.
        result.push(GE(last.whitespace[1], next.whitespace[0], 0 - spacing))
        last = next

      # Child's side has to stick to the end of the box
      if @_horizontal
        total = @_width
      else
        total = @_height
      result.push(EQ(last.span[0], last.span[1], [-1, total]))

      # align outermost edges in both dimensions
      result = result.concat(@_align_outer_edges_constraints(true)) # horizontal=true
      result = result.concat(@_align_outer_edges_constraints(false))

      # line up edges in same-arity boxes
      result = result.concat(@_align_inner_cell_edges_constraints())

      # build our equal-size bounds from the child ones
      result = result.concat(@_box_equal_size_bounds(true)) # horizontal=true
      result = result.concat(@_box_equal_size_bounds(false))

      # propagate cell alignment (between same-arity boxes) up the hierarchy
      result = result.concat(@_box_cell_align_bounds(true)) # horizontal=true
      result = result.concat(@_box_cell_align_bounds(false))

      # build our whitespace from the child ones
      result = result.concat(@_box_whitespace(true)) # horizontal=true
      result = result.concat(@_box_whitespace(false))

    return result

  get_constrained_variables: () ->
    {
      'width' : @_width
      'height' : @_height
      'box-equal-size-top' : @_box_equal_size_top
      'box-equal-size-bottom' : @_box_equal_size_bottom
      'box-equal-size-left' : @_box_equal_size_left
      'box-equal-size-right' : @_box_equal_size_right
      'box-cell-align-top' : @_box_cell_align_top
      'box-cell-align-bottom' : @_box_cell_align_bottom
      'box-cell-align-left' : @_box_cell_align_left
      'box-cell-align-right' : @_box_cell_align_right
      'whitespace-top' : @_whitespace_top
      'whitespace-bottom' : @_whitespace_bottom
      'whitespace-left' : @_whitespace_left
      'whitespace-right' : @_whitespace_right
    }

  get_layoutable_children: () ->
    @get('children')

  @_left_right_inner_cell_edge_variables = [
    'box-cell-align-left',
    'box-cell-align-right'
  ]

  @_top_bottom_inner_cell_edge_variables = [
    'box-cell-align-top',
    'box-cell-align-bottom'
  ]

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

  # TODO right now we call this recursively on every child, but
  # really it should only be called on the toplevel box (twice,
  # once with horizontal=true and once with horizontal=false).  We
  # end up adding identical constraints over and over again by
  # calling it all the way down the hierarchy.
  _align_inner_cell_edges_constraints: () ->
    flattened = @_flatten_cell_edge_variables(@_horizontal)

    result = []
    for key, variables of flattened
      if variables.length > 1
        #console.log("constraining ", key, " ", variables)
        last = variables[0]
        for i in [1...variables.length]
          result.push(EQ(variables[i], [-1, last]))

    result

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

    # console.log("  start leaves ", _.map(leaves[0], (leaf) -> leaf.id))
    # console.log("  end leaves ", _.map(leaves[1], (leaf) -> leaf.id))

    return leaves

  _align_outer_edges_constraints: (horizontal) ->
    # console.log("#{if horizontal then 'horizontal' else 'vertical'} outer edge constraints in #{@get_layoutable_children().length}-#{@type}")

    [start_leaves, end_leaves] = @_find_edge_leaves(horizontal)

    if horizontal
      start_variable = 'on-left-edge-align'
      end_variable = 'on-right-edge-align'
    else
      start_variable = 'on-top-edge-align'
      end_variable = 'on-bottom-edge-align'

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

  variables_updated: () ->
    for child in @get_layoutable_children()
      [left, top] = @_ensure_origin_variables(child)
      child.set('dom_left', left._value)
      child.set('dom_top', top._value)
      # TODO - Do we really need this?
      child.trigger('change')

    # hack to force re-render
    @trigger('change')
  
  get_edit_variables: () ->
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

module.exports =
  Model: Box
  View: BoxView
