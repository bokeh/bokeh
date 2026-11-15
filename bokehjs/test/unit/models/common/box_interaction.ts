import {expect} from "#framework/assertions"

import {resizable_edges, hittable, target_deltas, move_bbox} from "@bokehjs/models/common/box_interaction"
import type * as Box from "@bokehjs/models/common/box_kinds"
import type {LRTB} from "@bokehjs/core/util/bbox"
import {BBox} from "@bokehjs/core/util/bbox"

describe("models/common/box_interaction module", () => {
  describe("resizable_edges()", () => {
    it("should support all resizable modes", () => {
      const edges = (resizable: Box.Resizable) => {
        const {left, right, top, bottom, top_left, top_right, bottom_left, bottom_right} = resizable_edges(resizable)
        return [left, right, top, bottom, top_left, top_right, bottom_left, bottom_right]
      }
      expect(edges("none")).to.be.equal([false, false, false, false, false, false, false, false])
      expect(edges("left")).to.be.equal([true, false, false, false, false, false, false, false])
      expect(edges("bottom")).to.be.equal([false, false, false, true, false, false, false, false])
      expect(edges("x")).to.be.equal([true, true, false, false, false, false, false, false])
      expect(edges("y")).to.be.equal([false, false, true, true, false, false, false, false])
      expect(edges("all")).to.be.equal([true, true, true, true, true, true, true, true])
    })
  })

  describe("hittable()", () => {
    it("should combine resizable edges with movable area", () => {
      expect(hittable("x", true)).to.be.equal({
        left: true, right: true, top: false, bottom: false,
        top_left: false, top_right: false, bottom_left: false, bottom_right: false,
        area: true,
      })
      expect(hittable("none", false).area).to.be.false
    })
  })

  describe("target_deltas()", () => {
    const options = {movable: "both", symmetric: false} as const

    it("should move only the dragged edges", () => {
      expect(target_deltas("bottom_right", 5, 7, options)).to.be.equal({left: 0, right: 5, top: 0, bottom: 7})
      expect(target_deltas("left", 5, 7, options)).to.be.equal({left: 5, right: 0, top: 0, bottom: 0})
    })

    it("should move opposite edges in the opposite direction when symmetric", () => {
      expect(target_deltas("top_left", 5, 7, {...options, symmetric: true})).to.be.equal({left: 5, right: -5, top: 7, bottom: -7})
    })

    it("should move all edges when dragging the area", () => {
      expect(target_deltas("area", 5, 7, options)).to.be.equal({left: 5, right: 5, top: 7, bottom: 7})
      expect(target_deltas("area", 5, 7, {...options, movable: "y"})).to.be.equal({left: 0, right: 0, top: 7, bottom: 7})
      expect(target_deltas("area", 5, 7, {...options, movable: "none"})).to.be.equal({left: 0, right: 0, top: 0, bottom: 0})
    })
  })

  describe("move_bbox()", () => {
    const bbox = BBox.from_lrtb({left: 10, right: 50, top: 20, bottom: 60})
    const unbounded: LRTB = {left: NaN, right: NaN, top: NaN, bottom: NaN}
    const options = {movable: "both", symmetric: false, limits: unbounded} as const

    function lrtb(box: BBox): LRTB {
      const {left, right, top, bottom} = box
      return {left, right, top, bottom}
    }

    it("should move without limits", () => {
      const {bbox: moved, deltas} = move_bbox(bbox, "area", 100, -100, options)
      expect(lrtb(moved)).to.be.equal({left: 110, right: 150, top: -80, bottom: -40})
      expect(deltas).to.be.equal({left: 100, right: 100, top: -100, bottom: -100})
    })

    it("should keep the size when moving against a limit", () => {
      const limits = {left: 0, right: 100, top: 0, bottom: 100}
      const {bbox: moved} = move_bbox(bbox, "area", 80, -30, {...options, limits})
      expect(lrtb(moved)).to.be.equal({left: 60, right: 100, top: 0, bottom: 40})
    })

    it("should stop a resized edge at a limit", () => {
      const limits = {left: 0, right: 100, top: 0, bottom: 100}
      const {bbox: resized} = move_bbox(bbox, "bottom_right", 80, 80, {...options, limits})
      expect(lrtb(resized)).to.be.equal({left: 10, right: 100, top: 20, bottom: 100})
    })

    it("should swap edges that cross", () => {
      const {bbox: resized} = move_bbox(bbox, "right", -60, 0, options)
      expect(lrtb(resized)).to.be.equal({left: -10, right: 10, top: 20, bottom: 60})
    })

    it("should ignore limits of edges that aren't moved", () => {
      // the left edge is already outside of limits, e.g. a wide RangeTool overlay
      const limits = {left: 20, right: 100, top: NaN, bottom: NaN}
      const {bbox: resized} = move_bbox(bbox, "right", 10, 0, {...options, limits})
      expect(lrtb(resized)).to.be.equal({left: 10, right: 60, top: 20, bottom: 60})
    })

    it("should normalize inverted limits", () => {
      const limits = {left: 100, right: 0, top: 100, bottom: 0}
      const {bbox: moved} = move_bbox(bbox, "area", 80, 80, {...options, limits})
      expect(lrtb(moved)).to.be.equal({left: 60, right: 100, top: 60, bottom: 100})
    })
  })
})
