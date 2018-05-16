{expect, assert} = require "chai"
sinon = require 'sinon'

dom = require("core/dom")
{Tap, MouseMove} = require("core/bokeh_events")

{CrosshairTool} = require("models/tools/inspectors/crosshair_tool")
{PanTool} = require("models/tools/gestures/pan_tool")
{PolySelectTool} = require("models/tools/gestures/poly_select_tool")
{SelectTool, SelectToolView} = require("models/tools/gestures/select_tool")
{TapTool} = require("models/tools/gestures/tap_tool")
{WheelZoomTool} = require("models/tools/gestures/wheel_zoom_tool")

{Canvas} = require("models/canvas/canvas")
{Document} = require("document")
{Legend} = require("models/annotations/legend")
{Plot} = require("models/plots/plot")
{PlotCanvas} = require("models/plots/plot_canvas")
{Range1d} = require("models/ranges/range1d")
{Toolbar} = require("models/tools/toolbar")
{UIEvents} = require "core/ui_events"

describe "ui_events module", ->

  afterEach ->
    UIEvents.prototype._configure_hammerjs.restore()

  beforeEach ->
    sinon.stub(UIEvents.prototype, "_configure_hammerjs")

    doc = new Document()
    @plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(@plot)
    plot_view = new @plot.default_view({model: @plot, parent: null})
    @plot_canvas_view = plot_view.plot_canvas_view
    @ui_events = @plot_canvas_view.ui_event_bus

  describe "_trigger method", ->

    afterEach ->
      @spy_trigger.restore()

    beforeEach ->
      @spy_trigger = sinon.spy(@ui_events, "trigger")

    describe "base_type=move", ->

      afterEach ->
        @spy_cursor.restore()

      beforeEach ->
        @e = {type: "move"}

        @spy_cursor = sinon.spy(@plot_canvas_view, "set_cursor")

      it "should trigger move event for active inspectors", ->
        inspector = new CrosshairTool({active: true})
        @plot.add_tools(inspector)

        @ui_events._trigger(@ui_events.move, @e, {target: null})

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal([@ui_events.move, @e, inspector.id])

      it "should not trigger move event for inactive inspectors", ->
        inspector = new CrosshairTool({active: false})
        @plot.add_tools(inspector)

        @ui_events._trigger(@ui_events.move, @e, {target: null})

        assert(@spy_trigger.notCalled)

      it "should use default cursor no active inspector", ->
        @ui_events._trigger(@ui_events.move, @e, {target: null})

        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("default"))

      it "should use default cursor if active inspector but mouse is off-frame", ->
        inspector = new CrosshairTool()
        @plot.add_tools(inspector)

        ss = sinon.stub(@ui_events, "_hit_test_frame").returns(false)

        @ui_events._trigger(@ui_events.move, @e, {target: null})
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("default"))

        ss.restore()

      it "should change cursor if active inspector is present and over frame", ->
        inspector = new CrosshairTool()
        @plot.add_tools(inspector)

        ss = sinon.stub(@ui_events, "_hit_test_frame").returns(true)

        @ui_events._trigger(@ui_events.move, @e, {target: null})
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("crosshair"))

        ss.restore()

      it "should change cursor on view_renderer with cursor method", ->
        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({model: legend, parent: null}) # wrong

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)

        @ui_events._trigger(@ui_events.move, @e, {target: null})
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("pointer"))

        ss.restore()

      it "should override event_type if active inspector clashes with view renderer", ->
        inspector = new CrosshairTool()
        @plot.add_tools(inspector)

        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({model: legend, parent: null}) # wrong

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)

        @ui_events._trigger(@ui_events.move, @e, {target: null})
        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal([@ui_events.move_exit, @e, inspector.id])
        # should also use view renderer cursor and not inspector cursor
        assert(@spy_cursor.calledOnce)
        assert(@spy_cursor.calledWith("pointer"))

        ss.restore()

    describe "base_type=tap", ->

      beforeEach ->
        @e = {type: "tap", sx: 10, sy: 15, shiftKey: false}

      it "should not trigger tap event if no active tap tool", ->
        @ui_events._trigger(@ui_events.tap, @e, {target: null})
        assert(@spy_trigger.notCalled)

      it "should trigger tap event if exists an active tap tool", ->
        gesture = new TapTool()
        @plot.add_tools(gesture)

        @ui_events._trigger(@ui_events.tap, @e, {target: null})

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal([@ui_events.tap, @e, gesture.id])

      it "should call on_hit method on view renderer if exists", ->
        legend = new Legend({click_policy: "mute"})
        legend_view = new legend.default_view({model: legend, parent: null}) # wrong

        ss = sinon.stub(@ui_events, "_hit_test_renderers").returns(legend_view)
        on_hit = sinon.stub(legend_view, "on_hit")

        @ui_events._trigger(@ui_events.tap, @e, {target: null})
        assert(on_hit.calledOnce)
        expect(on_hit.args[0]).to.be.deep.equal([10, 15])

        on_hit.restore()
        ss.restore()

    describe "base_type=scroll", ->

      afterEach ->
        @preventDefault.restore()
        @stopPropagation.restore()

      beforeEach ->
        @e = {type: "scroll"}
        @srcEvent = new Event("scroll")

        @preventDefault = sinon.spy(@srcEvent, "preventDefault")
        @stopPropagation = sinon.spy(@srcEvent, "stopPropagation")

      it "should not trigger scroll event if no active scroll tool", ->
        @plot.toolbar.gestures["scroll"].active = null
        @ui_events._trigger(@ui_events.scroll, @e, @srcEvent)
        assert(@spy_trigger.notCalled)

        # assert that default scrolling isn't hijacked
        assert(@preventDefault.notCalled)
        assert(@stopPropagation.notCalled)

      it "should trigger scroll event if exists an active tap tool", ->
        gesture = new WheelZoomTool()
        @plot.add_tools(gesture)
        # unclear why add_tools doesn't activate the tool, so have to do it manually
        @plot.toolbar.gestures['scroll'].active = gesture

        @ui_events._trigger(@ui_events.scroll, @e, @srcEvent)

        # assert that default scrolling is disabled
        assert(@preventDefault.calledOnce)
        assert(@stopPropagation.calledOnce)

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal([@ui_events.scroll, @e, gesture.id])

    describe "normally propagate other gesture base_types", ->

      beforeEach ->
        @e = {type: "pan"}

      it "should not trigger event if no active tool", ->
        @ui_events._trigger(@ui_events.pan, @e, {target: null})
        assert(@spy_trigger.notCalled)

      it "should trigger event if exists an active related tool", ->
        gesture = new PanTool()
        @plot.add_tools(gesture)

        @ui_events._trigger(@ui_events.pan, @e, {target: null})

        assert(@spy_trigger.calledOnce)
        expect(@spy_trigger.args[0]).to.be.deep.equal([@ui_events.pan, @e, gesture.id])

  describe "_bokify methods", ->

    afterEach ->
      @dom_stub.restore()
      @spy.restore()

    beforeEach ->
      @dom_stub = sinon.stub(dom, "offset").returns({top: 0, left: 0})
      @spy = sinon.spy(@plot, "trigger_event")

    it "_bokify_hammer should trigger event with appropriate coords and model_id", ->
      e = new Event("tap") # XXX: <- this is not a hammer event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      ev = @ui_events._tap_event(e)
      @ui_events._trigger_bokeh_event(ev)

      bk_event = @spy.args[0][0]

      expect(bk_event).to.be.instanceof(Tap)
      expect(bk_event.sx).to.be.equal(100)
      expect(bk_event.sy).to.be.equal(200)
      expect(bk_event.model_id).to.be.equal(@plot.id)

    it "_bokify_point_event should trigger event with appropriate coords and model_id", ->
      e = new Event("mousemove")
      e.pageX = 100
      e.pageY = 200

      ev = @ui_events._move_event(e)
      @ui_events._trigger_bokeh_event(ev)

      bk_event = @spy.args[0][0]

      expect(bk_event).to.be.instanceof(MouseMove)
      expect(bk_event.sx).to.be.equal(100)
      expect(bk_event.sy).to.be.equal(200)
      expect(bk_event.model_id).to.be.equal(@plot.id)

  describe "_event methods", ->
    ###
    These tests are mildly integration tests. Based on an Event (as would be
    initiated by event listeners attached in the _register_tool method), they
    check whether the BokehEvent and UIEvents are correctly triggered.
    ###

    afterEach ->
      @dom_stub.restore()
      @spy_plot.restore()
      @spy_uievent.restore()

    beforeEach ->
      @dom_stub = sinon.stub(dom, "offset").returns({top: 0, left: 0})
      # The BokehEvent that is triggered by the plot
      @spy_plot = sinon.spy(@plot, "trigger_event")
      # The event is that triggered on UIEvent for tool interactions
      @spy_uievent = sinon.spy(@plot_canvas_view.ui_event_bus, "trigger")

    it "_tap method should handle tap event", ->
      e = new Event("tap")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      @plot.add_tools(new TapTool())

      @ui_events._tap(e)

      expect(@spy_plot.callCount).to.be.equal(2) # tap event and selection event
      assert(@spy_uievent.calledOnce)

    it "_doubletap method should handle doubletap event", ->
      e = new Event("doubletap")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      @plot.add_tools(new PolySelectTool())

      @ui_events._doubletap(e)

      expect(@spy_plot.callCount).to.be.equal(2) # tap event and selection event
      assert(@spy_uievent.calledOnce)

    it "_press method should handle press event", ->
      e = new Event("press")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      @ui_events._press(e)

      assert(@spy_plot.calledOnce)
      # There isn't a tool that uses the _press method
      # assert(@spy_uievent.calledOnce)

    it "_pan_start method should handle panstart event", ->
      e = new Event("panstart")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      pan_tool = new PanTool()
      @plot.add_tools(pan_tool)

      @ui_events._pan_start(e)

      assert(@spy_plot.called)
      assert(@spy_uievent.calledOnce)

    it "_pan method should handle pan event", ->
      e = new Event("pan")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      pan_tool = new PanTool()
      @plot.add_tools(pan_tool)

      @ui_events._pan(e)

      assert(@spy_plot.called)
      assert(@spy_uievent.calledOnce)

    it "_pan_end method should handle pan end event", ->
      e = new Event("panend")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      pan_tool = new PanTool()
      @plot.add_tools(pan_tool)

      @ui_events._pan_end(e)

      assert(@spy_plot.calledOnce)
      assert(@spy_uievent.calledOnce)

    it "_pinch_start method should handle pinchstart event", ->
      e = new Event("pinchstart")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      wheel_zoom_tool = new WheelZoomTool()
      @plot.add_tools(wheel_zoom_tool)

      #idk why it's not auto active
      @plot.toolbar.gestures['pinch'].active = wheel_zoom_tool

      @ui_events._pinch_start(e)

      assert(@spy_plot.calledOnce)
      # wheelzoomtool doesn't have _pinch_start but will emit event anyway
      assert(@spy_uievent.calledOnce)

    it "_pinch method should handle pinch event", ->
      e = new Event("pinch")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      wheel_zoom_tool = new WheelZoomTool()
      @plot.add_tools(wheel_zoom_tool)

      #idk why it's not auto active
      @plot.toolbar.gestures['pinch'].active = wheel_zoom_tool

      @ui_events._pinch(e)

      assert(@spy_plot.calledOnce)
      assert(@spy_uievent.calledOnce)

    it "_pinch_end method should handle pinchend event", ->
      e = new Event("pinchend")
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      wheel_zoom_tool = new WheelZoomTool()
      @plot.add_tools(wheel_zoom_tool)

      #idk why it's not auto active
      @plot.toolbar.gestures['pinch'].active = wheel_zoom_tool

      @ui_events._pinch_end(e)

      assert(@spy_plot.calledOnce)
      # wheelzoomtool doesn't have _pinch_start but will emit event anyway
      assert(@spy_uievent.calledOnce)

    # not implemented as tool method or BokehEvent
    # it "_rotate_start method should handle rotatestart event", ->

    # not implemented as tool method or BokehEvent
    # it "_rotate method should handle rotate event", ->

    # not implemented as tool method or BokehEvent
    # it "_rotate_end method should handle rotateend event", ->

    it "_move_enter method should handle mouseenter event", ->
      e = new Event("mouseenter")

      crosshair_tool = new CrosshairTool()
      @plot.add_tools(crosshair_tool)

      @ui_events._mouse_enter(e)

      assert(@spy_plot.calledOnce)
      assert(@spy_uievent.calledOnce)

    it "_move method should handle mousemove event", ->
      e = new Event("mousemove")

      crosshair_tool = new CrosshairTool()
      @plot.add_tools(crosshair_tool)

      @ui_events._mouse_move(e)

      assert(@spy_plot.calledOnce)
      assert(@spy_uievent.calledOnce)

    it "_move_exit method should handle mouseleave event", ->
      e = new Event("mouseleave")

      crosshair_tool = new CrosshairTool()
      @plot.add_tools(crosshair_tool)

      @ui_events._mouse_exit(e)

      assert(@spy_plot.calledOnce)
      assert(@spy_uievent.calledOnce)

    it "_mouse_wheel method should handle wheel event", ->
      e = new Event("wheel")

      wheel_zoom_tool = new WheelZoomTool()
      @plot.add_tools(wheel_zoom_tool)

      #idk why it's not auto active
      @plot.toolbar.gestures['scroll'].active = wheel_zoom_tool

      @ui_events._mouse_wheel(e)

      assert(@spy_plot.called)
      assert(@spy_uievent.calledOnce)

    # not implemented as tool method or BokehEvent
    # it "_key_down method should handle keydown event", ->

    it "_key_up method should handle keyup event", ->
      e = new Event("keyup")

      poly_select_tool = new PolySelectTool()
      @plot.add_tools(poly_select_tool)

      @ui_events._key_up(e)

      # There isn't a BokehEvent model for keydown events
      # assert(@spy_plot.calledOnce)
      # This is a event on select tools that should probably be removed
      assert(@spy_uievent.calledOnce)

    it "multi-gesture tool should receive multiple events", ->
      class MultiToolView extends SelectToolView
        _tap: (e) ->
        _pan: (e) ->

      class MultiTool extends SelectTool
        default_view: MultiToolView
        type: "MultiTool"
        tool_name: "Multi Tool"
        event_type: ["tap", "pan"]

      tool = new MultiTool()
      @plot.add_tools(tool)
      tool.active = true

      etap = new Event("tap")
      etap.pointerType = "mouse"
      etap.srcEvent = {pageX: 100, pageY: 200}

      @ui_events._tap(etap)
      assert(@spy_uievent.calledOnce, "Tap event not triggered")

      epan = new Event("pan")
      epan.pointerType = "mouse"
      epan.srcEvent = {pageX: 100, pageY: 200}
      @ui_events._pan(epan)
      assert(@spy_uievent.calledTwice, "Pan event not triggered")
