_ = require "underscore"
p = require "../../core/properties"
BokehView = require "../../core/bokeh_view"
LayoutBox = require "../canvas/layout_box"
Model = require "../../model"


class BoxView extends BokehView
  className: "bk-grid"

  initialize: (options) ->
    super(options)
    @_created_child_views = false
    @listenTo(@model, 'change', @render)
    @render()

  render: () ->
    # TODO See if the children list has changed
    if not @_created_child_views
      children = @model.get_layoutable_children()
      for child in children
        child_view = new child.default_view({ model: child })
        child_view.render()
        @$el.append(child_view.$el)
      @_created_child_views = true

    @$el.css({
      position: 'absolute',
      left: @mget('dom_left'),
      top: @mget('dom_top'),
      width: @model._width._value,
      height: @model._height._value
    })

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

  variables_updated: () ->
    for child in @get_layoutable_children()
      [left, top] = @_ensure_origin_variables(child)
      child.set_dom_origin(left._value, top._value)

    @document.solver.trigger('layout_update')

module.exports =
  View: BoxView
  Model: Box
