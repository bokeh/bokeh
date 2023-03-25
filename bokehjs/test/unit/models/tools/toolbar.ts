import {expect} from "assertions"
import {fig, display} from "../../_util"

import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {ToolbarPanelView} from "@bokehjs/models/annotations/toolbar_panel"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {SelectTool} from "@bokehjs/models/tools/gestures/select_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"
import {build_view} from "@bokehjs/core/build_views"
import {gridplot} from "@bokehjs/api/gridplot"

describe("Toolbar", () => {

  describe("_active_change method", () => {
    let pan_1: PanTool
    let pan_2: PanTool
    let toolbar: Toolbar

    before_each(() => {
      // by default these tools are inactive
      pan_1 = new PanTool()
      pan_2 = new PanTool()
      toolbar = new Toolbar()
      toolbar.gestures.pan.tools = [new PanTool(), new PanTool()]
    })

    it("should correctly activate tool with currently active tool", () => {
      pan_1.active = true
      toolbar._active_change(pan_1)
      expect(pan_1.active).to.be.true
      expect(pan_2.active).to.be.false
      expect(toolbar.gestures.pan.active).to.be.equal(pan_1)
    })

    it("should correctly deactivate tool", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar._active_change(pan_1)
      // now deactivate the tool
      pan_1.active = false
      toolbar._active_change(pan_1)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.false
      expect(toolbar.gestures.pan.active).to.be.null
    })

    it("should correctly active tool and deactive currently active one", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar._active_change(pan_1)
      // now activate the other tool
      pan_2.active = true
      toolbar._active_change(pan_2)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.true
      expect(toolbar.gestures.pan.active).to.be.equal(pan_2)
    })
  })

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

      const gp = gridplot([[p0, p1]], {toolbar_location: "above"})
      gp.toolbar.autohide = true

      const {view} = await display(gp)
      const tbv = view.toolbar_view

      expect(tbv.visible).to.be.false
      expect(tbv.el.classList.contains("bk-hidden")).to.be.true

      const ev0 = new MouseEvent("mouseenter", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev0)

      expect(tbv.visible).to.be.true
      expect(tbv.el.classList.contains("bk-hidden")).to.be.false

      const ev1 = new MouseEvent("mouseleave", {clientX: 0, clientY: 0})
      view.el.dispatchEvent(ev1)

      expect(tbv.visible).to.be.false
      expect(tbv.el.classList.contains("bk-hidden")).to.be.true
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

describe("ToolbarView", () => {

  describe("visible getter", () => {
    it("should be true if autohide is false and _visible isn't set", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is true", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be true if autohide is false and _visible is false", async () => {
      const tb = new Toolbar()
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.false
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible isn't set", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })

    it("should be true if autohide is true and _visible is true", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(true)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.true
    })

    it("should be false if autohide is true and _visible is false", async () => {
      const tb = new Toolbar({autohide: true})
      const tbv = await build_view(tb, {parent: null})
      tbv.set_visibility(false)
      expect(tbv.model.autohide).to.be.true
      expect(tbv.visible).to.be.false
    })
  })
})

class MultiTool extends SelectTool {
  override tool_name = "Multi Tool"
  override event_type = ["tap" as "tap", "pan" as "pan"]
  override default_order = 10
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
