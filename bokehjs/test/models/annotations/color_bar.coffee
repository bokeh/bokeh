{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'
proxyquire = require "proxyquire"

SidePanel = utils.require("core/layout/side_panel").Model
LinearColorMapper = utils.require("models/mappers/linear_color_mapper").Model
{Viridis} = utils.require("palettes/palettes")
Plot = utils.require("models/plots/plot").Model
Range1d = utils.require("models/ranges/range1d").Model
{Document} = utils.require "document"

###
(LC) sinon doesn't appear to stub functions (vs object methods). This
work-around using proxyrequire does some `require` hackery to stub the
`text` module imported by `models/annotations/color_bar` so that
text.get_text_height can be stubbed.
###
textStub = {}
ColorBar = proxyquire('../../../src/coffee/models/annotations/color_bar',
                      {"../../core/util/text": textStub})


describe "ColorBar.Model", ->

  afterEach ->
    textStub.get_text_height.restore()

  beforeEach ->
    stub = sinon.stub(textStub, 'get_text_height')
    stub.returns({'height': 15, 'ascent': 10, 'descent': 5})

  describe "ColorBar.Model._title_height method", ->

    it "_title_height should return 0 if there is no title", ->
      bar = new ColorBar.Model()
      title_height = bar._title_height()
      expect(title_height).to.be.equal(0)

    it "_title_height should calculate title height plus title_standoff if there is a title", ->
      bar = new ColorBar.Model({title: "I'm a Title", title_standoff: 5})
      title_height = bar._title_height()
      expect(title_height).to.be.equal(20)

  describe "ColorBar.Model._computed_image_dimensions method", ->

    beforeEach ->
      @plot = new Plot({
        x_range: new Range1d({start: 0, end: 1})
        y_range: new Range1d({start: 0, end: 1})
        height: 500
        width: 500
      })

    describe "ColorBar.orientation = 'vertical'", ->

      beforeEach ->
        @color_bar = new ColorBar.Model({
          orientation: 'vertical'
          # legend_width: 'auto'
          # legend_height: 'auto'
        })

      it "Should use set `legend_width` and `legend_height` if set", ->
        @plot.add_layout(@color_bar)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
        @color_bar.legend_width = 100
        @color_bar.legend_height = 100

        image_dimensions = @color_bar._computed_image_dimensions()
        expect(image_dimensions.width).to.be.equal(100)
        expect(image_dimensions.height).to.be.equal(100)

      it "Should return height = 0.30 * plot.height for 'short' palette", ->
        @plot.add_layout(@color_bar)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})

        image_dimensions = @color_bar._computed_image_dimensions()
        expect(image_dimensions.width).to.be.equal(25)
        expect(image_dimensions.height).to.be.equal(150)

      it "Should return height = palette.length * 25 or 'medium' palette", ->
        @plot.add_layout(@color_bar)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})

        image_dimensions = @color_bar._computed_image_dimensions()
        expect(image_dimensions.width).to.be.equal(25)
        expect(image_dimensions.height).to.be.equal(250)

      it "Should return height = 0.80 * plot.height for 'long' palette", ->
        @plot.add_layout(@color_bar)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256})

        image_dimensions = @color_bar._computed_image_dimensions()
        expect(image_dimensions.width).to.be.equal(25)
        expect(image_dimensions.height).to.be.equal(380)

      it "Should return height = plot.height - 2 * legend_padding for any palette in side panel", ->
        @plot.add_layout(@color_bar, 'right')
        document = new Document()
        document.add_root(@plot)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})

        image_dimensions = @color_bar._computed_image_dimensions()
        expect(image_dimensions.width).to.be.equal(25)
        # height = 500 (plot.height) - 2 * 10 (color_bar.legend_padding) - 0 (title_height)
        expect(image_dimensions.height).to.be.equal(480)

        @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256})
        @color_bar.title = "I'm a title"
        expect(image_dimensions.width).to.be.equal(25)
        # height = 500 (plot.height) - 2 * 10 (color_bar.legend_padding) - 0 (title_height)
        expect(image_dimensions.height).to.be.equal(480)

  #   describe "ColorBar.orientation = 'horizontal'", ->
  #
  #     beforeEach ->
  #       @color_bar = new ColorBar({
  #         orientation: 'horizontal'
  #         # legend_width: 'auto'
  #         # legend_height: 'auto'
  #       })
  #
  #     it "should use set `legend_width` and `legend_height` if set", ->
  #       @plot.add_layout(@color_bar)
  #       # document = new Document()
  #       # document.add_root(@plot)
  #
  #       @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
  #       @color_bar.legend_width = 100
  #       @color_bar.legend_height = 100
  #
  #       image_dimensions = @color_bar._computed_image_dimensions()
  #       expect(image_dimensions.width).to.be.equal(100)
  #       expect(image_dimensions.height).to.be.equal(100)
  #
  #     it "short palette in frame should be 0.30 * plot width", ->
  #       @plot.add_layout(@color_bar)
  #
  #       @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
  #
  #       image_dimensions = @color_bar._computed_image_dimensions()
  #       expect(image_dimensions.width).to.be.equal(150)
  #       expect(image_dimensions.height).to.be.equal(25)
  #
  #     it "long palette in frame should be 25 * palette.length", ->
  #       @plot.add_layout(@color_bar)
  #
  #       @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})
  #
  #       image_dimensions = @color_bar._computed_image_dimensions()
  #       expect(image_dimensions.width).to.be.equal(250)
  #       expect(image_dimensions.height).to.be.equal(25)
  #
  #     it "super long palette in frame should be 0.8 * plot height", ->
  #       @plot.add_layout(@color_bar)
  #
  #       @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256})
  #
  #       image_dimensions = @color_bar._computed_image_dimensions()
  #       # width = 500 (plot.width) * 0.8 - 2 * 10 (color_bar.legend_padding)
  #       expect(image_dimensions.width).to.be.equal(380)
  #       expect(image_dimensions.height).to.be.equal(25)
  #
  #     it "long palette in side panel should be 25 * palette.length", ->
  #        # Add to right side panel
  #       @plot.add_layout(@color_bar, 'below')
  #       document = new Document()
  #       document.add_root(@plot)
  #
  #       @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})
  #
  #       image_dimensions = @color_bar._computed_image_dimensions()
  #       # width = 500 (plot.width) - 2 * 10 (color_bar.legend_padding)
  #       expect(image_dimensions.width).to.be.equal(480)
  #       expect(image_dimensions.height).to.be.equal(25)
