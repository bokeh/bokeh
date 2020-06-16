import {expect} from "assertions"

import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {HoverTool} from "@bokehjs/models/tools/inspectors/hover_tool"
import {SelectTool, SelectToolView} from "@bokehjs/models/tools/gestures/select_tool"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {TapTool} from "@bokehjs/models/tools/gestures/tap_tool"

describe("Toolbar", () => {

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
      const toolbar = new Toolbar({tools:[hover_1, hover_2, hover_3]})
      expect(toolbar.inspectors).to.be.equal([hover_1, hover_2, hover_3])
    })

    it("should have all inspect tools active when active_inspect='auto'", () => {
      new Toolbar({tools:[hover_1, hover_2, hover_3], active_inspect: 'auto'})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.true
    })

    it("should have arg inspect tool active when active_inspect=tool instance", () => {
      new Toolbar({tools:[hover_1, hover_2, hover_3], active_inspect: hover_1})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })

    it("should have args inspect tools active when active_inspect=Array(tools)", () => {
      new Toolbar({tools:[hover_1, hover_2, hover_3], active_inspect: [hover_1, hover_2]})
      expect(hover_1.active).to.be.true
      expect(hover_2.active).to.be.true
      expect(hover_3.active).to.be.false
    })

    it("should have none inspect tools active when active_inspect=null)", () => {
      new Toolbar({tools:[hover_1, hover_2, hover_3], active_inspect: null})
      expect(hover_1.active).to.be.false
      expect(hover_2.active).to.be.false
      expect(hover_3.active).to.be.false
    })
  })
})

class MultiToolView extends SelectToolView {}

class MultiTool extends SelectTool {
  default_view = MultiToolView
  tool_name = "Multi Tool"
  event_type = ["tap" as "tap", "pan" as "pan"]
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
      new Toolbar({tools:[multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
    })

    it("should have multi active if active_tap", () => {
      new Toolbar({tools:[multi, tap, pan], active_tap: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have gestures inactive after toggling multi active", () => {
      new Toolbar({tools:[multi, tap, pan]})
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
      expect(tap.active).to.be.true
      multi.active = true
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      expect(tap.active).to.be.false
    })

    it("should have multi inactive after toggling tap active", () => {
      new Toolbar({tools:[multi, tap], active_tap: multi})
      expect(multi.active).to.be.true
      expect(tap.active).to.be.false
      tap.active = true
      expect(multi.active).to.be.false
      expect(tap.active).to.be.true
    })

    it("should have multi inactive after toggling pan active", () => {
      new Toolbar({tools:[multi, pan], active_drag: multi})
      expect(multi.active).to.be.true
      expect(pan.active).to.be.false
      pan.active = true
      expect(multi.active).to.be.false
      expect(pan.active).to.be.true
    })
  })
})
