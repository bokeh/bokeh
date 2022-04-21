import {expect} from "assertions"

import {RangeTool} from "@bokehjs/models/tools/gestures/range_tool"
import {Directions, Edges} from "@bokehjs/models/annotations/box_annotation"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("range_tool module", () => {
  const source = {start: 0, end: 10}

  describe("RangeTool", () => {

    describe("construction", () => {
      const x_range = new Range1d(source)
      const y_range = new Range1d(source)

      it("should not set overlay movable and resizable", () => {
        const rt0 = new RangeTool()
        expect(rt0.overlay.movable).to.be.equal(Directions.None)
        expect(rt0.overlay.resizable).to.be.equal(Edges.None)
      })

      it("should set overlay movable and resizable when using x_range", () => {
        const rt0 = new RangeTool({x_range})
        expect(rt0.overlay.movable).to.be.equal(Directions.X)
        expect(rt0.overlay.resizable).to.be.equal(Edges.X)

        const rt1 = new RangeTool({x_range, x_interaction: false})
        expect(rt1.overlay.movable).to.be.equal(Directions.None)
        expect(rt1.overlay.resizable).to.be.equal(Edges.None)
      })

      it("should set overlay movable and resizable when using y_range", () => {
        const rt0 = new RangeTool({y_range})
        expect(rt0.overlay.movable).to.be.equal(Directions.Y)
        expect(rt0.overlay.resizable).to.be.equal(Edges.Y)

        const rt1 = new RangeTool({y_range, y_interaction: false})
        expect(rt1.overlay.movable).to.be.equal(Directions.None)
        expect(rt1.overlay.resizable).to.be.equal(Edges.None)
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
        expect(rt.overlay.visible).to.be.false
      })

      it("should set top/bottom overlay coords to null if y range is null", () => {
        const rt = new RangeTool({x_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.not.be.null
        expect(rt.overlay.right).to.not.be.null
        expect(rt.overlay.top).to.be.null
        expect(rt.overlay.bottom).to.be.null
        expect(rt.overlay.visible).to.be.true
      })

      it("should set left/right overlay coords to null if x range is null", () => {
        const rt = new RangeTool({y_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.null
        expect(rt.overlay.right).to.be.null
        expect(rt.overlay.top).to.not.be.null
        expect(rt.overlay.bottom).to.not.be.null
        expect(rt.overlay.visible).to.be.true
      })
    })
  })
})
