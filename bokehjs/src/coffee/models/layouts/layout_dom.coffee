BokehView = require "../../core/bokeh_view"
{GE, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

Model = require "../../model"


class LayoutDOMView extends BokehView

  render: () ->
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: @model._width._value
      height: @model._height._value
    })


class LayoutDOM extends Model
  type: "LayoutDOM"

  constructor: (attrs, options) ->
    super(attrs, options)
    @_width = new Variable("_width")
    @_height = new Variable("_height")
    # these are the COORDINATES of the four plot sides
    @_left = new Variable()
    @_right = new Variable()
    @_top = new Variable()
    @_bottom = new Variable()

  get_constraints: () ->
    constraints = []
    # plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))
    return constraints

  @define {
    height:   [ p.Number, null ]
    width:    [ p.Number, null ]
    disabled: [ p.Bool, false  ]
  }

  @internal {
    dom_left: [ p.Number, 0 ]
    dom_top:  [ p.Number, 0 ]
  }

module.exports =
  Model: LayoutDOM
  View: LayoutDOMView
