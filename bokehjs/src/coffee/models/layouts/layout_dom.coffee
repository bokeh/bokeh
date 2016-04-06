_ = require "underscore"

p = require "../../core/properties"
BokehView = require "../../core/bokeh_view"
{EQ, GE, Variable} = require "../../core/layout/solver"
Model = require "../../model"

class LayoutDomView extends BokehView
  initialize: (options) ->
    super(options)
    @bind_bokeh_events()
    @render()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @render)
    @listenTo(@model.document.solver(), 'resize', @render)

  render: () ->
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: @model._width._value
      height: @model._height._value
    })

class LayoutDom extends Model
  type: 'LayoutDom'
  default_view: LayoutDomView

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
    # this is the DISTANCE FROM THE SIDE of the right and bottom,
    # since that isn't the same as the coordinate
    @_width_minus_right = new Variable()
    @_height_minus_bottom = new Variable()
    # these are the plot width and height, but written
    # as a function of the coordinates because we compute
    # them that way
    @_right_minus_left = new Variable()
    @_bottom_minus_top = new Variable()

  get_edit_variables: () ->
    editables = []
    return editables

  get_constraints: () ->
    constraints = []

    # plot width and height are a function of plot sides...
    constraints.push(EQ([-1, @_right], @_left, @_right_minus_left))
    constraints.push(EQ([-1, @_bottom], @_top, @_bottom_minus_top))

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
  Model: LayoutDom
  View: LayoutDomView
