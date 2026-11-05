import {expect} from "#framework/assertions"

import {clip_mercator, in_bounds, project_xy, project_xsys} from "@bokehjs/core/util/projections"

describe("core/util/projections module", () => {

  describe("mercator_bounds() function", () => {

    it("should not clip valid longitudes", () => {
      expect(clip_mercator(-10018754, 10018754, "lon")).to.be.equal([-10018754, 10018754])
    })

    it("should clip invalid longitudes", () => {
      expect(clip_mercator(-20036376, 20036376, "lon")).to.be.equal([-20026376.39, 20026376.39])
    })

    it("should clip invalid longitude lower bound", () => {
      expect(clip_mercator(-20036376, 10018754, "lon")).to.be.equal([-20026376.39, 10018754])
    })

    it("should clip invalid longitude upper bound", () => {
      expect(clip_mercator(-10018754, 20036376, "lon")).to.be.equal([-10018754, 20026376.39])
    })

    it("should not clip valid latitudes", () => {
      expect(clip_mercator(-5621521, 5621521, "lat")).to.be.equal([-5621521, 5621521])
    })

    it("should clip invalid latitudes", () => {
      expect(clip_mercator(-20058966, 20058966, "lat")).to.be.equal([-20048966.10, 20048966.10])
    })

    it("should clip invalid latitude lower bound", () => {
      expect(clip_mercator(-20058966, 5621521, "lat")).to.be.equal([-20048966.10, 5621521])
    })

    it("should clip invalid latitude upper bound", () => {
      expect(clip_mercator(-5621521, 20058966, "lat")).to.be.equal([-5621521, 20048966.10])
    })
  })

  describe("in_bounds() function", () => {

    it("should reject value below lon lower bound", () => {
      expect(in_bounds(-181, "lon")).to.be.false
    })

    it("should reject value above lon upper bound", () => {
      expect(in_bounds(181, "lon")).to.be.false
    })

    it("should handle value within lon bound", () => {
      expect(in_bounds(0, "lon")).to.be.true
    })

    it("should reject value below lat lower bound", () => {
      expect(in_bounds(-91, "lat")).to.be.false
    })

    it("should reject value above lat upper bound", () => {
      expect(in_bounds(91, "lat")).to.be.false
    })

    it("should handle value within lat bound", () => {
      expect(in_bounds(0, "lat")).to.be.true
    })
  })

  describe("project_xy() function", () => {
    it("reuses matching output buffers and overwrites their values", () => {
      const [x, y] = project_xy(new Float32Array([1, 2]), new Float32Array([3, 4]))
      const xs = new Float32Array([5, 6])
      const ys = new Float32Array([7, 8])
      const [updated_x, updated_y] = project_xy(xs, ys, x, y)
      expect(updated_x).to.be.identical(x)
      expect(updated_y).to.be.identical(y)
      expect([updated_x, updated_y]).to.be.equal(project_xy(xs, ys))
      expect(xs).to.be.equal(new Float32Array([5, 6]))
      expect(ys).to.be.equal(new Float32Array([7, 8]))
    })

    it("replaces output buffers when their length or precision changes", () => {
      const [x, y] = project_xy(new Float32Array([1]), new Float32Array([2]))
      const [long_x, long_y] = project_xy(new Float32Array([1, 2]), new Float32Array([3, 4]), x, y)
      expect(long_x).to.not.be.identical(x)
      expect(long_y).to.not.be.identical(y)
      expect(long_x.length).to.be.equal(2)
      expect(long_y.length).to.be.equal(2)

      const [precise_x, precise_y] = project_xy([1, 2], [3, 4], long_x, long_y)
      expect(precise_x).to.be.instanceof(Float64Array)
      expect(precise_y).to.be.instanceof(Float64Array)
      expect([precise_x, precise_y]).to.be.equal(project_xy([1, 2], [3, 4]))

      const [empty_x, empty_y] = project_xy([], [], precise_x, precise_y)
      expect(empty_x.length).to.be.equal(0)
      expect(empty_y.length).to.be.equal(0)
    })

    it("should handle NaNs and infinities", () => {
      expect(project_xy([NaN], [1])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([1], [NaN])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([NaN], [NaN])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])

      expect(project_xy([Infinity], [1])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([1], [Infinity])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([Infinity], [Infinity])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])

      expect(project_xy([-Infinity], [1])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([1], [-Infinity])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
      expect(project_xy([-Infinity], [-Infinity])).to.be.equal([new Float64Array([NaN]), new Float64Array([NaN])])
    })
  })

  describe("project_xsys() function", () => {
    it("reuses outer arrays and unaffected rows when nested coordinates resize", () => {
      const [xs, ys] = project_xsys([[1], [2, 3]], [[4], [5, 6]])
      const [first_x, second_x] = xs
      const [first_y, second_y] = ys
      const input_xs = [[7], [8, 9, 10], [11]]
      const input_ys = [[12], [13, 14, 15], [16]]
      const [updated_xs, updated_ys] = project_xsys(input_xs, input_ys, xs, ys)
      expect(updated_xs).to.be.identical(xs)
      expect(updated_ys).to.be.identical(ys)
      expect(xs[0]).to.be.identical(first_x)
      expect(ys[0]).to.be.identical(first_y)
      expect(xs[1]).to.not.be.identical(second_x)
      expect(ys[1]).to.not.be.identical(second_y)
      expect([xs, ys]).to.be.equal(project_xsys(input_xs, input_ys))

      project_xsys([[17]], [[18]], xs, ys)
      expect(xs.length).to.be.equal(1)
      expect(ys.length).to.be.equal(1)
      expect(xs[0]).to.be.identical(first_x)
      expect(ys[0]).to.be.identical(first_y)
      expect([xs, ys]).to.be.equal(project_xsys([[17]], [[18]]))

      project_xsys([], [], xs, ys)
      expect(xs).to.be.equal([])
      expect(ys).to.be.equal([])
    })

    it("should handle NaNs and infinities", () => {
      expect(project_xsys([[NaN]], [[1]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[1]], [[NaN]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[NaN]], [[NaN]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])

      expect(project_xsys([[Infinity]], [[1]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[1]], [[Infinity]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[Infinity]], [[Infinity]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])

      expect(project_xsys([[-Infinity]], [[1]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[1]], [[-Infinity]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
      expect(project_xsys([[-Infinity]], [[-Infinity]])).to.be.equal([[new Float64Array([NaN])], [new Float64Array([NaN])]])
    })
  })
})
