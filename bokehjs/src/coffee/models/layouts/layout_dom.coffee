_ = require "underscore"
Model = require "../../model"
p = require "../../core/properties"
{GE, EQ, Variable}  = require "../../core/layout/solver"

class LayoutDOM extends Model
  type: "LayoutDOM"

  constructor: (attrs, options) ->
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
    # Add our whitespace variables
    @_whitespace_top = new Variable()
    @_whitespace_bottom = new Variable()
    @_whitespace_left = new Variable()
    @_whitespace_right = new Variable()

  get_constraints: () ->
    constraints = []

    # Plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))

    ## Declare computed constraints
    constraints.push(EQ(@_width_minus_right, [-1, @_width], @_right))
    constraints.push(EQ(@_height_minus_bottom, [-1, @_height], @_bottom))
      
    return constraints

  get_constrained_variables: () ->
    {
      'width': @_width
      'height': @_height
      'whitespace-top' : @_whitespace_top
      'whitespace-bottom' : @_whitespace_bottom
      'whitespace-left' : @_whitespace_left
      'whitespace-right' : @_whitespace_right
      'origin-x': @_dom_left
      'origin-y': @_dom_top
      # THE ABOVE ARE REQUIRED FOR A LAYOUTABLE OBJECT
      # THE BELOW IS A GUIDE OF OPTIONAL VARS THAT SHOULD BE ADDED INTO SUBCLASSES
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
    }

  @define {
      height:   [ p.Number, null ]
      width:    [ p.Number, null ]
      disabled: [ p.Bool, false ]
    }

module.exports =
  Model: LayoutDOM
