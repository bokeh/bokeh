import {expect} from "chai"

import {clip_mercator, in_bounds} from "core/util/projections"

describe("core/util/projections module", () => {

  describe("mercator_bounds function", () => {

    it("should not clip valid longitudes", () => {
      expect(clip_mercator(-10018754, 10018754, 'lon')).to.deep.equal([-10018754, 10018754])
    })

    it("should clip invalid longitudes", () => {
      expect(clip_mercator(-20036376, 20036376, 'lon')).to.deep.equal([-20026376.39, 20026376.39])
    })

    it("should clip invalid longitude lower bound", () => {
      expect(clip_mercator(-20036376, 10018754, 'lon')).to.deep.equal([-20026376.39, 10018754])
    })

    it("should clip invalid longitude upper bound", () => {
      expect(clip_mercator(-10018754, 20036376, 'lon')).to.deep.equal([-10018754, 20026376.39])
    })

    it("should not clip valid latitudes", () => {
      expect(clip_mercator(-5621521, 5621521, 'lat')).to.deep.equal([-5621521, 5621521])
    })

    it("should clip invalid latitudes", () => {
      expect(clip_mercator(-20058966, 20058966, 'lat')).to.deep.equal([-20048966.10, 20048966.10])
    })

    it("should clip invalid latitude lower bound", () => {
      expect(clip_mercator(-20058966, 5621521, 'lat')).to.deep.equal([-20048966.10, 5621521])
    })

    it("should clip invalid latitude upper bound", () => {
      expect(clip_mercator(-5621521, 20058966, 'lat')).to.deep.equal([-5621521, 20048966.10])
    })
  })

  describe("in_bounds function", () => {

    it("should reject value below lon lower bound", () => {
      expect(in_bounds(-181, 'lon')).to.equal(false)
    })

    it("should reject value above lon upper bound", () => {
      expect(in_bounds(181, 'lon')).to.equal(false)
    })

    it("should handle value within lon bound", () => {
      expect(in_bounds(0, 'lon')).to.equal(true)
    })

    it("should reject value below lat lower bound", () => {
      expect(in_bounds(-91, 'lat')).to.equal(false)
    })

    it("should reject value above lat upper bound", () => {
      expect(in_bounds(91, 'lat')).to.equal(false)
    })

    it("should handle value within lat bound", () => {
      expect(in_bounds(0, 'lat')).to.equal(true)
    })
  })
})
