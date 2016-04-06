_ = require "underscore"

p = require "../../core/properties"
LayoutBox = require "./layout_box"
BokehView = require "../../core/bokeh_view"
{EQ, GE, Strength, WEAK_EQ, WEAK_GE, Variable} = require "../../core/layout/solver"

class LayoutComponentView extends BokehView
  initialize: (options) ->
    super(options)
    @bind_bokeh_events()
    @render()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: @model._width._value
      height: @model._height._value
    })

class LayoutComponent extends LayoutBox.Model
  type: 'LayoutComponent'
  default_view: LayoutComponentView

  constructor: (attrs, options) ->
    super(attrs, options)
    @set('dom_left', 0)
    @set('dom_top', 0)
    @_width = new Variable()
    @_height = new Variable()
    # these are the COORDINATES of the four plot sides
    @_left = new Variable()
    @_right = new Variable()
    @_top = new Variable()
    @_bottom = new Variable()
    @_height_minus_bottom = new Variable()
    @_width_minus_right = new Variable()
    @_right_minus_left = new Variable()
    @_bottom_minus_top = new Variable()

  get_constraints: () ->
    constraints = []

    # Do the layout constraints

    # plot width and height are a function of plot sides...
    constraints.push(EQ([-1, @_right], @_left, @_right_minus_left))
    constraints.push(EQ([-1, @_bottom], @_top, @_bottom_minus_top))

    # min size, weak in case it doesn't fit
    constraints.push(WEAK_GE(@_right_minus_left, -10))
    constraints.push(WEAK_GE(@_bottom_minus_top, -10))

    # plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))

    # compute plot bottom/right indent
    constraints.push(EQ(@_height_minus_bottom, [-1, @_height], @_bottom))
    constraints.push(EQ(@_width_minus_right, [-1, @_width], @_right))

    return constraints

  get_constrained_variables: () ->
    {
      'width' : @_width,
      'height' : @_height
      # when this widget is on the edge of a box visually,
      # align these variables down that edge. Right/bottom
      # are an inset from the edge.
      'on-top-edge-align' : @_top
      'on-bottom-edge-align' : @_height_minus_bottom
      'on-left-edge-align' : @_left
      'on-right-edge-align' : @_width_minus_right
      # when this widget is in a box, make these the same distance
      # apart in every widget. Right/bottom are inset from the edge.
      #'box-equal-size-top' : @_top
      #'box-equal-size-bottom' : @_height_minus_bottom
      'box-equal-size-left' : @_left
      'box-equal-size-right' : @_width_minus_right
      # when this widget is in a box cell with the same "arity
      # path" as a widget in another cell, align these variables
      # between the two box cells. Right/bottom are an inset from
      # the edge.
      'box-cell-align-top' : @_top
      'box-cell-align-bottom' : @_height_minus_bottom
      'box-cell-align-left' : @_left
      'box-cell-align-right' : @_width_minus_right
    }

  set_dom_origin: (left, top) ->
    @set({ dom_left: left, dom_top: top })

  props: ->
    return _.extend {}, super(), {
      disabled: [ p.Bool, false ]
    }

  variables_updated: () ->
    @trigger('change')

module.exports =
  Model: LayoutComponent
  View: LayoutComponentView
