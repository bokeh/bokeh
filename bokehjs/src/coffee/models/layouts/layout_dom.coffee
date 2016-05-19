_ = require "underscore"
Model = require "../../model"
p = require "../../core/properties"
{GE, Variable}  = require "../../core/layout/solver"

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

  @define {
      height:   [ p.Number, null ]
      width:    [ p.Number, null ]
      disabled: [ p.Bool, false ]
    }

module.exports =
  Model: LayoutDOM
