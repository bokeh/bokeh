_ = require "underscore"
$ = require "jquery"
p = require "../../core/properties"
BokehView = require "../../core/bokeh_view"
LayoutBox = require "../canvas/layout_box"
Model = require "../../model"
{Variable, EQ, GE, Strength}  = require "../../core/layout/solver"


class BoxView extends BokehView
  className: "bk-grid"

  initialize: (options) ->
    super(options)

    @dom_left = 0
    @dom_top = 0

    children = @model.get_layoutable_children()
    @child_views = []
    for child in children
      child_view = new child.default_view({ model: child })
      child_view.render()
      @child_views.push(child_view)
      @$el.append(child_view.$el)
    @bind_bokeh_events()
    @render()

  get_layoutable_children: () ->
    @child_views

  bind_bokeh_events: () ->
    $(window).on("resize", $.proxy(@resize, @))
    @listenTo(@document.solver(), 'dom_update', @render)

  resize: () ->
    console.log('resize')
    @variables_updated()

  render: () ->
    @$el.css({
      position: 'absolute',
      left: @dom_left,
      top: @dom_top,
      width: @model._width._value,
      height: @model._height._value
    })

  variables_updated: () ->
    for child_view in @child_views
      [left, top] = @_ensure_origin_variables(child_view)
      child_view.set_dom_origin(left._value, top._value)

    @document.solver().trigger('layout_update')

  _ensure_origin_variables: (child) ->
    if '__Box_x' not of child
      child['__Box_x'] = new Variable('child_origin_x')
    if '__Box_y' not of child
      child['__Box_y'] = new Variable('child_origin_y')
    return [child['__Box_x'], child['__Box_y']]

class Box extends LayoutBox.Model
  default_view: BoxView

  get_layoutable_children: () ->
    @get('children')
  
  get_edit_variables: () ->
    edit_variables = []
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = []
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints


module.exports =
  View: BoxView
  Model: Box
