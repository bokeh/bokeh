import {Model} from "../../model"
import {empty} from "core/dom"
import * as p from "core/properties"
import {LayoutCanvas} from "core/layout/layout_canvas"
import {Solver, GE, EQ, Strength, Variable} from "core/layout/solver"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {logger} from "core/logging"
import {extend} from "core/util/object"

export class LayoutDOMView extends DOMView

  initialize: (options) ->
    super(options)

    # this is a root view
    if @is_root
      @_solver = new Solver()

    @child_views = {}
    @build_child_views()

    @connect_signals()

  remove: () ->
    for _, view of @child_views
      view.remove()
    @child_views = {}

    # remove on_resize

    super()

  has_finished: () ->
    if not super()
      return false

    for _, child of @child_views
      if not child.has_finished()
        return false

    return true

  notify_finished: () ->
    if not @is_root
      super()
    else
      if not @_idle_notified and @has_finished()
        if @model.document?
          @_idle_notified = true
          @model.document.notify_idle(@model)

  _calc_width_height: () ->
    measuring = @el

    while true
      measuring = measuring.parentNode
      if not measuring?
        logger.warn("detached element")
        width = height = null
        break

      {width, height} = measuring.getBoundingClientRect()
      if height != 0
        break

    return [width, height]

  _init_solver: () ->
    @_root_width = new Variable("#{@toString()}.root_width")
    @_root_height = new Variable("#{@toString()}.root_height")

    # XXX: this relies on the fact that missing `strength` argument results
    # in strength being NaN, which behaves like `Strength.required`. However,
    # this is banned by the API.
    @_solver.add_edit_variable(@_root_width)
    @_solver.add_edit_variable(@_root_height)

    editables = @model.get_all_editables()
    for edit_variable in editables
      @_solver.add_edit_variable(edit_variable, Strength.strong)

    constraints = @model.get_all_constraints()
    for constraint in constraints
      @_solver.add_constraint(constraint)

    variables = @model.get_constrained_variables()
    if variables.width?
      @_solver.add_constraint(EQ(variables.width, @_root_width))
    if variables.height?
      @_solver.add_constraint(EQ(variables.height, @_root_height))

    @_solver.update_variables()

  _suggest_dims: (width, height) ->
    variables = @model.get_constrained_variables()

    if variables.width? or variables.height?
      if width == null or height == null
        [width, height] = @_calc_width_height()

      if variables.width? and width?
        @_solver.suggest_value(@_root_width, width)
      if variables.height? and height?
        @_solver.suggest_value(@_root_height, height)

      @_solver.update_variables()

  resize: (width=null, height=null) ->
    if not @is_root
      @root.resize(width, height)
    else
      @_do_layout(false, width, height)

  layout: (full=true) ->
    if not @is_root
      @root.layout(full)
    else
      @_do_layout(full)

  _do_layout: (full, width=null, height=null) ->
    if full
      @_solver.clear()
      @_init_solver()

    @_suggest_dims(width, height)

    # XXX: do layout twice, because there are interdependencies between views,
    # which currently cannot be resolved with one pass. The third one triggers
    # rendering and (expensive) painting.
    @_layout()     # layout (1)
    @_layout()     # layout (2)
    @_layout(true) # render & paint

    @notify_finished()

  _layout: (final=false) ->
    for child in @model.get_layoutable_children()
      child_view = @child_views[child.id]
      if child_view._layout?
        child_view._layout(final)

    @render()

    if final
      @_has_finished = true

  rebuild_child_views: () ->
    @solver.clear()
    @build_child_views()
    @layout()

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

  connect_signals: () ->
    super()

    if @is_root
      window.addEventListener("resize", () => @resize())

    # XXX: @connect(@model.change, () => @layout())
    @connect(@model.properties.sizing_mode.change, () => @layout())

  _render_classes: () ->
    @el.className = "" # removes all classes

    if @className?
      @el.classList.add(@className)

    if @model.sizing_mode? # XXX: because toolbar uses null
      @el.classList.add("bk-layout-#{@model.sizing_mode}")

    if @model.css_classes?
      for cls in @model.css_classes
        @el.classList.add(cls)

  render: () ->
    @_render_classes()

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
          @model.setv({width: width}, {silent: true})

        if @model.height?
          height = @model.height
        else
          height = @get_height()
          @model.setv({height: height}, {silent: true})

        @solver.suggest_value(@model._width, width)
        @solver.suggest_value(@model._height, height)
        @solver.update_variables()

        @el.style.position = "relative"
        @el.style.left = ""
        @el.style.top = ""
        @el.style.width = "#{width}px"
        @el.style.height = "#{height}px"

      when 'scale_width'
        height = @get_height()

        @solver.suggest_value(@model._height, height)
        @solver.update_variables()

        @el.style.position = "relative"
        @el.style.left = ""
        @el.style.top = ""
        @el.style.width = "#{@model._width.value}px"
        @el.style.height = "#{@model._height.value}px"

      when 'scale_height'
        width = @get_width()

        @solver.suggest_value(@model._width, width)
        @solver.update_variables()

        @el.style.position = "relative"
        @el.style.left = ""
        @el.style.top = ""
        @el.style.width = "#{@model._width.value}px"
        @el.style.height = "#{@model._height.value}px"

      when 'stretch_both'
        @el.style.position = "absolute"
        @el.style.left = "#{@model._dom_left.value}px"
        @el.style.top = "#{@model._dom_top.value}px"
        @el.style.width = "#{@model._width.value}px"
        @el.style.height = "#{@model._height.value}px"

  get_height: () ->
    # Subclasses should implement this to explain
    # what their height should be in sizing_mode mode.
    return null

  get_width: () ->
    # Subclasses should implement this to explain
    # what their width should be in sizing_mode mode.
    return null

export class LayoutDOM extends Model
  type: "LayoutDOM"

  initialize: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable("#{@toString()}.width")
    @_height = new Variable("#{@toString()}.height")
    # These are the COORDINATES of the four plot sides
    @_left = new Variable("#{@toString()}.left")
    @_right = new Variable("#{@toString()}.right")
    @_top = new Variable("#{@toString()}.top")
    @_bottom = new Variable("#{@toString()}.bottom")
    # This is the dom position
    @_dom_top = new Variable("#{@toString()}.dom_top")
    @_dom_left = new Variable("#{@toString()}.dom_left")
    # This is the distance from the side of the right and bottom,
    @_width_minus_right = new Variable("#{@toString()}.width_minus_right")
    @_height_minus_bottom = new Variable("#{@toString()}.height_minus_bottom")
    # Whitespace variables
    @_whitespace_top = new Variable("#{@toString()}.whitespace_top")
    @_whitespace_bottom = new Variable("#{@toString()}.whitespace_bottom")
    @_whitespace_left = new Variable("#{@toString()}.whitespace_left")
    @_whitespace_right = new Variable("#{@toString()}.whitespace_right")

  @getters {
    layout_bbox: () ->
      return {
        top: @_top.value,
        left: @_left.value,
        width: @_width.value,
        height: @_height.value,
        right: @_right.value,
        bottom: @_bottom.value,
        dom_top: @_dom_top.value,
        dom_left: @_dom_left.value,
      }
  }

  dump_layout: () ->
    console.log(this.toString(), @layout_bbox)

    for child in @get_layoutable_children()
      child.dump_layout()

  get_all_constraints: () ->
    constraints = @get_constraints()

    for child in @get_layoutable_children()
      if child instanceof LayoutCanvas
        constraints = constraints.concat(child.get_constraints())
      else
        constraints = constraints.concat(child.get_all_constraints())

    return constraints

  get_all_editables: () ->
    editables = @get_editables()

    for child in @get_layoutable_children()
      if child instanceof LayoutCanvas
        editables = editables.concat(child.get_editables())
      else
        editables = editables.concat(child.get_all_editables())

    return editables

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

  get_editables: () ->
    switch @sizing_mode
      when 'fixed'
        return [@_height, @_width]
      when 'scale_width'
        return [@_height]
      when 'scale_height'
        return [@_width]
      else
        return []

  get_constrained_variables: () ->
    # THE FOLLOWING ARE OPTIONAL VARS THAT
    # YOU COULD ADD INTO SUBCLASSES
    #
    #  # When this widget is on the edge of a box visually,
    #  # align these variables down that edge. Right/bottom
    #  # are an inset from the edge.
    #  on_edge_align_top    : @_top
    #  on_edge_align_bottom : @_height_minus_bottom
    #  on_edge_align_left   : @_left
    #  on_edge_align_right  : @_width_minus_right
    #  # When this widget is in a box cell with the same "arity
    #  # path" as a widget in another cell, align these variables
    #  # between the two box cells. Right/bottom are an inset from
    #  # the edge.
    #  box_cell_align_top   : @_top
    #  box_cell_align_bottom: @_height_minus_bottom
    #  box_cell_align_left  : @_left
    #  box_cell_align_right : @_width_minus_right
    #  # When this widget is in a box, make these the same distance
    #  # apart in every widget. Right/bottom are inset from the edge.
    #  box_equal_size_top   : @_top
    #  box_equal_size_bottom: @_height_minus_bottom
    #  box_equal_size_left  : @_left
    #  box_equal_size_right : @_width_minus_right

    vars = {
      origin_x          : @_dom_left
      origin_y          : @_dom_top
      whitespace_top    : @_whitespace_top
      whitespace_bottom : @_whitespace_bottom
      whitespace_left   : @_whitespace_left
      whitespace_right  : @_whitespace_right
    }

    switch @sizing_mode
      when 'stretch_both'
        vars.width  = @_width
        vars.height = @_height
      when 'scale_width'
        vars.width  = @_width
      when 'scale_height'
        vars.height = @_height

    return vars

  @define {
      height:      [ p.Number              ]
      width:       [ p.Number              ]
      disabled:    [ p.Bool,       false   ]
      sizing_mode: [ p.SizingMode, "fixed" ]
      css_classes: [ p.Array               ]
    }
