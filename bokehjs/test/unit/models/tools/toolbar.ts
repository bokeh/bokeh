import {expect} from "assertions"
import {fig, display} from "../../_util"

import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {ToolbarPanelView} from "@bokehjs/models/annotations/toolbar_panel"
import {ToolbarBox, ToolbarBoxView} from "@bokehjs/models/tools/toolbar_box"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {SelectTool, SelectToolView} from "@bokehjs/models/tools/gestures/select_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {Column} from "@bokehjs/models"
import {gridplot} from "@bokehjs/api/gridplot"

describe("Toolbar", () => {

  describe("should support autohide=true", () => {
    it("in single plots", async () => {
      const p = fig([200, 200], {toolbar_location: "right"})
      p.toolbar.autohide = true
      p.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})

      const {view} = await display(p)
      const tpv = [...view.renderer_views.values()].find((rv): rv is ToolbarPanelView => rv instanceof ToolbarPanelView)!

      expect(tpv.toolbar_view.visible).to.be.false
      expect(tpv.toolbar_view.el.classList.contains("bk-hidden")).to.be.true

      const ev0 = new MouseEvent("mouseenter", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev0)

      expect(tpv.toolbar_view.visible).to.be.true
      expect(tpv.toolbar_view.el.classList.contains("bk-hidden")).to.be.false

      const ev1 = new MouseEvent("mouseleave", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev1)

      expect(tpv.toolbar_view.visible).to.be.false
      expect(tpv.toolbar_view.el.classList.contains("bk-hidden")).to.be.true
    })

    it("in grid plots", async () => {
      const p0 = fig([200, 200])
      p0.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})
      const p1 = fig([200, 200])
      p1.rect({x: [0, 1], y: [0, 1], width: 1, height: 1, color: ["red", "blue"]})

      const gp = gridplot([[p0, p1]], {toolbar_location: "above"}) as Column
      const tb = gp.children[0] as ToolbarBox
      tb.toolbar.autohide = true

      const {view} = await display(gp)
      const tbv = view.child_views[0] as ToolbarBoxView

      expect(tbv.toolbar_view.visible).to.be.false
      expect(tbv.toolbar_view.el.classList.contains("bk-hidden")).to.be.true

      const ev0 = new MouseEvent("mouseenter", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev0)

      expect(tbv.toolbar_view.visible).to.be.true
      expect(tbv.toolbar_view.el.classList.contains("bk-hidden")).to.be.false

      const ev1 = new MouseEvent("mouseleave", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev1)

      expect(tbv.toolbar_view.visible).to.be.false
      expect(tbv.toolbar_view.el.classList.contains("bk-hidden")).to.be.true
    })
  })

  describe("_init_tools method", () => {
    let hover_1: HoverTool
    let hover_2: HoverTool
    let hover_3: HoverTool

    before_each(() => {
      hover_1 = new HoverTool()
      hover_2 = new HoverTool()
      hover_3 = new HoverTool()
    })

    it("should set inspect tools as array on Toolbar.inspector property", () => {
      const toolbar = new Toolbar({tools: [hover_1, hover_2, hover_3]})
      expect(toolbar.inspectors).to.be.equal([hover_1, hover_2, hover_3])
    })

    it("should have all inspect tools active when active_inspect='auto'", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: "auto"})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.true
    })

    it("should have arg inspect tool active when active_inspect=tool instance", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: hover_1})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })

    it("should have args inspect tools active when active_inspect=Array(tools)", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: [hover_1, hover_2]})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.false
    })

    it("should have none inspect tools active when active_inspect=null)", () => {
      new Toolbar({tools: [hover_1, hover_2, hover_3], active_inspect: null})
      expect(hover_1.active).to.be.false
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })
  })
})

class MultiToolView extends SelectToolView {}

class MultiTool extends SelectTool {
  override default_view = MultiToolView
  override tool_name = "Multi Tool"
  override event_type = ["tap" as "tap", "pan" as "pan"]
}

describe("Toolbar Multi Gesture Tool", () => {

  describe("_init_tools method", () => {
    let multi: MultiTool
    let pan: PanTool
    let tap: TapTool

    before_each(() => {
      multi = new MultiTool()
      pan = new PanTool()
      tap = new TapTool()
    })

    it("should have multi inactive after initialization", () => {
      new Toolbar({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
    })

    it("should have multi active if active_tap", () => {
      new Toolbar({tools: [multi, tap, pan], active_tap: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have gestures inactive after toggling multi active", () => {
      new Toolbar({tools: [multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
      multi.active = true
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have multi inactive after toggling tap active", () => {
      new Toolbar({tools: [multi, tap], active_tap: multi})
      expect(multi.active).to.be.true
      expect(tap.active).to.be.false
      tap.active = true
      expect(multi.active).to.be.false
      expect(tap.active).to.be.true
    })

    it("should have multi inactive after toggling pan active", () => {
      new Toolbar({tools: [multi, pan], active_drag: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      pan.active = true
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
    })
  })
})
