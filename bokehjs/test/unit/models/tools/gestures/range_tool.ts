import {expect} from "assertions"

import {RangeTool} from "@bokehjs/models/tools/gestures/range_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("range_tool module", () => {
  const source = {start: 0, end: 10}

  describe("RangeTool", () => {

    describe("construction", () => {
      const x_range = new Range1d(source)
      const y_range = new Range1d(source)

      it("should configure overlay", () => {
        const rt0 = new RangeTool()
        expect(rt0.overlay.editable).to.be.true
        expect(rt0.overlay.movable).to.be.equal("none")
        expect(rt0.overlay.resizable).to.be.equal("none")

        const rt1 = new RangeTool({x_range})
        expect(rt1.overlay.editable).to.be.true
        expect(rt1.overlay.movable).to.be.equal("x")
        expect(rt1.overlay.resizable).to.be.equal("x")

        const rt2 = new RangeTool({x_range, x_interaction: false})
        expect(rt2.overlay.editable).to.be.true
        expect(rt2.overlay.movable).to.be.equal("none")
        expect(rt2.overlay.resizable).to.be.equal("none")

        const rt3 = new RangeTool({y_range})
        expect(rt3.overlay.editable).to.be.true
        expect(rt3.overlay.movable).to.be.equal("y")
        expect(rt3.overlay.resizable).to.be.equal("y")

        const rt4 = new RangeTool({y_range, y_interaction: false})
        expect(rt4.overlay.editable).to.be.true
        expect(rt4.overlay.movable).to.be.equal("none")
        expect(rt4.overlay.resizable).to.be.equal("none")

        const rt5 = new RangeTool({x_range, y_range})
        expect(rt5.overlay.editable).to.be.true
        expect(rt5.overlay.movable).to.be.equal("both")
        expect(rt5.overlay.resizable).to.be.equal("all")
      })
    })

    describe("update_overlay_from_ranges", () => {
      const x_range = new Range1d(source)
      const y_range = new Range1d(source)

      it("should set overlay coords to null if no ranges are set", () => {
        const rt = new RangeTool()
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.null
        expect(rt.overlay.right).to.be.null
        expect(rt.overlay.top).to.be.null
        expect(rt.overlay.bottom).to.be.null
      })

      it("should set top/bottom overlay coords to null if y range is null", () => {
        const rt = new RangeTool({x_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.not.be.null
        expect(rt.overlay.right).to.not.be.null
        expect(rt.overlay.top).to.be.null
        expect(rt.overlay.bottom).to.be.null
      })

      it("should set left/right overlay coords to null if x range is null", () => {
        const rt = new RangeTool({y_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.null
        expect(rt.overlay.right).to.be.null
        expect(rt.overlay.top).to.not.be.null
        expect(rt.overlay.bottom).to.not.be.null
      })
    })
  })
})
