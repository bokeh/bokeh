{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'
proxyquire = require "proxyquire"

SidePanel = utils.require("core/layout/side_panel").Model
LinearColorMapper = utils.require("models/mappers/linear_color_mapper").Model
LinearMapper = utils.require("models/mappers/linear_mapper").Model
LogColorMapper = utils.require("models/mappers/log_color_mapper").Model
LogMapper = utils.require("models/mappers/log_mapper").Model
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
    @color_bar = new ColorBar.Model()

    stub = sinon.stub(textStub, 'get_text_height')
    stub.returns({'height': 15, 'ascent': 10, 'descent': 5})

  describe "ColorBar.Model._title_extent method", ->

    it "_title_height should return 0 if there is no title", ->
      title_height = @color_bar._title_extent()
      expect(title_height).to.be.equal(0)

    it "_title_height should calculate title height plus title_standoff if there is a title", ->
      @color_bar.title = "I'm a title"
      @color_bar.title_standoff = 5
      title_height = @color_bar._title_extent()
      expect(title_height).to.be.equal(20)

  describe "ColorBar.Model._tick_coordinate_mapper method", ->

    it "LinearColorMapper should yield LinearMapper instance with correct state", ->
      @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
      mapper = @color_bar._tick_coordinate_mapper(100) #length of scale dimension
      expect(mapper).to.be.instanceof(LinearMapper)
      expect(mapper.get('mapper_state')).to.be.deep.equal [10, 0]

    it "LogColorMapper should yield LogMapper instance with correct state", ->
      @color_bar.color_mapper = new LogColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
      mapper = @color_bar._tick_coordinate_mapper(100) #length of scale dimension
      expect(mapper).to.be.instanceof(LogMapper)
      expect(mapper.get('mapper_state')).to.be.deep.equal [100, 0, 2.302585092994046, 0]

# describe "ColorBar.Model", ->
#
#   afterEach ->
#     utils.unstub_canvas()
#     utils.unstub_solver()
#
#   beforeEach ->
#     utils.stub_canvas()
#     solver_stubs = utils.stub_solver()
#
#     doc = new Document()
#     ticker = new BasicTicker()
#     formatter = new BasicTickFormatter()
#     @axis = new Axis({
#       major_label_standoff: 11
#       major_tick_out: 12
#       ticker: ticker
#       formatter: formatter
#     })
#     plot = new Plot({
#       x_range: new Range1d({start: 0, end: 1})
#       y_range: new Range1d({start: 0, end: 1})
#       toolbar: new Toolbar()
#     })
#     plot.add_layout(@axis, 'below')
#     doc.add_root(plot)
#     plot_canvas_view = new plot.plot_canvas.default_view({ 'model': plot.plot_canvas })
#     sinon.stub(plot_canvas_view, 'update_constraints')
#     @axis_view = new @axis.default_view({
#       model: @axis
#       plot_model: plot.plot_canvas
#       plot_view: plot_canvas_view
#     })

  # describe "ColorBar.Model._computed_image_dimensions method", ->
  #
  #   beforeEach ->
  #     @plot = new Plot({
  #       x_range: new Range1d({start: 0, end: 1})
  #       y_range: new Range1d({start: 0, end: 1})
  #       # height: 500
  #       # width: 500
  #     })

    # describe "ColorBar.orientation = 'vertical'", ->
    #
    #   beforeEach ->
    #     @color_bar = new ColorBar.Model({
    #       orientation: 'vertical'
    #     })
    #
    #   it "Should use set `legend_width` and `legend_height` if set", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis3})
    #     @color_bar.legend_width = 100
    #     @color_bar.legend_height = 200
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(100)
    #     expect(image_dimensions.height).to.be.equal(200)
    #
    #   it "Should return height = 0.30 * plot.height for 'short' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis3})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(25)
    #     expect(image_dimensions.height).to.be.equal(150)
    #
    #   it "Should return height = palette.length * 25 for 'medium' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis10})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(25)
    #     expect(image_dimensions.height).to.be.equal(250)
    #
    #   it "Should return height = 0.80 * plot.height for 'long' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis256})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(25)
    #     expect(image_dimensions.height).to.be.equal(380)
    #
    #   it "Should return height = plot.height - 2 * legend_padding for any palette in side panel", ->
    #     @plot.add_layout(@color_bar, 'right')
    #     document = new Document()
    #     document.add_root(@plot)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis3})
    #     @color_bar.title = "I'm a title"
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(25)
    #     # height = 500 (plot.height) - 2 * 10 (color_bar.legend_padding) - 17 (title_height)
    #     expect(image_dimensions.height).to.be.equal(463)
    #
    # describe "ColorBar.orientation = 'horizontal'", ->
    #
    #   beforeEach ->
    #     @color_bar = new ColorBar.Model({
    #       orientation: 'horizontal'
    #     })
    #
    #   it "Should use set `legend_width` and `legend_height` if set", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis3})
    #     @color_bar.legend_width = 100
    #     @color_bar.legend_height = 200
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(100)
    #     expect(image_dimensions.height).to.be.equal(200)
    #
    #   it "Should return width = 0.30 * plot.width for 'short' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis3})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(150)
    #     expect(image_dimensions.height).to.be.equal(25)
    #
    #   it "Should return width = palette.length * 25 for 'medium' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis10})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     expect(image_dimensions.width).to.be.equal(250)
    #     expect(image_dimensions.height).to.be.equal(25)
    #
    #   it "Should return width = 0.80 * plot.width for 'long' palette", ->
    #     @plot.add_layout(@color_bar)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis256})
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     # width = 500 (plot.width) * 0.8 - 2 * 10 (color_bar.legend_padding)
    #     expect(image_dimensions.width).to.be.equal(380)
    #     expect(image_dimensions.height).to.be.equal(25)
    #
    #   it "Should return width = plot.width - 2 * legend_padding for any palette in side panel", ->
    #      # Add to right side panel
    #     @plot.add_layout(@color_bar, 'below')
    #     document = new Document()
    #     document.add_root(@plot)
    #
    #     @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 100, palette: Viridis.Viridis10})
    #     @color_bar.title = "I'm a title"
    #
    #     image_dimensions = @color_bar._computed_image_dimensions()
    #     # width = 500 (plot.width) - 2 * 10 (color_bar.legend_padding)
    #     expect(image_dimensions.width).to.be.equal(480)
    #     expect(image_dimensions.height).to.be.equal(25)

  # describe "ColorBar.Model._tick_coordinates method", ->
  #
  #   it "Should correctly determine tick coords and labels for LinearColorMapper", ->
  #     @color_bar = new ColorBar.Model({
  #       legend_height: 100
  #       legend_width: 25
  #       color_mapper: new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
  #     })
  #
  #     tick_coords = @color_bar._tick_coordinates()
  #
  #     expect(tick_coords.major[1]).to.be.deep.equal(new Float64Array([0, 20, 40, 60, 80, 100]))
  #     expect(tick_coords.major_labels).to.be.deep.equal([0, 2, 4, 6, 8, 10])
  #
  #   it "Should correctly determine tick coords and labels for LogColorMapper", ->
  #     @color_bar = new ColorBar.Model({
  #       legend_height: 100
  #       legend_width: 25
  #       color_mapper: new LogColorMapper({low: 0, high: 1000, palette: Viridis.Viridis10})
  #     })
  #
  #     tick_coords = @color_bar._tick_coordinates()
  #     expect(tick_coords.major[1]).to.be.deep.equal(new Float64Array([0, 76.70099985546604, 86.73533304426542, 92.60504167945479, 96.76966623306478, 100]))
  #     expect(tick_coords.major_labels).to.be.deep.equal([0, 200, 400, 600, 800, 1000])
