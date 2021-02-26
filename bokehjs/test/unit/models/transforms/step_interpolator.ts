import {expect} from "assertions"

import {StepInterpolator} from "@bokehjs/models/transforms/step_interpolator"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {StepMode} from "@bokehjs/core/enums"

describe("step_interpolator_transform module", () => {

  describe("creation with ColumnDataSource ranges", () => {
    function step_interpolator(mode: StepMode) {
      return new StepInterpolator({
        mode,
        x: "var1",
        y: "var2",
        data: new ColumnDataSource({
          data: {var1: [0, 5, 15], var2: [10, 20, 30]},
        }),
      })
    }

    describe("should step interpolate before", () => {
      const transform = step_interpolator("before")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(20)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 20, 30]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })

    describe("should step interpolate after", () => {
      const transform = step_interpolator("after")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(10)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 10, 20]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })

    describe("should step interpolate center", () => {
      const transform = step_interpolator("center")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(10)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 10, 20]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })
  })

  describe("creation with inline ranges", () => {

    function step_interpolator(mode: StepMode) {
      return new StepInterpolator({
        mode,
        x: [0, 5, 15],
        y: [10, 20, 30],
      })
    }


    describe("should step interpolate before", () => {
      const transform = step_interpolator("before")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(20)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 20, 30]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })

    describe("should step interpolate after", () => {
      const transform = step_interpolator("after")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(10)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 10, 20]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })

    describe("should step interpolate center", () => {
      const transform = step_interpolator("center")

      it("should return control points", () => {
        expect(transform.compute(0)).to.be.equal(10)
        expect(transform.compute(5)).to.be.equal(20)
      })

      it("should linearly interpolate between control points", () => {
        expect(transform.compute(2)).to.be.equal(10)
      })

      it("should linearly interpolate a vector of points", () => {
        expect(transform.v_compute([0, 2, 6])).to.be.equal(new Float64Array([10, 10, 20]))
      })

      it("should map to a Float64Array", () => {
        expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
      })
    })
  })
})
