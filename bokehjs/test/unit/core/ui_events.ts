import * as sinon from "sinon"

import {expect} from "assertions"
import {display, restorable} from "../_util"
import {actions, xy} from "../../interactive"

import * as dom from "@bokehjs/core/dom"
import type {PointEvent} from "@bokehjs/core/bokeh_events"
import * as Events from "@bokehjs/core/bokeh_events"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
//import {GestureTool, GestureToolView} from "@bokehjs/models/tools/gestures/gesture_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"

//import {Legend} from "@bokehjs/models/annotations/legend"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
//import type {UIEvent, PanEvent, TapEvent} from "@bokehjs/core/ui_events"
import type {UIEvent} from "@bokehjs/core/ui_events"
import type {UIEventBus} from "@bokehjs/core/ui_events"
//import {build_view} from "@bokehjs/core/build_views"
import {BBox} from "@bokehjs/core/util/bbox"

describe("UIEventBus", () => {

  function plot() {
    const p = new Plot({
      width: 100,
      height: 100,
      min_border: 0,
      toolbar_location: null,
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    return p
  }

  it("should support tap gesture", async () => {
    const p = plot()

    const events: PointEvent[] = []
    p.on_event(Events.Tap, (event) => events.push(event))
    p.on_event(Events.DoubleTap, (event) => events.push(event))
    p.on_event(Events.Press, (event) => events.push(event))
    p.on_event(Events.PressUp, (event) => events.push(event))
    p.on_event(Events.PanStart, (event) => events.push(event))
    p.on_event(Events.Pan, (event) => events.push(event))
    p.on_event(Events.PanEnd, (event) => events.push(event))

    const {view} = await display(p)
    await actions(view).tap(xy(5, 5))

    expect(events.map((ev) => ev.event_name)).to.be.equal(["tap"])
  })

  it("should support doubletap gesture", async () => {
    const p = plot()

    const events: PointEvent[] = []
    p.on_event(Events.Tap, (event) => events.push(event))
    p.on_event(Events.DoubleTap, (event) => events.push(event))
    p.on_event(Events.Press, (event) => events.push(event))
    p.on_event(Events.PressUp, (event) => events.push(event))
    p.on_event(Events.PanStart, (event) => events.push(event))
    p.on_event(Events.Pan, (event) => events.push(event))
    p.on_event(Events.PanEnd, (event) => events.push(event))

    const {view} = await display(p)
    await actions(view).double_tap(xy(5, 5))

    expect(events.map((ev) => ev.event_name)).to.be.equal(["tap", "doubletap"])
  })

  it("should support press gesture", async () => {
    const p = plot()

    const events: PointEvent[] = []
    p.on_event(Events.Tap, (event) => events.push(event))
    p.on_event(Events.DoubleTap, (event) => events.push(event))
    p.on_event(Events.Press, (event) => events.push(event))
    p.on_event(Events.PressUp, (event) => events.push(event))
    p.on_event(Events.PanStart, (event) => events.push(event))
    p.on_event(Events.Pan, (event) => events.push(event))
    p.on_event(Events.PanEnd, (event) => events.push(event))

    const {view} = await display(p)
    await actions(view).press(xy(5, 5))

    expect(events.map((ev) => ev.event_name)).to.be.equal(["press", "pressup"])
  })

  it("should support pan gesture", async () => {
    const p = plot()

    const events: PointEvent[] = []
    p.on_event(Events.Tap, (event) => events.push(event))
    p.on_event(Events.DoubleTap, (event) => events.push(event))
    p.on_event(Events.Press, (event) => events.push(event))
    p.on_event(Events.PressUp, (event) => events.push(event))
    p.on_event(Events.PanStart, (event) => events.push(event))
    p.on_event(Events.Pan, (event) => events.push(event))
    p.on_event(Events.PanEnd, (event) => events.push(event))

    const {view} = await display(p)
    await actions(view).pan(xy(4, 4), xy(6, 6), 3)

    expect(events.map((ev) => ev.event_name)).to.be.equal(["panstart", "pan", "pan", "panend"])
  })
})

describe("ui_event_bus module", () => {

  async function new_plot(): Promise<PlotView> {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    const {view} = await display(plot)
    return view
  }

  let plot_view: PlotView
  let ui_event_bus: UIEventBus

  before_each(async () => {
    plot_view = await new_plot()
    ui_event_bus = plot_view.canvas_view.ui_event_bus
  })

  describe("_trigger method", () => {
    let spy_trigger: sinon.SinonSpy

    before_each(() => {
      spy_trigger = sinon.spy(ui_event_bus, "trigger")
    })

    after_each(() => {
      spy_trigger.restore()
    })

    describe("base_type=move", () => {
      let e: UIEvent
      let spy_cursor: sinon.SinonSpy

      before_each(() => {
        e = {type: "move", sx: 0, sy: 0, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointermove")}
        spy_cursor = sinon.spy(ui_event_bus, "set_cursor")
      })

      after_each(() => {
        spy_cursor.restore()
      })

      it("should trigger move event for active inspectors", async () => {
        const inspector = new CrosshairTool({active: true})
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        ui_event_bus._trigger(ui_event_bus.move, e)

        expect(spy_trigger.calledTwice).to.be.true
        expect(spy_trigger.args[1]).to.be.equal([ui_event_bus.move, e, inspector])
      })

      it("should not trigger move event for inactive inspectors", async () => {
        const inspector = new CrosshairTool({active: false})
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        ui_event_bus._trigger(ui_event_bus.move, e)
        expect(spy_trigger.notCalled).to.be.true
        expect(ui_event_bus.hit_area.style.cursor).to.be.equal("default")
      })

      it("should use default cursor no active inspector", () => {
        ui_event_bus._trigger(ui_event_bus.move, e)
        expect(spy_cursor.called).to.be.true
        expect(ui_event_bus.hit_area.style.cursor).to.be.equal("default")
      })

      it("should use default cursor if active inspector but mouse is off-frame", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        using stub = restorable(sinon.stub(ui_event_bus, "hit_test_frame"))
        stub.returns(false)

        ui_event_bus._trigger(ui_event_bus.move, e)
        expect(spy_cursor.called).to.be.true
        expect(ui_event_bus.hit_area.style.cursor).to.be.equal("default")
      })

      it("should change cursor if active inspector is present and over frame", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        using stub = restorable(sinon.stub(ui_event_bus, "hit_test_frame"))
        stub.returns(true)

        ui_event_bus._trigger(ui_event_bus.move, e)
        expect(spy_cursor.called).to.be.true
        expect(ui_event_bus.hit_area.style.cursor).to.be.equal("crosshair")
      })

      /*
      it("should change cursor on view_renderer with cursor method", async () => {
        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_event_bus, "hit_test_renderers").returns(legend_view)

        ui_event_bus._trigger(ui_event_bus.move, e, new Event("mousemove"))
        expect(spy_cursor.calledTwice).to.be.true
        expect(spy_cursor.calledWith("pointer")).to.be.true

        ss.restore()
      })

      it("should override event_type if active inspector clashes with view renderer", async () => {
        const inspector = new CrosshairTool()
        plot_view.model.add_tools(inspector)
        await plot_view.ready

        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_event_bus, "hit_test_renderers").returns(legend_view)

        ui_event_bus._trigger(ui_event_bus.move, e, new Event("mousemove"))
        expect(spy_trigger.calledTwice).to.be.true
        expect(spy_trigger.args[1]).to.be.equal([ui_event_bus.move_exit, e, inspector])
        // should also use view renderer cursor and not inspector cursor
        expect(spy_cursor.calledTwice).to.be.true
        expect(spy_cursor.calledWith("pointer")).to.be.true

        ss.restore()
      })
      */
    })

    describe("base_type=tap", () => {
      let e: UIEvent
      before_each(() => {
        e = {type: "tap", sx: 10, sy: 15, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointerup")}
      })

      it("should not trigger tap event if no active tap tool", () => {
        ui_event_bus._trigger(ui_event_bus.tap, e)
        expect(spy_trigger.notCalled).to.be.true
      })

      it("should trigger tap event if exists an active tap tool", async () => {
        const gesture = new TapTool()
        plot_view.model.add_tools(gesture)
        await plot_view.ready

        ui_event_bus._trigger(ui_event_bus.tap, e)

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_event_bus.tap, e, gesture])
      })

      /*
      it("should call on_hit method on view renderer if exists", async () => {
        const legend = new Legend({click_policy: "mute"})
        const legend_view = await build_view(legend, {parent: plot_view})

        const ss = sinon.stub(ui_event_bus, "hit_test_renderers").returns(legend_view)
        const on_hit = sinon.stub(legend_view, "on_hit")

        ui_event_bus._trigger(ui_event_bus.tap, e, new Event("mousemove"))
        expect(on_hit.calledOnce).to.be.true
        expect(on_hit.args[0]).to.be.equal([10, 15])

        on_hit.restore()
        ss.restore()
      })
      */
    })

    describe("base_type=scroll", () => {
      let e: UIEvent
      let preventDefault: sinon.SinonSpy
      let stopPropagation: sinon.SinonSpy

      before_each(() => {
        e = {type: "wheel", sx: 0, sy: 0, delta: 1, modifiers: {ctrl: false, shift: false, alt: false}, native: new WheelEvent("wheel")}

        preventDefault = sinon.spy(e.native, "preventDefault")
        stopPropagation = sinon.spy(e.native, "stopPropagation")
      })

      after_each(() => {
        preventDefault.restore()
        stopPropagation.restore()
      })

      it("should not trigger scroll event if no active scroll tool", () => {
        plot_view.model.toolbar.gestures.scroll.active = null
        ui_event_bus._trigger(ui_event_bus.scroll, e)
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

        ui_event_bus._trigger(ui_event_bus.scroll, e)

        // assert that default scrolling is disabled
        expect(preventDefault.calledOnce).to.be.true
        expect(stopPropagation.calledOnce).to.be.true

        expect(spy_trigger.calledOnce).to.be.true
        expect(spy_trigger.args[0]).to.be.equal([ui_event_bus.scroll, e, gesture])
      })
    })

    describe("normally propagate other gesture base_types", () => {
      let e: UIEvent
      before_each(() => {
        e = {type: "pan_start", sx: 0, sy: 0, dx: 0, dy: 0, modifiers: {ctrl: false, shift: false, alt: false}, native: new PointerEvent("pointerdown")} // ??? pointermove
      })

      it("should not trigger event if no active tool", () => {
        ui_event_bus._trigger(ui_event_bus.pan_start, e)
        expect(spy_trigger.notCalled).to.be.true
      })

      it("should trigger event if exists an active related tool", async () => {
        const gesture = new PanTool()
        plot_view.model.add_tools(gesture)
        await plot_view.ready

        ui_event_bus._trigger(ui_event_bus.pan_start, e)

        expect(spy_trigger.callCount).to.be.equal(1)
        expect(spy_trigger.args[0]).to.be.equal([ui_event_bus.pan_start, e, gesture])
      })
    })
  })

  describe("_event methods", () => {
    // These tests are mildly integration tests. Based on an Event (as would be
    // initiated by event listeners attached in the _register_tool method), they
    // check whether the BokehEvent and UIEventBus are correctly triggered.

    let dom_stub: sinon.SinonStub
    let spy_plot: sinon.SinonSpy
    let spy_uievent: sinon.SinonSpy

    before_each(() => {
      dom_stub = sinon.stub(dom, "offset_bbox").returns(new BBox({top: 0, left: 0, width: 600, height: 660}))
      // The BokehEvent that is triggered by the plot
      spy_plot = sinon.spy(plot_view.model, "trigger_event")
      // The event is that triggered on UIEvent for tool interactions
      spy_uievent = sinon.spy(ui_event_bus, "trigger")
    })

    after_each(() => {
      dom_stub.restore()
      spy_plot.restore()
      spy_uievent.restore()
    })

    /*
    it("_tap method should handle tap event", async () => {
      const e: any = new Event("tap") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, ...dummy_methods}

      plot_view.model.add_tools(new TapTool())
      await plot_view.ready

      ui_event_bus._tap(e)

      expect(spy_plot.callCount).to.be.equal(2) // tap event and selection event
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_press method should handle press event", () => {
      const e: any = new Event("press") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, ...dummy_methods}

      ui_event_bus._press(e)

      expect(spy_plot.calledOnce).to.be.true
      // There isn't a tool that uses the _press method
      // expect(spy_uievent.calledOnce).to.be.true
    })

    it("_pressup method should handle pressup event", () => {
      const e: any = new Event("pressup") // XXX: not a hammerjs event
      e.pointerType = "mouse"
      e.srcEvent = {pageX: 100, pageY: 200, ...dummy_methods}

      ui_event_bus._pressup(e)

      expect(spy_plot.calledOnce).to.be.true
    })

    it("_pan_start method should handle panstart event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "panstart",
        deltaX: 0,
        deltaY: 0,
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ui_event_bus._pan_start(e)

      expect(spy_plot.callCount).to.be.equal(2) // lod_start and pan_start events
      expect(spy_uievent.callCount).to.be.equal(1)
    })

    it("_pan method should handle pan event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "pan",
        deltaX: 0,
        deltaY: 0,
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ui_event_bus._pan_start({...e, type: "panstart"})
      ui_event_bus._pan(e)

      expect(spy_plot.callCount).to.be.equal(3) // lod_start, pan_start and pan events
      expect(spy_uievent.callCount).to.be.equal(2)
    })

    it("_pan_end method should handle pan end event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "pan_end",
        deltaX: 0,
        deltaY: 0,
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const pan_tool = new PanTool()
      plot_view.model.add_tools(pan_tool)
      await plot_view.ready

      ui_event_bus._pan_start({...e, type: "panstart"})
      ui_event_bus._pan_end(e)

      expect(spy_plot.callCount).to.be.equal(4) // lod_start, pan_start, ranges_update and pan_end events
      expect(spy_uievent.callCount).to.be.equal(2)
    })

    it("_pinch_start method should handle pinch_start event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "pinch_start",
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ui_event_bus._pinch_start(e)

      expect(spy_plot.callCount).to.be.equal(1)
      // wheelzoomtool doesn't have _pinch_start but will emit event anyway
      expect(spy_uievent.callCount).to.be.equal(1)
    })

    it("_pinch method should handle pinch event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "pinch",
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ui_event_bus._pinch_start({...e, type: "pinch_start"})
      ui_event_bus._pinch(e)

      expect(spy_plot.callCount).to.be.equal(3) // pinch_start, lod_start, pinch
      expect(spy_uievent.callCount).to.be.equal(2)
    })

    it("_pinch_end method should handle pinch_end event", async () => {
      const e: any = { // XXX: not a hammerjs event
        type: "pinch_end",
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.pinch.active = wheel_zoom_tool

      ui_event_bus._pinch_start({...e, type: "pinch_start"})
      ui_event_bus._pinch_end(e)

      expect(spy_plot.callCount).to.be.equal(2)
      // wheelzoomtool doesn't have _pinch_start but will emit event anyway
      expect(spy_uievent.callCount).to.be.equal(2)
    })

    it("_move_enter method should handle pointerenter event", async () => {
      const e = new PointerEvent("pointerenter")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ui_event_bus._enter(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_move method should handle pointermove event", async () => {
      const e = new PointerEvent("pointermove")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ui_event_bus._move(e)

      expect(spy_plot.callCount).to.be.equal(2)
      expect(spy_uievent.callCount).to.be.equal(2)
    })

    it("_move_exit method should handle pointerleave event", async () => {
      const e = new PointerEvent("pointerleave")

      const crosshair_tool = new CrosshairTool()
      plot_view.model.add_tools(crosshair_tool)
      await plot_view.ready

      ui_event_bus._exit(e)

      expect(spy_plot.calledOnce).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_mouse_wheel method should handle wheel event", async () => {
      const e = new WheelEvent("wheel")

      const wheel_zoom_tool = new WheelZoomTool()
      plot_view.model.add_tools(wheel_zoom_tool)
      await plot_view.ready

      //idk why it's not auto active
      plot_view.model.toolbar.gestures.scroll.active = wheel_zoom_tool

      ui_event_bus._mouse_wheel(e)

      expect(spy_plot.called).to.be.true
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("_key_up method should handle keyup event", async () => {
      const e = new KeyboardEvent("keyup")

      const poly_select_tool = new PolySelectTool()
      plot_view.model.add_tools(poly_select_tool)
      await plot_view.ready

      ui_event_bus._key_up(e)

      // There isn't a BokehEvent model for keydown events
      // expect(spy_plot.calledOnce).to.be.true
      // This is a event on select tools that should probably be removed
      expect(spy_uievent.calledOnce).to.be.true
    })

    it("multi-gesture tool should receive multiple events", async () => {
      class MultiToolView extends GestureToolView {
        override _tap(_e: TapEvent): void {}
        override _pan_start(_e: PanEvent): void {}
      }

      class MultiTool extends GestureTool {
        override default_view = MultiToolView
        override tool_name = "Multi Tool"
        override event_type = ["tap" as "tap", "pan" as "pan"]
        override default_order = 10
      }

      const tool = new MultiTool()
      plot_view.model.add_tools(tool)
      tool.active = true
      await plot_view.ready

      const etap: any = { // XXX: not a hammerjs event
        type: "tap",
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }

      ui_event_bus._tap(etap)
      expect(spy_uievent.calledOnce).to.be.true

      const epan: any = { // XXX: not a hammerjs event
        type: "pan_start",
        deltaX: 0,
        deltaY: 0,
        srcEvent: {pageX: 100, pageY: 200, ...dummy_methods},
      }
      ui_event_bus._pan_start(epan)
      expect(spy_uievent.calledTwice).to.be.true
    })
    */
  })
})
