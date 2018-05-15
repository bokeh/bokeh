{expect} = require "chai"

{clone} = require("core/util/object")
{Document} = require("document")
{Spacer} = require("models/layouts/spacer")

describe "WidgetBoxView", ->

  beforeEach ->
    @spacer = new Spacer()
    @spacer.attach_document(new Document())

  ###
  it "render should set the appropriate positions and paddings on the element when it is mode box", ->
    @spacer.sizing_mode = 'fixed'
    @spacer.width = 12
    @spacer.height = 22
    spacer_view = new @spacer.default_view({ model: @spacer, parent: null })
    spacer_view.render()
    expected_style = "position: relative; width: 12px; height: 22px;"
    expect(spacer_view.el.style.cssText).to.be.equal expected_style
  ###

describe "Spacer", ->

  beforeEach ->
    @spacer = new Spacer()
    @expected_constrained_variables = {
      width: @spacer._width
      height: @spacer._height
      origin_x: @spacer._dom_left
      origin_y: @spacer._dom_top
      whitespace_top : @spacer._whitespace_top
      whitespace_bottom : @spacer._whitespace_bottom
      whitespace_left : @spacer._whitespace_left
      whitespace_right : @spacer._whitespace_right
      on_edge_align_top : @spacer._top
      on_edge_align_bottom : @spacer._height_minus_bottom
      on_edge_align_left : @spacer._left
      on_edge_align_right : @spacer._width_minus_right
      box_equal_size_top : @spacer._top
      box_equal_size_bottom : @spacer._height_minus_bottom
      box_equal_size_left : @spacer._left
      box_equal_size_right : @spacer._width_minus_right
      box_cell_align_top : @spacer._top
      box_cell_align_bottom : @spacer._height_minus_bottom
      box_cell_align_left : @spacer._left
      box_cell_align_right : @spacer._width_minus_right
    }

  it "should return all constrained_variables in all modes", ->
    @spacer.sizing_mode = 'stretch_both'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

  it "should return correct constrained_variables in scale_width mode", ->
    # We don't return height because we're going to set it ourselves.
    expected_constrained_variables = clone(@expected_constrained_variables)
    delete expected_constrained_variables.height
    @spacer.sizing_mode = 'scale_width'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables

  it "should return correct constrained_variables in scale_height mode", ->
    # We don't return width because we're going to set it ourselves.
    expected_constrained_variables = clone(@expected_constrained_variables)
    delete expected_constrained_variables.width
    @spacer.sizing_mode = 'scale_height'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables

  it "should return correct constrained_variables in fixed mode", ->
    # We don't return height or width because we're going to set them ourselves.
    @spacer.sizing_mode = 'fixed'
    expected_constrained_variables = clone(@expected_constrained_variables)
    delete expected_constrained_variables.height
    delete expected_constrained_variables.width
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables
