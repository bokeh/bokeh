import {expect} from "assertions"

import {clip_mercator, in_bounds, project_xy, project_xsys} from "@bokehjs/core/util/projections"

describe("core/util/projections module", () => {

  describe("mercator_bounds() function", () => {

    it("should not clip valid longitudes", () => {
      expect(clip_mercator(-10018754, 10018754, 'lon')).to.be.equal([-10018754, 10018754])
    })

    it("should clip invalid longitudes", () => {
      expect(clip_mercator(-20036376, 20036376, 'lon')).to.be.equal([-20026376.39, 20026376.39])
    })

    it("should clip invalid longitude lower bound", () => {
      expect(clip_mercator(-20036376, 10018754, 'lon')).to.be.equal([-20026376.39, 10018754])
    })

    it("should clip invalid longitude upper bound", () => {
      expect(clip_mercator(-10018754, 20036376, 'lon')).to.be.equal([-10018754, 20026376.39])
    })

    it("should not clip valid latitudes", () => {
      expect(clip_mercator(-5621521, 5621521, 'lat')).to.be.equal([-5621521, 5621521])
    })

    it("should clip invalid latitudes", () => {
      expect(clip_mercator(-20058966, 20058966, 'lat')).to.be.equal([-20048966.10, 20048966.10])
    })

    it("should clip invalid latitude lower bound", () => {
      expect(clip_mercator(-20058966, 5621521, 'lat')).to.be.equal([-20048966.10, 5621521])
    })

    it("should clip invalid latitude upper bound", () => {
      expect(clip_mercator(-5621521, 20058966, 'lat')).to.be.equal([-5621521, 20048966.10])
    })
  })

  describe("in_bounds() function", () => {

    it("should reject value below lon lower bound", () => {
      expect(in_bounds(-181, 'lon')).to.be.false
    })

    it("should reject value above lon upper bound", () => {
      expect(in_bounds(181, 'lon')).to.be.false
    })

    it("should handle value within lon bound", () => {
      expect(in_bounds(0, 'lon')).to.be.true
    })

    it("should reject value below lat lower bound", () => {
      expect(in_bounds(-91, 'lat')).to.be.false
    })

    it("should reject value above lat upper bound", () => {
      expect(in_bounds(91, 'lat')).to.be.false
    })

    it("should handle value within lat bound", () => {
      expect(in_bounds(0, 'lat')).to.be.true
    })
  })

  describe("project_xy() function", () => {
    it("should handle NaNs and infinities", () => {
      expect(project_xy([NaN], [1])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([1], [NaN])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([NaN], [NaN])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])

      expect(project_xy([Infinity], [1])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([1], [Infinity])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([Infinity], [Infinity])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])

      expect(project_xy([-Infinity], [1])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([1], [-Infinity])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
      expect(project_xy([-Infinity], [-Infinity])).to.be.equal([new Float32Array([NaN]), new Float32Array([NaN])])
    })
  })

  describe("project_xsys() function", () => {
    it("should handle NaNs and infinities", () => {
      expect(project_xsys([[NaN]], [[1]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[1]], [[NaN]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[NaN]], [[NaN]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])

      expect(project_xsys([[Infinity]], [[1]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[1]], [[Infinity]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[Infinity]], [[Infinity]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])

      expect(project_xsys([[-Infinity]], [[1]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[1]], [[-Infinity]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
      expect(project_xsys([[-Infinity]], [[-Infinity]])).to.be.equal([[new Float32Array([NaN])], [new Float32Array([NaN])]])
    })
  })
})
