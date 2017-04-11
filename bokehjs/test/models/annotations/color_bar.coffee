{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{SidePanel} = utils.require("core/layout/side_panel")
{ColorBar, ColorBarView} = utils.require('models/annotations/color_bar')
{LinearColorMapper} = utils.require("models/mappers/linear_color_mapper")
{LinearMapper} = utils.require("models/mappers/linear_mapper")
{LogColorMapper} = utils.require("models/mappers/log_color_mapper")
{LogMapper} = utils.require("models/mappers/log_mapper")
{LogTicker} = utils.require("models/tickers/log_ticker")
{Viridis} = utils.require("api/palettes")
{Plot} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")
{Document} = utils.require "document"
bokeh_text  = utils.require("core/util/text")

describe "ColorBar module", ->

  afterEach ->
    utils.unstub_canvas()
    bokeh_text.get_text_height.restore()

  beforeEach ->
    utils.stub_canvas()
    sinon.stub(bokeh_text, "get_text_height", () -> {height: 15, ascent: 10, descent: 5})

    @plot = new Plot({
       x_range: new Range1d({start: 0, end: 1})
       y_range: new Range1d({start: 0, end: 1})
    })

    @color_bar = new ColorBar()

  describe "ColorBar", ->

    beforeEach ->
      # Stub solver computed values with deterministic frame height and width
      Object.defineProperty(@plot.plot_canvas.frame, 'height', { get: () -> 500 })
      Object.defineProperty(@plot.plot_canvas.frame, 'width', { get: () -> 500 })

    describe "ColorBar._title_extent method", ->

      it "_title_height should return 0 if there is no title", ->
        title_height = @color_bar._title_extent()
        expect(title_height).to.be.equal(0)

      it "_title_height should calculate title height plus title_standoff if there is a title", ->
        @color_bar.title = "I'm a title"
        @color_bar.title_standoff = 5
        title_height = @color_bar._title_extent()
        expect(title_height).to.be.equal(20)

    describe "ColorBar._tick_extent method", ->
      it "Should return zero if either low or high are unset", ->
        @color_bar.color_mapper = new LinearColorMapper({palette: Viridis.Viridis10})
        expect(@color_bar._tick_extent()).to.be.equal(0)

      it "Should return major_tick_out if both low and high are set", ->
        @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
        @color_bar.major_tick_out = 6
        expect(@color_bar._tick_extent()).to.be.equal(6)

    describe "ColorBar._tick_coordinate_mapper method", ->

      it "LinearColorMapper should yield LinearMapper instance with correct state", ->
        @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
        mapper = @color_bar._tick_coordinate_mapper(100) #length of scale dimension
        expect(mapper).to.be.instanceof(LinearMapper)
        expect(mapper.mapper_state).to.be.deep.equal [10, 0]

      it "LogColorMapper should yield LogMapper instance with correct state", ->
        @color_bar.color_mapper = new LogColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})
        mapper = @color_bar._tick_coordinate_mapper(100) #length of scale dimension
        expect(mapper).to.be.instanceof(LogMapper)
        expect(mapper.mapper_state).to.be.deep.equal [100, 0, 2.302585092994046, 0]

    describe "ColorBar._computed_image_dimensions method", ->

        describe "ColorBar.orientation = 'vertical' in plot frame", ->

          beforeEach ->
            @plot.add_layout(@color_bar)

          it "Should use set `width` and `height` if set", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
            @color_bar.width = 100
            @color_bar.height = 200

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(100)
            expect(image_dimensions.height).to.be.equal(200)

          it "Should return height = 0.30 * frame_height for 'short' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(25)
            expect(image_dimensions.height).to.be.equal(150)

          it "Should return height = palette.length * 25 for 'medium' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(25)
            expect(image_dimensions.height).to.be.equal(250)

          it "Should return height = 0.80 * plot.height for 'long' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256})

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(25)
            expect(image_dimensions.height).to.be.equal(380)

        describe "ColorBar.orientation = 'vertical' in side frame", ->

          beforeEach ->
            @plot.add_layout(@color_bar, 'right')
            document = new Document()
            document.add_root(@plot)

          it "Should return height = plot.height - 2 * padding for any palette in side panel", ->

            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
            @color_bar.title = "I'm a title"

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(25)
            # height = 500 (plot.height) - 2 * 10 (color_bar.padding) - 17 (title_height)
            expect(image_dimensions.height).to.be.equal(463)

        describe "ColorBar.orientation = 'horizontal'", ->

          beforeEach ->
            @color_bar.orientation = 'horizontal'
            @plot.add_layout(@color_bar)

          it "Should use set `width` and `height` if set", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})
            @color_bar.width = 100
            @color_bar.height = 200

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(100)
            expect(image_dimensions.height).to.be.equal(200)

          it "Should return width = 0.30 * plot.width for 'short' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis3})

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(150)
            expect(image_dimensions.height).to.be.equal(25)

          it "Should return width = palette.length * 25 for 'medium' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})

            image_dimensions = @color_bar._computed_image_dimensions()
            expect(image_dimensions.width).to.be.equal(250)
            expect(image_dimensions.height).to.be.equal(25)

          it "Should return width = 0.80 * plot.width for 'long' palette", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis256})

            image_dimensions = @color_bar._computed_image_dimensions()
            # width = 500 (plot.width) * 0.8 - 2 * 10 (color_bar.padding)
            expect(image_dimensions.width).to.be.equal(380)
            expect(image_dimensions.height).to.be.equal(25)

        describe "ColorBar.orientation = 'horizontal' in side frame", ->

          beforeEach ->
            @color_bar.orientation = 'horizontal'
            @plot.add_layout(@color_bar, 'below')
            document = new Document()
            document.add_root(@plot)

          it "Should return width = plot.width - 2 * padding for any palette in side panel", ->
            @color_bar.color_mapper = new LinearColorMapper({low: 1, high: 100, palette: Viridis.Viridis10})
            @color_bar.title = "I'm a title"

            image_dimensions = @color_bar._computed_image_dimensions()
            # width = 500 (plot.width) - 2 * 10 (color_bar.padding)
            expect(image_dimensions.width).to.be.equal(480)
            expect(image_dimensions.height).to.be.equal(25)

    describe "ColorBar._tick_coordinates method", ->

      beforeEach ->
        @plot.add_layout(@color_bar)
        @lin_expected = new Float64Array([0, 20, 40, 60, 80, 100])
        @log_expected = new Float64Array([0, 76.70099985546604, 86.73533304426542, 92.60504167945479, 96.76966623306478, 100])

      it "Should correctly tick coords and labels for LinearColorMapper if orientation='vertical'", ->
        @color_bar.color_mapper = new LinearColorMapper({low: 10, high: 20, palette: Viridis.Viridis10})
        @color_bar.height = 100
        @color_bar.orientation = 'vertical'

        tick_coords = @color_bar._tick_coordinates()

        expect(tick_coords.major[0]).to.be.deep.equal([0, 0, 0, 0, 0, 0])
        expect(tick_coords.major[1]).to.be.deep.equal(new Float64Array([100, 80, 60, 40, 20, 0]))
        expect(tick_coords.major_labels).to.be.deep.equal([10, 12, 14, 16, 18, 20])

      it "Should correctly determine tick coords and labels for LinearColorMapperif orientation='horizontal'", ->
        @color_bar.color_mapper = new LinearColorMapper({low: 10, high: 20, palette: Viridis.Viridis10})
        @color_bar.width = 100
        @color_bar.orientation = 'horizontal'

        tick_coords = @color_bar._tick_coordinates()

        expect(tick_coords.major[1]).to.be.deep.equal([0, 0, 0, 0, 0, 0])
        expect(tick_coords.major[0]).to.be.deep.equal(new Float64Array([0, 20, 40, 60, 80, 100]))
        expect(tick_coords.major_labels).to.be.deep.equal([10, 12, 14, 16, 18, 20])

      it "Should correctly determine tick coords and labels for LogColorMapper if orientation='vertical'", ->
        @color_bar.color_mapper = new LogColorMapper({low: 1, high: 1000, palette: Viridis.Viridis10})
        @color_bar.height = 100
        @color_bar.orientation = 'vertical'

        tick_coords = @color_bar._tick_coordinates()

        expect(tick_coords.major[0]).to.be.deep.equal([0, 0, 0, 0, 0])
        expect(tick_coords.major[1]).to.be.deep.equal(new Float64Array([23.299000144533963, 13.264666955734583, 7.394958320545214, 3.2303337669352175, 0]))
        expect(tick_coords.major_labels).to.be.deep.equal([200, 400, 600, 800, 1000])

      it "Should correctly determine tick coords and labels for LogColorMapper if orientation='horizontal'", ->
        @color_bar.color_mapper = new LogColorMapper({low: 1, high: 1000, palette: Viridis.Viridis10})
        @color_bar.width = 100
        @color_bar.orientation = 'horizontal'

        tick_coords = @color_bar._tick_coordinates()

        expect(tick_coords.major[1]).to.be.deep.equal([0, 0, 0, 0, 0])
        expect(tick_coords.major[0]).to.be.deep.equal(new Float64Array([76.70099985546604, 86.73533304426542, 92.60504167945479, 96.76966623306478, 100]))
        expect(tick_coords.major_labels).to.be.deep.equal([200, 400, 600, 800, 1000])

      it "Should correctly return empty tick coords and labels for LogColorMapper if log(high)/log(low) are non-numeric", ->
        @color_bar.color_mapper = new LogColorMapper({low: -1, high: 0, palette: Viridis.Viridis10})
        @color_bar.ticker = new LogTicker()
        tick_coords = @color_bar._tick_coordinates()

        expect(tick_coords.major[0]).to.be.deep.equal([])
        expect(tick_coords.major[1]).to.be.deep.equal(new Float64Array([]))
        expect(tick_coords.major_labels).to.be.deep.equal([])

  describe "ColorBarView", ->

    afterEach ->
      @_set_canvas_image_stub.restore()

    beforeEach ->
      @_set_canvas_image_stub = sinon.stub(ColorBarView.prototype, '_set_canvas_image')

      @color_bar.color_mapper = new LinearColorMapper({low: 0, high: 10, palette: Viridis.Viridis10})

      @plot.add_layout(@color_bar, 'right')
      document = new Document()
      document.add_root(@plot)

      @plot_canvas_view = new @plot.plot_canvas.default_view({ model: @plot.plot_canvas })

      @color_bar_view = new @color_bar.default_view({
        model: @color_bar
        plot_view: @plot_canvas_view
      })

    it "Should reset scale image if color_mapper changes", ->
      # Reset spy count to zero (method was called during view initialization)
      @_set_canvas_image_stub.reset()
      @color_bar.color_mapper.palette = Viridis.Viridis3
      expect(@_set_canvas_image_stub.called).to.be.true

    it "ColorBarView._get_image_offset method", ->
      @color_bar.title = "I'm a title"
      expect(@color_bar_view._get_image_offset()).to.be.deep.equal({ x: 10, y: 27 })

    it "ColorBarView._get_label_extent method (orientation='vertical')", ->
      # Note: ctx.measureText is stubbed to return {'width': 1, 'ascent': 1} in test/utils
      expect(@color_bar_view._get_label_extent()).to.be.equal(6)

    it "ColorBarView._get_label_extent method (orientation='vertical') and no major_labels", ->
      # Handle case where mapper start/end causes no ticks to exist (usually for a logticker)
      stub = sinon.stub(@color_bar_view.model, "_tick_coordinates").returns({"major_labels": []})
      expect(@color_bar_view._get_label_extent()).to.be.equal(0)
      stub.restore()

    it "ColorBarView._get_label_extent method (orientation='horizontal')", ->
      @color_bar_view.model.orientation = "horizontal"
      expect(@color_bar_view._get_label_extent()).to.be.equal(20)

    it "ColorBarView.compute_legend_dimensions method (orientation='vertical')", ->
      # Note: ctx.measureText is stubbed to return {'width': 1, 'ascent': 1} in test/utils
      @color_bar.height = 100
      @color_bar.width = 25

      expect(@color_bar_view.compute_legend_dimensions()).to.be.deep.equal({ height: 120, width: 51 })

    it "ColorBarView.compute_legend_dimensions method (orientation='horizontal')", ->
      @color_bar.orientation = "horizontal"
      @color_bar.height = 25
      @color_bar.width = 100

      expect(@color_bar_view.compute_legend_dimensions()).to.be.deep.equal({ height: 65, width: 120 })

    it "ColorBarView._get_size method", ->
      expect(@color_bar_view._get_size()).to.be.equal(51)
