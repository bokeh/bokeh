import {Model} from "../../model"
import {empty} from "core/dom"
import * as p from "core/properties"
import {Solver, GE, EQ, Strength, Variable} from "core/layout/solver"

import {build_views} from "core/build_views"
import {BokehView} from "core/bokeh_view"
import {logger} from "core/logging"
import {extend} from "core/util/object"

import {Layoutable, LayoutableView} from "./layoutable"

export class LayoutDOMView extends LayoutableView

  initialize: (options) ->
    super(options)

    # this is a root view
    if @is_root
      @_solver = new Solver()
      @_init_solver()

    # Provides a hook so document can measure
    @el.setAttribute("id", "modelid_#{@model.id}")
    @el.classList.add("bk-layout-#{@model.sizing_mode}")
    if @model.css_classes?
      for cls in @model.css_classes
        @el.classList.add(cls)

    # init_solver = false becuase we only need to init solver on subsequent children change.
    @child_views = {}
    @build_child_views()

    if @is_root
      @resize()

    @bind_bokeh_events()

  remove: () ->
    for _, view of @child_views
      view.remove()
    @child_views = {}

    # remove on_resize

    super()

  _reset_solver: () ->
    if not @is_root
      @parent._reset_solver()
    else
      @_solver.clear()
      @_init_solver()

  _init_solver: () ->
    @_doc_width = new Variable("document_width")
    @_doc_height = new Variable("document_height")

    @_solver.add_edit_variable(@_doc_width)
    @_solver.add_edit_variable(@_doc_height)

    editables = @model.get_edit_variables()
    constraints = @model.get_constraints()
    variables = @model.get_constrained_variables()

    for {edit_variable, strength} in editables
      @_solver.add_edit_variable(edit_variable, strength)

    for constraint in constraints
      @_solver.add_constraint(constraint)

    if variables.width?
      @_solver.add_constraint(EQ(variables.width, @_doc_width))
    if variables.height?
      @_solver.add_constraint(EQ(variables.height, @_doc_height))

    @_solver.update_variables()

  resize: (width=null, height=null) ->
    if not @is_root
      @parent.resize(width, height)
    else
      # Ideally the solver would settle in one pass (can that be done?),
      # but it currently needs two passes to get it right.
      # Seems to be needed everywhere on initialization, and on Windows
      # it seems necessary on each Draw
      @_resize(width, height)
      @_resize(width, height)

  _resize: (width=null, height=null) ->
    variables = @model.get_constrained_variables()

    if variables.width? or variables.height?
      if width == null or height=null
        measuring = @el

        while true
          measuring = measuring.parentNode
          if not measuring?
            throw new Error("detached element")

          {width, height} = measuring.getBoundingClientRect()
          if height != 0
            break

      if variables.width?
        @_solver.suggest_value(@_doc_width, width)
      if variables.height?
        @_solver.suggest_value(@_doc_height, height)

    @_solver.update_variables(false)
    @_solver.trigger('resize')

  rebuild_child_views: () ->
    # TODO (bird) Can't we put the call to invalidate_all_models in _init_solver
    # surely its document's problem to know how to init a solver. Also _init_solver
    # probably shouldn't be a private method if we're using it here.
    @model.document._invalidate_all_models()
    @_reset_solver()
    @build_child_views()

  build_child_views: () ->
    children = @model.get_layoutable_children()
    build_views(@child_views, children, {parent: @})

    empty(@el)

    for child in children
      # Look-up the child_view in @child_views and then append We can't just
      # read from @child_views because then we don't get guaranteed ordering.
      # Which is a problem in non-box layouts.
      child_view = @child_views[child.id]
      @el.appendChild(child_view.el)

  bind_bokeh_events: () ->
    if @is_root
      window.addEventListener("resize", () => @resize())

    @listenTo(@model, 'change', () => @render())

    if @model.sizing_mode == 'fixed'
      @listenToOnce(@solver, 'resize', () => @render())
    else
      @listenTo(@solver, 'resize', () => @render())

    # Note: `sizing_mode` update is not supported because changing the
    # sizing_mode mode necessitates stripping out all the relevant constraints
    # from solver and re-adding the new correct ones.  We don't currently have
    # a machinery for this. Other things with a similar problem are axes and
    # title.
    sizing_mode_msg = "Changing sizing_mode after initialization is not currently supported."
    @listenTo(@model, 'change:sizing_mode', () -> logger.warn(sizing_mode_msg))

  render: () ->
    #logger.debug("#{@model} _dom_left: #{@model._dom_left._value}, _dom_top: #{@model._dom_top._value}")
    #logger.debug("#{@model} _top: #{@model._top._value}, _right: #{@model._right._value}, _bottom: #{@model._bottom._value}, _left: #{@model._left._value}")
    #logger.debug("#{@model} _width: #{@model._width._value}, _height: #{@model._height._value}")
    #logger.debug("#{@model} _width_minus_right: #{@model._width_minus_right._value}, _height_minus_bottom: #{@model._height_minus_bottom._value}")

    switch @model.sizing_mode
      when 'fixed'
        # If the width or height is unset:
        # - compute it from children
        # - but then save for future use
        # (for some reason widget boxes keep shrinking if you keep computing
        # but this is more efficient and appropriate for fixed anyway).
        if @model.width?
          width = @model.width
        else
          width = @get_width()
          @model.width = width
        if @model.height?
          height = @model.height
        else
          height = @get_height()
          @model.height = height

        @solver.suggest_value(@model._width, width)
        @solver.suggest_value(@model._height, height)
        @solver.update_variables()
        @el.style.width = "#{width}px"
        @el.style.height = "#{height}px"

      when 'scale_width'
        height = @get_height()

        @solver.suggest_value(@model._height, height)
        @solver.update_variables()
        @el.style.width = "#{@model._width._value}px"
        @el.style.height = "#{@model._height._value}px"

      when 'scale_height'
        width = @get_width()

        @solver.suggest_value(@model._width, width)
        @solver.update_variables()
        @el.style.width = "#{@model._width._value}px"
        @el.style.height = "#{@model._height._value}px"

      when 'stretch_both'
        @el.style.position = 'absolute'
        @el.style.left = "#{@model._dom_left._value}px"
        @el.style.top = "#{@model._dom_top._value}px"
        @el.style.width = "#{@model._width._value}px"
        @el.style.height = "#{@model._height._value}px"

  get_height: () ->
    # Subclasses should implement this to explain
    # what their height should be in sizing_mode mode.
    return null

  get_width: () ->
    # Subclasses should implement this to explain
    # what their width should be in sizing_mode mode.
    return null



export class LayoutDOM extends Layoutable
  type: "LayoutDOM"

  initialize: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable("_width #{@id}")
    @_height = new Variable("_height #{@id}")
    # These are the COORDINATES of the four plot sides
    @_left = new Variable("_left #{@id}")
    @_right = new Variable("_right #{@id}")
    @_top = new Variable("_top #{@id}")
    @_bottom = new Variable("_bottom #{@id}")
    # This is the dom position
    @_dom_top = new Variable("_dom_top #{@id}")
    @_dom_left = new Variable("_dom_left #{@id}")
    # This is the distance from the side of the right and bottom,
    @_width_minus_right = new Variable("_width_minus_right #{@id}")
    @_height_minus_bottom = new Variable("_height_minus_bottom #{@id}")
    # Whitespace variables
    @_whitespace_top = new Variable()
    @_whitespace_bottom = new Variable()
    @_whitespace_left = new Variable()
    @_whitespace_right = new Variable()

  get_constraints: () ->
    return [
      # Make sure things dont squeeze out of their bounding box
      GE(@_dom_left),
      GE(@_dom_top),

      # Plot has to be inside the width/height
      GE(@_left),
      GE(@_width, [-1, @_right]),
      GE(@_top),
      GE(@_height, [-1, @_bottom]),

      ## Declare computed constraints
      EQ(@_width_minus_right, [-1, @_width], @_right),
      EQ(@_height_minus_bottom, [-1, @_height], @_bottom),
    ]

  get_layoutable_children: () -> []

  get_edit_variables: () ->
    edit_variables = []
    if @sizing_mode is 'fixed'
      edit_variables.push({edit_variable: @_height, strength: Strength.strong})
      edit_variables.push({edit_variable: @_width, strength: Strength.strong})
    if @sizing_mode is 'scale_width'
      edit_variables.push({edit_variable: @_height, strength: Strength.strong})
    if @sizing_mode is 'scale_height'
      edit_variables.push({edit_variable: @_width, strength: Strength.strong})
    return edit_variables

  get_constrained_variables: () ->
    # THE FOLLOWING ARE OPTIONAL VARS THAT
    # YOU COULD ADD INTO SUBCLASSES
    #
    #  # When this widget is on the edge of a box visually,
    #  # align these variables down that edge. Right/bottom
    #  # are an inset from the edge.
    #  'on-edge-align-top'    : @_top
    #  'on-edge-align-bottom' : @_height_minus_bottom
    #  'on-edge-align-left'   : @_left
    #  'on-edge-align-right'  : @_width_minus_right
    #  # When this widget is in a box cell with the same "arity
    #  # path" as a widget in another cell, align these variables
    #  # between the two box cells. Right/bottom are an inset from
    #  # the edge.
    #  'box-cell-align-top'   : @_top
    #  'box-cell-align-bottom': @_height_minus_bottom
    #  'box-cell-align-left'  : @_left
    #  'box-cell-align-right' : @_width_minus_right
    #  # When this widget is in a box, make these the same distance
    #  # apart in every widget. Right/bottom are inset from the edge.
    #  'box-equal-size-top'   : @_top
    #  'box-equal-size-bottom': @_height_minus_bottom
    #  'box-equal-size-left'  : @_left
    #  'box-equal-size-right' : @_width_minus_right

    constrained_variables = {
      'origin-x': @_dom_left
      'origin-y': @_dom_top
      'whitespace-top' : @_whitespace_top
      'whitespace-bottom' : @_whitespace_bottom
      'whitespace-left' : @_whitespace_left
      'whitespace-right' : @_whitespace_right
    }
    if @sizing_mode is 'stretch_both'
      constrained_variables = extend(constrained_variables, {
        'width': @_width
        'height': @_height
      })
    if @sizing_mode is 'scale_width'
      constrained_variables = extend(constrained_variables, {
        'width': @_width
      })
    if @sizing_mode is 'scale_height'
      constrained_variables = extend(constrained_variables, {
        'height': @_height
      })
    return constrained_variables

  @define {
      height:      [ p.Number              ]
      width:       [ p.Number              ]
      disabled:    [ p.Bool,       false   ]
      sizing_mode: [ p.SizingMode, "fixed" ]
      css_classes: [ p.Array               ]
    }
