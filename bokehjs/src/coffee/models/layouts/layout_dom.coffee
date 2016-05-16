{EQ, GE, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

Model = require "../../model"


class LayoutDOM extends Model
  type: "LayoutDOM"

  constructor: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable("_width #{@id}")
    @_height = new Variable("_height #{@id}")
    # these are the COORDINATES of the four plot sides
    @_left = new Variable("_left #{@id}")
    @_right = new Variable("_right #{@id}")
    @_top = new Variable("_top #{@id}")
    @_bottom = new Variable("_bottom #{@id}")
    # this is the DISTANCE FROM THE SIDE of the right and bottom,
    # since that isn't the same as the coordinate
    @_width_minus_right = new Variable("_width_minus_right #{@id}")
    @_height_minus_bottom = new Variable("_height_minus_bottom #{@id}")
    # these are the plot width and height, but written
    # as a function of the coordinates because we compute
    # them that way
    @_right_minus_left = new Variable("_right_minus_left #{@id}")
    @_bottom_minus_top = new Variable("_bottom_minus_top #{@id}")
    # these are passed up to our parent after basing
    # them on the child whitespace
    @_whitespace_top = new Variable("_whitespace_top #{@id}")
    @_whitespace_bottom = new Variable("_whitespace_bottom #{@id}")
    @_whitespace_left = new Variable("_whitespace_left #{@id}")
    @_whitespace_right = new Variable("_whitespace_right #{@id}")

  get_constraints: () ->
    constraints = []
    # Plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))

    # Add constraints for calculated variables
    constraints.push(EQ(@_height_minus_bottom, [-1, @_height], @_bottom))
    constraints.push(EQ(@_width_minus_right, [-1, @_width], @_right))
    
    if @responsive == 'box'
      # Whitespace has to be positive
      constraints.push(GE(@_whitespace_left))
      constraints.push(GE(@_whitespace_right))
      constraints.push(GE(@_whitespace_top))
      constraints.push(GE(@_whitespace_bottom))

      # plot sides align with the sum of the stuff outside the plot
      constraints.push(EQ(@_whitespace_left, [-1, @_left]))
      constraints.push(EQ(@_right, @_whitespace_right, [-1, @_width]))
      constraints.push(EQ(@_whitespace_top, [-1, @_top]))
      constraints.push(EQ(@_bottom, @_whitespace_bottom, [-1, @_height]))

    return constraints

  get_constrained_variables: () ->
    {
      'width': @_width
      'height': @_height
      # when this widget is on the edge of a box visually,
      # align these variables down that edge. Right/bottom
      # are an inset from the edge.
      'on-top-edge-align' : @_top
      'on-bottom-edge-align' : @_height_minus_bottom
      'on-left-edge-align' : @_left
      'on-right-edge-align' : @_width_minus_right
      # when this widget is in a box, make these the same distance
      # apart in every widget. Right/bottom are inset from the edge.
      'box-equal-size-top' : @_top
      'box-equal-size-bottom' : @_height_minus_bottom
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
      # insets from the edge that are whitespace (contain no pixels),
      # this is used for spacing within a box.
      'whitespace-top' : @_whitespace_top
      'whitespace-bottom' : @_whitespace_bottom
      'whitespace-left' : @_whitespace_left
      'whitespace-right' : @_whitespace_right
    }

  @define {
    height:   [ p.Number, null ]
    width:    [ p.Number, null ]
    disabled: [ p.Bool, false  ]
    responsive: [ p.Responsive, 'width' ]
    grow:     [ p.Bool, true ]
  }

  @internal {
    dom_left: [ p.Number, 0 ]
    dom_top:  [ p.Number, 0 ]
  }

module.exports =
  Model: LayoutDOM
