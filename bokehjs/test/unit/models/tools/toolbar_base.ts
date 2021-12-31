import {expect} from "assertions"

import {ToolbarBase} from "@bokehjs/models/tools/toolbar_base"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {build_view} from "@bokehjs/core/build_views"

describe("ToolbarBase", () => {

  describe("_active_change method", () => {
    let pan_1: PanTool
    let pan_2: PanTool
    let toolbar_base: ToolbarBase

    before_each(() => {
      // by default these tools are inactive
      pan_1 = new PanTool()
      pan_2 = new PanTool()
      toolbar_base = new ToolbarBase()
      toolbar_base.gestures.pan.tools = [new PanTool(), new PanTool()]
    })

    it("should correctly activate tool with currently active tool", () => {
      pan_1.active = true
      toolbar_base._active_change(pan_1)
      expect(pan_1.active).to.be.true
      expect(pan_2.active).to.be.false
      expect(toolbar_base.gestures.pan.active).to.be.equal(pan_1)
    })

    it("should correctly deactivate tool", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar_base._active_change(pan_1)
      // now deactivate the tool
      pan_1.active = false
      toolbar_base._active_change(pan_1)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.false
      expect(toolbar_base.gestures.pan.active).to.be.null
    })

    it("should correctly active tool and deactive currently active one", () => {
      // activate the tool as setup
      pan_1.active = true
      toolbar_base._active_change(pan_1)
      // now activate the other tool
      pan_2.active = true
      toolbar_base._active_change(pan_2)
      expect(pan_1.active).to.be.false
      expect(pan_2.active).to.be.true
      expect(toolbar_base.gestures.pan.active).to.be.equal(pan_2)
    })
  })
})

describe("ToolbarBaseView", () => {

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
