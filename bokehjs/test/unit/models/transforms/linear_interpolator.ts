import {expect} from "assertions"

import {LinearInterpolator} from "@bokehjs/models/transforms/linear_interpolator"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {NumberArray} from '@bokehjs/core/types'

describe("linear_interpolator_transform module", () => {

  function generate_interpolator_ColumnDataSource() {
    return new LinearInterpolator({
      x: 'var1',
      y: 'var2',
      data: new ColumnDataSource({
        data: {var1: [0, 5, 15], var2: [10, 20, 30]},
      }),
    })
  }

  function generate_interpolator_inline() {
    return new LinearInterpolator({
      x: [0, 5, 15],
      y: [10, 20, 30],
    })
  }

  describe("creation with ColumnDataSource ranges", () => {
    const transform = generate_interpolator_ColumnDataSource()

    it("should return control points", () => {
      expect(transform.compute(0)).to.be.equal(10)
      expect(transform.compute(5)).to.be.equal(20)
      expect(transform.compute(15)).to.be.equal(30)
    })

    it("should linearly interpolate between control points", () => {
      expect(transform.compute(2)).to.be.equal(14)
    })

    it("should linearly interpolate a vector of points", () => {
      expect(transform.v_compute([0, 2, 5])).to.be.equal(new NumberArray([10, 14, 20]))
    })

    it("should map to a NumberArray", () => {
      expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(NumberArray)
    })
  })

  describe("creation with inline ranges", () => {
    const transform = generate_interpolator_inline()

    it("should return control points", () => {
      expect(transform.compute(0)).to.be.equal(10)
      expect(transform.compute(5)).to.be.equal(20)
      expect(transform.compute(15)).to.be.equal(30)
    })

    it("should linearly interpolate between control points", () => {
      expect(transform.compute(2)).to.be.equal(14)
    })

    it("should linearly interpolate a vector of points", () => {
      expect(transform.v_compute([0, 2, 5])).to.be.equal(new NumberArray([10, 14, 20]))
    })

    it("should map to a NumberArray", () => {
      expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(NumberArray)
    })
  })
})
