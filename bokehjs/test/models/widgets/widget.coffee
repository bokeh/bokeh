{expect} = require "chai"
utils = require "../../utils"

Widget = utils.require("models/widgets/widget").Model
WidgetView = utils.require("models/widgets/widget").View


describe "Widget.View render", ->
  it "should set the appropriate positions and margins on the element", ->
    #@$el.css({
    #  position: 'absolute'
    #  left: @mget('dom_left')
    #  top: @mget('dom_top')
    #  width: @model._width._value - @model._whitespace_right._value - @model._whitespace_left._value
    #  height: @model._height._value - @model._whitespace_bottom._value - @model._whitespace_top._value
    #  'margin-left': @model._whitespace_left._value
    #  'margin-right': @model._whitespace_right._value
    #  'margin-top': @model._whitespace_top._value
    #  'margin-bottom': @model._whitespace_bottom._value
    #})
    widget = new Widget()
    dom_left = 12
    dom_top = 13
    width = 100
    height = 100
    wl = 5
    wr = 10
    wt = 22
    wb = 33
    widget.set('dom_left', dom_left)
    widget.set('dom_top', dom_top)
    widget._width = {_value: width}
    widget._height = {_value: height}
    widget._whitespace_left = {_value: wl}
    widget._whitespace_right = {_value: wr}
    widget._whitespace_top = {_value: wt}
    widget._whitespace_bottom = {_value: wb}

    widget_view = new widget.default_view({ model: widget })
    expect(widget_view.$el.attr('style')).to.be.undefined
    widget_view.render()
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width - wl - wr}px; height: #{height - wt - wb}px; margin: #{wt}px #{wr}px #{wb}px #{wl}px;"
    expect(widget_view.$el.attr('style')).to.be.equal expected_style
