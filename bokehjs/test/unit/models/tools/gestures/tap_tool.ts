import {expect} from "assertions"
import {display} from "../../../_util"

import type {Tool} from "@bokehjs/models/tools/tool"
import type {TapToolCallback} from "@bokehjs/models/tools/gestures/tap_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {GlyphRenderer} from "@bokehjs/models/renderers"
import {ColumnDataSource} from "@bokehjs/models/sources"
import {Quad} from "@bokehjs/models/glyphs"
import type {TapEvent, KeyModifiers} from "@bokehjs/core/ui_events"

describe("TapTool", () => {
  async function test_case(tool: Tool): Promise<PlotView> {
    const plot = new Plot({
      x_range: new Range1d({start: -1, end: 1}),
      y_range: new Range1d({start: -1, end: 1}),
      width: 200,
      height: 200,
      min_border: 0,
      title: null,
      toolbar_location: null,
    })
    const data_source = new ColumnDataSource()
    const glyph = new Quad({left: -1, right: 0, bottom: 0, top: 1})
    const renderer = new GlyphRenderer({glyph, data_source})
    plot.add_renderers(renderer)
    plot.add_tools(tool)
    const {view} = await display(plot)
    return view
  }

  function tap(plot_view: PlotView, sx: number, sy: number,
      modifiers: KeyModifiers = {ctrl: false, shift: false, alt: false}) {
    const event: TapEvent = {type: "tap", sx, sy, modifiers, native: new PointerEvent("pointerup")}
    const {ui_event_bus} = plot_view.canvas_view
    ui_event_bus._trigger(ui_event_bus.tap, event)
  }

  function doubletap(plot_view: PlotView, sx: number, sy: number,
      modifiers: KeyModifiers = {ctrl: false, shift: false, alt: false}) {
    const event: TapEvent = {type: "tap", sx, sy, modifiers, native: new PointerEvent("pointerup")}
    const {ui_event_bus} = plot_view.canvas_view
    ui_event_bus._trigger(ui_event_bus.doubletap, event)
  }

  describe("should support 'tap' gesture", () => {
    it("and trigger on 'tap' event", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "tap", callback})
      const plot_view = await test_case(tool)

      tap(plot_view, 50, 50)
      expect(called).to.be.true
    })

    it("and not trigger on 'tap' event when didn't hit a glyph", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "tap", callback})
      const plot_view = await test_case(tool)

      tap(plot_view, 150, 50)
      expect(called).to.be.false
    })

    it("and not trigger on 'doubletap' event", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "tap", callback})
      const plot_view = await test_case(tool)

      doubletap(plot_view, 50, 50)
      expect(called).to.be.false
    })

    it("and allow setting key modifiers", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "inspect", gesture: "tap", modifiers: {shift: true, alt: true}, callback})
      const plot_view = await test_case(tool)

      tap(plot_view, 50, 50)
      expect(called).to.be.false

      tap(plot_view, 50, 50, {shift: true, ctrl: false, alt: true})
      expect(called).to.be.true
    })

    it("and report key modifiers in a callback", async () => {
      let modifiers: Partial<KeyModifiers> | undefined
      const callback: TapToolCallback = {
        execute(_, {event}) {
          modifiers = event.modifiers
        },
      }
      const tool = new TapTool({behavior: "inspect", gesture: "tap", callback})
      const plot_view = await test_case(tool)

      tap(plot_view, 50, 50)
      expect(modifiers).to.be.equal({shift: false, ctrl: false, alt: false})

      tap(plot_view, 50, 50, {shift: true, ctrl: false, alt: false})
      expect(modifiers).to.be.equal({shift: true, ctrl: false, alt: false})

      tap(plot_view, 50, 50, {shift: true, ctrl: false, alt: true})
      expect(modifiers).to.be.equal({shift: true, ctrl: false, alt: true})
    })
  })

  describe("should support 'doubletap' gesture", () => {
    it("and not trigger on 'tap' event", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "doubletap", callback})
      const plot_view = await test_case(tool)

      tap(plot_view, 50, 50)
      expect(called).to.be.false
    })

    it("and trigger on 'doubletap' event", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "doubletap", callback})
      const plot_view = await test_case(tool)

      doubletap(plot_view, 50, 50)
      expect(called).to.be.true
    })

    it("and not trigger on 'doubletap' event when didn't hit a glyph", async () => {
      let called = false
      const callback: TapToolCallback = () => called = true
      const tool = new TapTool({behavior: "select", gesture: "doubletap", callback})
      const plot_view = await test_case(tool)

      doubletap(plot_view, 150, 50)
      expect(called).to.be.false
    })
  })
})
