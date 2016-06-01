_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

{Document} = utils.require("document")

Spacer = utils.require("models/layouts/spacer").Model

describe "WidgetBox.View", ->
  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()
    @spacer = new Spacer()
    @spacer.attach_document(new Document())

  it "render should set the appropriate positions and paddings on the element when it is mode box", ->
    @spacer.responsive = 'fixed'
    @spacer.width = 12
    @spacer.height = 22
    spacer_view = new @spacer.default_view({ model: @spacer })
    spacer_view.render()
    expected_style = "width: 12px; height: 22px;"
    expect(spacer_view.$el.attr('style')).to.be.equal expected_style

describe "Spacer.Model", ->

  beforeEach ->
    @spacer = new Spacer()
    @expected_constrained_variables = {
      'width': @spacer._width
      'height': @spacer._height
      'origin-x': @spacer._dom_left
      'origin-y': @spacer._dom_top
      'whitespace-top' : @spacer._whitespace_top
      'whitespace-bottom' : @spacer._whitespace_bottom
      'whitespace-left' : @spacer._whitespace_left
      'whitespace-right' : @spacer._whitespace_right
      'on-edge-align-top' : @spacer._top
      'on-edge-align-bottom' : @spacer._height_minus_bottom
      'on-edge-align-left' : @spacer._left
      'on-edge-align-right' : @spacer._width_minus_right
      'box-equal-size-top' : @spacer._top
      'box-equal-size-bottom' : @spacer._height_minus_bottom
      'box-equal-size-left' : @spacer._left
      'box-equal-size-right' : @spacer._width_minus_right
      'box-cell-align-top' : @spacer._top
      'box-cell-align-bottom' : @spacer._height_minus_bottom
      'box-cell-align-left' : @spacer._left
      'box-cell-align-right' : @spacer._width_minus_right
    }

  it "should return all constrained_variables in all modes", ->
    @spacer.responsive = 'box'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

  it "should return correct constrained_variables in width_scale mode", ->
    # We don't return height because we're going to set it ourselves.
    expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
    @spacer.responsive = 'width_scale'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables

  it "should return correct constrained_variables in height_scale mode", ->
    # We don't return width because we're going to set it ourselves.
    expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
    @spacer.responsive = 'height_scale'
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables

  it "should return correct constrained_variables in fixed mode", ->
    # We don't return height or width because we're going to set them ourselves.
    @spacer.responsive = 'fixed'
    expected_constrained_variables = _.omit(@expected_constrained_variables, ['height', 'width'])
    constrained_variables = @spacer.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrained_variables
