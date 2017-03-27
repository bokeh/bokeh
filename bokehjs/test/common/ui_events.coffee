{expect, assert} = require "chai"
utils = require "../utils"
cheerio = require 'cheerio'
sinon = require 'sinon'

{UIEvents} = utils.require "core/ui_events"

# Stub out _hammer_element as not used in testing
stub = sinon.stub(UIEvents.prototype, "_configure_hammerjs")

{CrosshairTool} = utils.require("models/tools/inspectors/crosshair_tool")
{PanTool} = utils.require("models/tools/gestures/pan_tool")
{TapTool} = utils.require("models/tools/gestures/tap_tool")
{WheelPanTool} = utils.require("models/tools/gestures/wheel_pan_tool")

{Canvas} = utils.require("models/canvas/canvas")
{CanvasView} = utils.require("models/canvas/canvas")
{Document} = utils.require("document")
{Legend} = utils.require("models/annotations/legend")
{Plot} = utils.require("models/plots/plot")
{PlotCanvas} = utils.require("models/plots/plot_canvas")
{PlotCanvasView} = utils.require("models/plots/plot_canvas")
{Range1d} = utils.require("models/ranges/range1d")
{Toolbar} = utils.require("models/tools/toolbar")

describe "ui_events module", ->
  # html = '<body><canvas></canvas></body>'
  # $ = cheerio.load(html)

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

    @toolbar = new Toolbar()
    canvas = new Canvas()
    canvas.document = new Document()

    @plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: @toolbar
    })
    canvas.document.add_root(@plot)
    plot_canvas = @plot.plot_canvas
    plot_canvas.attach_document(canvas.document)

    @plot_canvas_view = new plot_canvas.default_view({ 'model': plot_canvas })
    @canvas_view = new canvas.default_view({'model': canvas})

    @ui_events = @plot_canvas_view.ui_event_bus

  describe "_trigger method", ->

    beforeEach ->
      @spy_trigger = sinon.spy(@ui_events, "trigger")

    describe "base_type=move", ->

      beforeEach ->
        @e = new Event("move")
        @e.bokeh = {}
        @e.isTrusted = false
        @spy_cursor = sinon.spy(@plot_canvas_view, "set_cursor")

      it "should handle base case", ->
        # no inspectors or view_renderers
        @ui_events._trigger("move", @e)

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal(["move", @e])

        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("default"))

      it "should change cursor if active inspector is present", ->
        inspector = new CrosshairTool()
        @plot.add_tools(inspector)

        ss = sinon.stub(@ui_events, "_hit_test_frame").returns(true)

        @ui_events._trigger("move", @e)
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("crosshair"))

        ss.restore()

      it "should change cursor on view_renderer with cursor method", ->
        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({'model': legend})

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)

        @ui_events._trigger("move", @e)
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("pointer"))

        ss.restore()

      it "should override event_type if active inspector clashes with view renderer", ->
        inspector = new CrosshairTool()
        @plot.add_tools(inspector)

        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({'model': legend})

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)

        @ui_events._trigger("move", @e)
        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal(["move:exit", @e])
        # should also use view renderer cursor and not inspector cursor
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("pointer"))

        ss.restore()

    describe "base_type=tap", ->

      beforeEach ->
        @e = new Event("tap")
        @e.bokeh = {sx: 10, sy: 15}
        @e.isTrusted = false
        @e.srcEvent = {shiftKey: false}

      it "should not trigger tap event if no active tap tool", ->
        @ui_events._trigger("tap", @e)
        assert(@spy_trigger.notCalled)

      it "should trigger tap event if exists an active tap tool", ->
        gesture = new TapTool()
        @plot.add_tools(gesture)

        @ui_events._trigger("tap", @e)

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal(["tap:#{gesture.id}", @e])

      it "should call on_hit method on view renderer if exists", ->
        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({'model': legend})

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)
        on_hit = sinon.stub(legend_view, "on_hit")

        @ui_events._trigger("tap", @e)
        assert(on_hit.calledOnce)
        expect(on_hit.args[0]).to.be.deep.equal([10, 15])

        on_hit.restore()
        ss.restore()

    describe "base_type=scroll", ->

      beforeEach ->
        @e = new Event("scroll")
        @e.bokeh = {}
        @e.isTrusted = false

        @preventDefault = sinon.spy(@e, "preventDefault")
        @stopPropagation = sinon.spy(@e, "stopPropagation")

      it "should not trigger scroll event if no active scroll tool", ->
        @plot.toolbar.gestures["scroll"].active = null
        @ui_events._trigger("scroll", @e)
        assert(@spy_trigger.notCalled)

        # assert that default scrolling isn't hijacked
        assert(@preventDefault.notCalled)
        assert(@stopPropagation.notCalled)

      it "should trigger scroll event if exists an active tap tool", ->
        gesture = new WheelPanTool()
        @plot.add_tools(gesture)
        # unclear why add_tools doesn't active the tool, so have to do it manually
        @plot.toolbar.gestures['scroll'].active = gesture

        @ui_events._trigger("scroll", @e)

        # assert that default scrolling is disabled
        assert(@preventDefault.calledOnce)
        assert(@stopPropagation.calledOnce)

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal(["scroll:#{gesture.id}", @e])

    describe "normally propagate other gesture base_types", ->

      beforeEach ->
        @e = new Event("pan")
        @e.bokeh = {}
        @e.isTrusted = false

      it "should not trigger event if no active tool", ->
        @plot.toolbar.gestures["pan"].active = null
        @ui_events._trigger("pan", @e)
        assert(@spy_trigger.notCalled)

      it "should trigger event if exists an active related tool", ->
        gesture = new PanTool()
        @plot.add_tools(gesture)

        @ui_events._trigger("pan", @e)

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal(["pan:#{gesture.id}", @e])
