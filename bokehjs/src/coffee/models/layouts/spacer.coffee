_ = require "underscore"
p = require "../../core/properties"

{EQ, GE, WEAK_EQ} = require "../../core/layout/solver"
LayoutDom = require "../layouts/layout_dom"

class SpacerView extends LayoutDom.View
  className: "bk-spacer"

  render: () ->
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: @model._width._value - @model._whitespace_right._value - @model._whitespace_left._value
      height: @model._height._value - @model._whitespace_bottom._value - @model._whitespace_top._value
      'margin-left': @model._whitespace_left._value
      'margin-right': @model._whitespace_right._value
      'margin-top': @model._whitespace_top._value
      'margin-bottom': @model._whitespace_bottom._value
    })

class Spacer extends LayoutDom.Model
  type: "Spacer"
  default_view: SpacerView

  props: ->
    return _.extend {}, super(), {
      grow:     [ p.Bool, true]
    }

module.exports =
  Model: Spacer
  View: SpacerView
