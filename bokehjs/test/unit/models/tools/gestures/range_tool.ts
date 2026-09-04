import {expect} from "#framework/assertions"

import {RangeTool} from "@bokehjs/models/tools/gestures/range_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Node} from "@bokehjs/models/coordinates/node"

describe("range_tool module", () => {
  const source = {start: 0, end: 10}

  describe("RangeTool", () => {

    describe("construction", () => {
      const x_range = Range1d.create(source)
      const y_range = Range1d.create(source)

      it("should configure overlay", () => {
        const rt0 = RangeTool.create()
        expect(rt0.overlay.editable).to.be.true
        expect(rt0.overlay.movable).to.be.equal("none")
        expect(rt0.overlay.resizable).to.be.equal("none")

        const rt1 = RangeTool.create({x_range})
        expect(rt1.overlay.editable).to.be.true
        expect(rt1.overlay.movable).to.be.equal("x")
        expect(rt1.overlay.resizable).to.be.equal("x")

        const rt2 = RangeTool.create({x_range, x_interaction: false})
        expect(rt2.overlay.editable).to.be.true
        expect(rt2.overlay.movable).to.be.equal("none")
        expect(rt2.overlay.resizable).to.be.equal("none")

        const rt3 = RangeTool.create({y_range})
        expect(rt3.overlay.editable).to.be.true
        expect(rt3.overlay.movable).to.be.equal("y")
        expect(rt3.overlay.resizable).to.be.equal("y")

        const rt4 = RangeTool.create({y_range, y_interaction: false})
        expect(rt4.overlay.editable).to.be.true
        expect(rt4.overlay.movable).to.be.equal("none")
        expect(rt4.overlay.resizable).to.be.equal("none")

        const rt5 = RangeTool.create({x_range, y_range})
        expect(rt5.overlay.editable).to.be.true
        expect(rt5.overlay.movable).to.be.equal("both")
        expect(rt5.overlay.resizable).to.be.equal("all")
      })
    })

    describe("update_overlay_from_ranges", () => {
      const x_range = Range1d.create(source)
      const y_range = Range1d.create(source)

      it("should set overlay coords to null if no ranges are set", () => {
        const rt = RangeTool.create()
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.structurally.equal(Node.frame.left)
        expect(rt.overlay.right).to.be.structurally.equal(Node.frame.right)
        expect(rt.overlay.top).to.be.structurally.equal(Node.frame.top)
        expect(rt.overlay.bottom).to.be.structurally.equal(Node.frame.bottom)
      })

      it("should set top/bottom overlay coords to null if y range is null", () => {
        const rt = RangeTool.create({x_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.equal(0)
        expect(rt.overlay.right).to.be.equal(10)
        expect(rt.overlay.top).to.be.structurally.equal(Node.frame.top)
        expect(rt.overlay.bottom).to.be.structurally.equal(Node.frame.bottom)
      })

      it("should set left/right overlay coords to null if x range is null", () => {
        const rt = RangeTool.create({y_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.structurally.equal(Node.frame.left)
        expect(rt.overlay.right).to.be.structurally.equal(Node.frame.right)
        expect(rt.overlay.top).to.be.equal(10)
        expect(rt.overlay.bottom).to.be.equal(0)
      })
    })
  })
})
