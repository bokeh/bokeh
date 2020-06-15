import {expect} from "assertions"
import * as sinon from 'sinon'

import * as dom from "@bokehjs/core/dom"
import {Tap, MouseMove} from "@bokehjs/core/bokeh_events"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {PolySelectTool} from "@bokehjs/models/tools/gestures/poly_select_tool"
import {SelectTool, SelectToolView} from "@bokehjs/models/tools/gestures/select_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"

import {Legend} from "@bokehjs/models/annotations/legend"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {UIEvents, UIEvent, PanEvent, TapEvent} from "@bokehjs/core/ui_events"
import {build_view} from "@bokehjs/core/build_views"

describe("ui_events module", () => {

  async function new_plot(): Promise<PlotView> {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    return (await build_view(plot)).build()
  }

  let hammer_stub: sinon.SinonStub
  let plot_view: PlotView
  let ui_events: UIEvents
  let ANY_ui_events: any

  before_each(async () => {
    hammer_stub = sinon.stub(UIEvents.prototype as any, "_configure_hammerjs") // XXX: protected

    plot_view = await new_plot()
    ui_events = (plot_view as any).ui_event_bus // XXX: protected
    ANY_ui_events = ui_events // XXX: protected
  })

  after_each(() => {
    hammer_stub.restore()
  })

  describe("_trigger method", () => {

    let spy_trigger: sinon.SinonSpy

    before_each(() => {
      spy_trigger = sinon.spy(ui_events, "trigger")
    })

    after_each(() => {
      spy_trigger.restore()
    })

    describe("base_type=move", () => {

      let e: UIEvent
      let spy_cursor: sinon.SinonSpy
      before_each(() => {
        e = {type: "mousemove", sx: 0, sy: 0, ctrlKey: false, shiftKey: false}
        spy_cursor = sinon.spy(plot_view, "set_cursor")
      })

      after_each(() => {
        spy_cursor.restore()
      })

      it("should trigger move event for active inspectors", async () => {
        const inspector = new CrosshairTool({active: true})
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_events.move, e, inspector.id])
      })

      it("should not trigger move event for inactive inspectors", async () => {
        const inspector = new CrosshairTool({active: false})
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))

        expect(spy_trigger.notCalled).to.be.true
      })

      it("should use default cursor no active inspector", () => {
        ui_events._trigger(ui_events.move, e, new Event("mousemove"))

        expect(spy_cursor.calledOnce).to.be.true
        expect(spy_cursor.calledWith("default")).to.be.true
      })

      it("should use default cursor if active inspector but mouse is off-frame", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        const ss = sinon.stub(ui_events as any, "_hit_test_frame").returns(false) // XXX: protected

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))
        expect(spy_cursor.calledOnce).to.be.true
        expect(spy_cursor.calledWith("default")).to.be.true

        ss.restore()
      })

      it("should change cursor if active inspector is present and over frame", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        const ss = sinon.stub(ui_events as any, "_hit_test_frame").returns(true) // XXX: protected

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))
        expect(spy_cursor.calledOnce).to.be.true
        expect(spy_cursor.calledWith("crosshair")).to.be.true

        ss.restore()
      })

      it("should change cursor on view_renderer with cursor method", async () => {
        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_events as any, "_hit_test_renderers").returns(legend_view) // XXX: protected

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))
        expect(spy_cursor.calledOnce).to.be.true
        expect(spy_cursor.calledWith("pointer")).to.be.true

        ss.restore()
      })

      it("should override event_type if active inspector clashes with view renderer", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_events as any, "_hit_test_renderers").returns(legend_view) // XXX: protected

        ui_events._trigger(ui_events.move, e, new Event("mousemove"))
        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_events.move_exit, e, inspector.id])
        // should also use view renderer cursor and not inspector cursor
        expect(spy_cursor.calledOnce).to.be.true
        expect(spy_cursor.calledWith("pointer")).to.be.true

        ss.restore()
      })
    })

    describe("base_type=tap", () => {

      let e: UIEvent
      before_each(() => {
        e = {type: "tap", sx: 10, sy: 15, ctrlKey: false, shiftKey: false}
      })

      it("should not trigger tap event if no active tap tool", () => {
        ui_events._trigger(ui_events.tap, e, new Event("mousemove"))
        expect(spy_trigger.notCalled).to.be.true
      })

      it("should trigger tap event if exists an active tap tool", async () => {
        const gesture = new TapTool()
        plot_view.model.add_tools(gesture)
        await plot_view.ready

        ui_events._trigger(ui_events.tap, e, new Event("mousemove"))

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_events.tap, e, gesture.id])
      })

      it("should call on_hit method on view renderer if exists", async () => {
        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_events as any, "_hit_test_renderers").returns(legend_view) // XXX: protected
        const on_hit = sinon.stub(legend_view, "on_hit")

        ui_events._trigger(ui_events.tap, e, new Event("mousemove"))
        expect(on_hit.calledOnce).to.be.true
        expect(on_hit.args[0]).to.be.equal([10, 15])

        on_hit.restore()
        ss.restore()
      })
    })

    describe("base_type=scroll", () => {

      let e: UIEvent
      let srcEvent: Event
      let preventDefault: sinon.SinonSpy
      let stopPropagation: sinon.SinonSpy

      before_each(() => {
        e = {type: "wheel", sx: 0, sy: 0, delta: 1, ctrlKey: false, shiftKey: false}
        srcEvent = new Event("scroll")

        preventDefault = sinon.spy(srcEvent, "preventDefault")
        stopPropagation = sinon.spy(srcEvent, "stopPropagation")
      })

      after_each(() => {
        preventDefault.restore()
        stopPropagation.restore()
      })

      it("should not trigger scroll event if no active scroll tool", () => {
        plot_view.model.toolbar.gestures.scroll.active = null
        ui_events._trigger(ui_events.scroll, e, srcEvent)
        expect(spy_trigger.notCalled).to.be.true

        // assert that default scrolling isn't hijacked
        expect(preventDefault.notCalled).to.be.true
        expect(stopPropagation.notCalled).to.be.true
      })

      it("should trigger scroll event if exists an active tap tool", async () => {
        const gesture = new WheelZoomTool()
        plot_view.model.add_tools(gesture)
        await plot_view.ready

        // unclear why add_tools doesn't activate the tool, so have to do it manually
        plot_view.model.toolbar.gestures.scroll.active = gesture

        ui_events._trigger(ui_events.scroll, e, srcEvent)

        // assert that default scrolling is disabled
        expect(preventDefault.calledOnce).to.be.true
        expect(stopPropagation.calledOnce).to.be.true

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_events.scroll, e, gesture.id])
      })
    })

    describe("normally propagate other gesture base_types", () => {
      let e: UIEvent
      before_each(() => {
        e = {type: "pan", sx: 0, sy: 0, deltaX: 0, deltaY: 0, ctrlKey: false, shiftKey: false}
      })

      it("should not trigger event if no active tool", () => {
        ui_events._trigger(ui_events.pan, e, new Event("pointerdown"))
        expect(spy_trigger.notCalled).to.be.true
      })

      it("should trigger event if exists an active related tool", async () => {
        const gesture = new PanTool()
        plot_view.model.add_tools(gesture)
        await plot_view.ready

        ui_events._trigger(ui_events.pan, e, new Event("pointerdown"))

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_events.pan, e, gesture.id])
      })
    })
  })

  describe("_bokify methods", () => {

    let dom_stub: sinon.SinonStub
    let spy: sinon.SinonSpy

    before_each(() => {
      dom_stub = sinon.stub(dom, "offset").returns({top: 0, left: 0})
      spy = sinon.spy(plot_view.model, "trigger_event")
    })

    after_each(() => {
      dom_stub.restore()
      spy.restore()
    })

    it("_bokify_hammer should trigger event with appropriate coords and model id", () => {
      const e: any = new Event("tap") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200}

      const ev = ANY_ui_events._tap_event(e)
      ANY_ui_events._trigger_bokeh_event(ev)

      const bk_event = spy.args[0][0]

      expect(bk_event).to.be.instanceof(Tap)
      expect(bk_event.sx).to.be.equal(100)
      expect(bk_event.sy).to.be.equal(200)
      // XXX: expect(bk_event.origin.id).to.be.equal(plot_view.model.id)
    })

    it("_bokify_point_event should trigger event with appropriate coords and model id", () => {
      const e: any = new Event("mousemove")
      e.pageX = 100 // XXX: readonly
      e.pageY = 200 // XXX: readonly

      const ev = ANY_ui_events._move_event(e)
      ANY_ui_events._trigger_bokeh_event(ev)

      const bk_event = spy.args[0][0]

      expect(bk_event).to.be.instanceof(MouseMove)
      expect(bk_event.sx).to.be.equal(100)
      expect(bk_event.sy).to.be.equal(200)
      // XXX: expect(bk_event.origin.id).to.be.equal(plot_view.model.id)
    })
  })

  describe("_event methods", () => {
    // These tests are mildly integration tests. Based on an Event (as would be
    // initiated by event listeners attached in the _register_tool method), they
    // check whether the BokehEvent and UIEvents are correctly triggered.

    let dom_stub: sinon.SinonStub
    let spy_plot: sinon.SinonSpy
    let spy_uievent: sinon.SinonSpy

    before_each(() => {
      dom_stub = sinon.stub(dom, "offset").returns({top: 0, left: 0})
      // The BokehEvent that is triggered by the plot
      spy_plot = sinon.spy(plot_view.model, "trigger_event")
      // The event is that triggered on UIEvent for tool interactions
      spy_uievent = sinon.spy(ui_events, "trigger")
    })

    after_each(() => {
      dom_stub.restore()
      spy_plot.restore()
      spy_uievent.restore()
    })

    it("_tap method should handle tap event", async () => {
      const e: any = new Event("tap") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      plot_view.model.add_tools(new TapTool())
      await plot_view.ready

      ANY_ui_events._tap(e)

      expect(spy_plot.callCount).to.be.equal(2) // tap event and selection event
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_doubletap method should handle doubletap event", async () => {
      const e: any = new Event("doubletap") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      plot_view.model.add_tools(new PolySelectTool())
      await plot_view.ready

      ANY_ui_events._doubletap(e)

      expect(spy_plot.callCount).to.be.equal(2) // tap event and selection event
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_press method should handle press event", () => {
      const e: any = new Event("press") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      ANY_ui_events._press(e)

      expect(spy_plot.calledOnce).to.be.true
      // There isn't a tool that uses the _press method
      // expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pressup method should handle pressup event", () => {
      const e: any = new Event("pressup") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      ANY_ui_events._pressup(e)

      expect(spy_plot.calledOnce).to.be.true
    })

    it("_pan_start method should handle panstart event", async () => {
      const e: any = new Event("panstart") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ANY_ui_events._pan_start(e)

      expect(spy_plot.called).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pan method should handle pan event", async () => {
      const e: any = new Event("pan") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ANY_ui_events._pan(e)

      expect(spy_plot.called).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pan_end method should handle pan end event", async () => {
      const e: any = new Event("panend") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ANY_ui_events._pan_end(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pinch_start method should handle pinchstart event", async () => {
      const e: any = new Event("pinchstart") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ANY_ui_events._pinch_start(e)

      expect(spy_plot.calledOnce).to.be.true
      // wheelzoomtool doesn't have _pinch_start but will emit event anyway
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pinch method should handle pinch event", async () => {
      const e: any = new Event("pinch") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ANY_ui_events._pinch(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pinch_end method should handle pinchend event", async () => {
      const e: any = new Event("pinchend") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ANY_ui_events._pinch_end(e)

      expect(spy_plot.calledOnce).to.be.true
      // wheelzoomtool doesn't have _pinch_start but will emit event anyway
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_move_enter method should handle mouseenter event", async () => {
      const e = new Event("mouseenter")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ANY_ui_events._mouse_enter(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_move method should handle mousemove event", async () => {
      const e = new Event("mousemove")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ANY_ui_events._mouse_move(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_move_exit method should handle mouseleave event", async () => {
      const e = new Event("mouseleave")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ANY_ui_events._mouse_exit(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_mouse_wheel method should handle wheel event", async () => {
      const e = new Event("wheel")

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.scroll.active = wheel_zoom_tool

      ANY_ui_events._mouse_wheel(e)

      expect(spy_plot.called).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_key_up method should handle keyup event", async () => {
      const e = new Event("keyup")

      const poly_select_tool = new PolySelectTool()
      plot_view.model.add_tools(poly_select_tool)
      await plot_view.ready

      ANY_ui_events._key_up(e)

      // There isn't a BokehEvent model for keydown events
      // expect(spy_plot.calledOnce).to.be.true
      // This is a event on select tools that should probably be removed
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("multi-gesture tool should receive multiple events", async () => {
      class MultiToolView extends SelectToolView {
        _tap(_e: TapEvent): void {}
        _pan(_e: PanEvent): void {}
      }

      class MultiTool extends SelectTool {
        default_view = MultiToolView
        tool_name = "Multi Tool"
        event_type = ["tap" as "tap", "pan" as "pan"]
      }

      const tool = new MultiTool()
      plot_view.model.add_tools(tool)
      tool.active = true
      await plot_view.ready

      const etap: any = new Event("tap") // XXX: not a hammerjs event
      etap.pointerType = "mouse"
      etap.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}

      ANY_ui_events._tap(etap)
      expect(spy_uievent.calledOnce).to.be.true

      const epan: any = new Event("pan") // XXX: not a hammerjs event
      epan.pointerType = "mouse"
      epan.srcEvent = {pageX: 100, pageY: 200, preventDefault: () => {}}
      ANY_ui_events._pan(epan)
      expect(spy_uievent.calledTwice).to.be.true
    })
  })
})
