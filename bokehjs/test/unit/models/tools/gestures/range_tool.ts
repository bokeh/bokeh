import {expect} from "assertions"

import {compute_value, flip_side, is_near, is_inside, update_range, RangeTool, Side, update_range_end_side, update_range_start_side} from "@bokehjs/models/tools/gestures/range_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"

describe("range_tool module", () => {
  const source = {start: 0, end: 10}
  const target = {start: 0, end: 100}

  function generate_scale() {
    return new LinearScale({
      source_range: new Range1d(source),
      target_range: new Range1d(target),
    })
  }

  describe("flip_side", () => {
    it("should flip left to right", () => {
      expect(flip_side(Side.Left)).to.be.equal(Side.Right)
    })
    it("should flip right to left", () => {
      expect(flip_side(Side.Right)).to.be.equal(Side.Left)
    })
    it("should flip top to bottom", () => {
      expect(flip_side(Side.Top)).to.be.equal(Side.Bottom)
    })
    it("should flip bottom to top", () => {
      expect(flip_side(Side.Bottom)).to.be.equal(Side.Top)
    })
    it("should all others to themselves", () => {
      expect(flip_side(Side.None)).to.be.equal(Side.None)
      expect(flip_side(Side.BottomTop)).to.be.equal(Side.BottomTop)
      expect(flip_side(Side.LeftRightBottomTop)).to.be.equal(Side.LeftRightBottomTop)
    })
  })

  describe("is_near", () => {
    const scale = generate_scale()

    it("should return false if value == null", () => {
      expect(is_near(-10, null, scale, 3)).to.be.false
      expect(is_near(0, null, scale, 3)).to.be.false
      expect(is_near(10, null, scale, 3)).to.be.false
      expect(is_near(10.2, null, scale, 3)).to.be.false
    })

    it("should return false if value maps far from screen pos", () => {
      expect(is_near(-10, 5, scale, 3)).to.be.false
      expect(is_near(0, 5, scale, 3)).to.be.false
      expect(is_near(10, 5, scale, 3)).to.be.false
      expect(is_near(47, 5, scale, 3)).to.be.false
      expect(is_near(53, 5, scale, 3)).to.be.false
      expect(is_near(60, 5, scale, 3)).to.be.false
      expect(is_near(100, 5, scale, 3)).to.be.false
    })

    it("should return true if value maps close to screen pos", () => {
      expect(is_near(47.1, 5, scale, 3)).to.be.true
      expect(is_near(50, 5, scale, 3)).to.be.true
      expect(is_near(52.9, 5, scale, 3)).to.be.true
    })
  })

  describe("is_inside", () => {
    const x_range = new Range1d(source)
    const y_range = new Range1d(source)
    const x_scale = generate_scale()
    const y_scale = generate_scale()

    it("should return true if sx/sy are inside the overlay", () => {
      const rt0 = new RangeTool({x_range})
      rt0.update_overlay_from_ranges()
      const r0 = is_inside(50, 50, x_scale, y_scale, rt0.overlay)
      expect(r0).to.be.true

      const rt1 = new RangeTool({y_range})
      rt1.update_overlay_from_ranges()
      const r1 = is_inside(50, 50, x_scale, y_scale, rt1.overlay)
      expect(r1).to.be.true

      const rt2 = new RangeTool({x_range, y_range})
      rt2.update_overlay_from_ranges()
      const r2 = is_inside(50, 50, x_scale, y_scale, rt2.overlay)
      expect(r2).to.be.true
    })

    it("should return false if sx/sy are outside the overlay", () => {
      const rt0 = new RangeTool({x_range})
      rt0.update_overlay_from_ranges()
      const r0 = is_inside(-1, 50, x_scale, y_scale, rt0.overlay)
      expect(r0).to.be.false
      const r1 = is_inside(101, 50, x_scale, y_scale, rt0.overlay)
      expect(r1).to.be.false

      const rt1 = new RangeTool({y_range})
      rt1.update_overlay_from_ranges()
      const r3 = is_inside(50, -1, x_scale, y_scale, rt1.overlay)
      expect(r3).to.be.false
      const r4 = is_inside(50, 101, x_scale, y_scale, rt1.overlay)
      expect(r4).to.be.false
    })
  })

  describe("compute_value", () => {
    const scale = generate_scale()

    it("should return value as-is if new value would be outside range", () => {
      const range = new Range1d(source)
      const r0 = compute_value(5, scale, 51, range)
      expect(r0).to.be.equal(5)
      const r1 = compute_value(5, scale, -51, range)
      expect(r1).to.be.equal(5)
    })

    it("should return new_value if new value would be inside range", () => {
      const range = new Range1d(source)
      const r0 = compute_value(5, scale, 50, range)
      expect(r0).to.be.equal(10)
      const r1 = compute_value(5, scale, 0, range)
      expect(r1).to.be.equal(5)
      const r2 = compute_value(5, scale, -50, range)
      expect(r2).to.be.equal(0)
    })
  })

  describe("update_range_start_side", () => {
    it("should not flip if new start < end", () => {
      const r = new Range1d({start: 0, end: 1})
      const side = update_range_start_side(0.5, r, Side.Top)
      expect(r.start).to.be.equal(0.5)
      expect(r.end).to.be.equal(1)
      expect(side).to.be.equal(Side.Top)
    })

    it("should flip if new start >= end", () => {
      const r = new Range1d({start: 0, end: 1})
      const side = update_range_start_side(1.5, r, Side.Top)
      expect(r.end).to.be.equal(1.5)
      expect(r.start).to.be.equal(1)
      expect(side).to.be.equal(Side.Bottom)
    })

  })

  describe("update_range_end_side", () => {
    it("should not flip if new end > start", () => {
      const r = new Range1d({start: 0, end: 1})
      const side = update_range_end_side(1.5, r, Side.Top)
      expect(r.start).to.be.equal(0)
      expect(r.end).to.be.equal(1.5)
      expect(side).to.be.equal(Side.Top)
    })

    it("should flip if new end <= start", () => {
      const r = new Range1d({start: 0, end: 1})
      const side = update_range_end_side(-0.5, r, Side.Top)
      expect(r.start).to.be.equal(-0.5)
      expect(r.end).to.be.equal(0)
      expect(side).to.be.equal(Side.Bottom)
    })

  })

  describe("update_range", () => {
    const scale = generate_scale()

    it("should not update range if new start/end would be outside plot_range", () => {
      const plot_range = new Range1d({start: -2, end: 12})

      const range0 = new Range1d(source)
      update_range(range0, scale, 21, plot_range)
      expect(range0.start).to.be.equal(0)
      expect(range0.end).to.be.equal(10)

      const range1 = new Range1d(source)
      update_range(range1, scale, -21, plot_range)
      expect(range1.start).to.be.equal(0)
      expect(range1.end).to.be.equal(10)
    })

    it("should update range if new start/end would be inside plot_range", () => {
      const plot_range = new Range1d({start: -2, end: 12})

      const range0 = new Range1d(source)
      update_range(range0, scale, 20, plot_range)
      expect(range0.start).to.be.equal(2)
      expect(range0.end).to.be.equal(12)

      const range1 = new Range1d(source)
      update_range(range1, scale, -20, plot_range)
      expect(range1.start).to.be.equal(-2)
      expect(range1.end).to.be.equal(8)
    })
  })

  describe("RangeTool", () => {

    describe("construction", () => {
      const x_range = new Range1d(source)
      const y_range = new Range1d(source)

      it("should set overlay in_cursor", () => {
        const rt = new RangeTool()
        expect(rt.overlay.in_cursor).to.be.equal("grab")
      })

      it("should set overlay ns_cursor", () => {
        const rt0 = new RangeTool()
        expect(rt0.overlay.ns_cursor).to.be.null

        const rt1 = new RangeTool({y_range})
        expect(rt1.overlay.ns_cursor).to.be.equal("ns-resize")

        const rt2 = new RangeTool({y_range, y_interaction: false})
        expect(rt2.overlay.ns_cursor).to.be.null
      })

      it("should set overlay ew_cursor", () => {
        const rt0 = new RangeTool()
        expect(rt0.overlay.ew_cursor).to.be.null

        const rt1 = new RangeTool({x_range})
        expect(rt1.overlay.ew_cursor).to.be.equal("ew-resize")

        const rt2 = new RangeTool({x_range, x_interaction: false})
        expect(rt2.overlay.ew_cursor).to.be.null
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
