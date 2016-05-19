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
    # these are the COORDINATES of the four plot sides
    @_left = new Variable("_left #{@id}")
    @_right = new Variable("_right #{@id}")
    @_top = new Variable("_top #{@id}")
    @_bottom = new Variable("_bottom #{@id}")
    # this is the dom position
    @_dom_top = new Variable("_dom_top #{@id}")
    @_dom_left = new Variable("_dom_left #{@id}")
    ## this is the DISTANCE FROM THE SIDE of the right and bottom,
    ## useful if that isn't the same as the coordinate (as happens in plot_canvas)  
    #@_width_minus_left = new Variable("_width_minus_left #{@id}")
    #@_width_minus_right = new Variable("_width_minus_right #{@id}")
    #@_height_minus_bottom = new Variable("_height_minus_bottom #{@id}")
    ## these are the plot width and height, but written
    ## as a function of the coordinates because we compute
    ## them that way
    #@_right_minus_left = new Variable("_right_minus_left #{@id}")
    #@_bottom_minus_top = new Variable("_bottom_minus_top #{@id}")

  get_constraints: () ->
    constraints = []

    # Dom position should always be greater than 0
    constraints.push(GE(@_dom_left))
    constraints.push(GE(@_dom_top))
    
    # Plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))

    # Declare computed constraints
    #constraints.push(EQ(@_height_minus_bottom, [-1, @_height], @_bottom))
    #constraints.push(EQ(@_width_minus_left, [-1, @_width], @_left))
    #constraints.push(EQ(@_width_minus_right, [-1, @_width], @_right))
    #constraints.push(EQ(@_right_minus_left, [-1, @_right], @_left))
    #constraints.push(EQ(@_bottom_minus_top, [-1, @_bottom], @_top))

    return constraints

  @define {
      height:   [ p.Number, null ]
      width:    [ p.Number, null ]
      disabled: [ p.Bool, false ]
    }

module.exports =
  Model: LayoutDOM
