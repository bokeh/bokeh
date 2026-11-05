import {expect} from "#framework/assertions"

import {LinearInterpolator} from "@bokehjs/models/transforms/linear_interpolator"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {dict} from "@bokehjs/core/util/object"
import {RecordSource} from "../sources/record_source"

describe("linear_interpolator_transform module", () => {
  it("rebinds interpolation dependencies through replacement and null transitions", () => {
    const original = RecordSource.create({records: [{x: 0, y: 0}, {x: 2, y: 20}]})
    const replacement = RecordSource.create({records: [{x: 0, y: 0}, {x: 2, y: 40}]})
    const transform = LinearInterpolator.create({data: original, x: "x", y: "y"})
    expect(transform.compute(1)).to.be.equal(10)
    let changes = 0
    transform.change.connect(() => changes++)

    transform.data = replacement
    expect(transform.compute(1)).to.be.equal(20)
    const after_replacement = changes
    original.change.emit()
    original.data_changed.emit({structural: true})
    expect(changes).to.be.equal(after_replacement)

    dict(replacement.records[1]).set("y", 60)
    replacement.data_changed.emit({structural: false, indices: [1]})
    expect(transform.compute(1)).to.be.equal(30)
    replacement.records = [{x: 0, y: 0}, {x: 2, y: 80}]
    expect(transform.compute(1)).to.be.equal(40)

    transform.data = null
    const after_null = changes
    replacement.change.emit()
    replacement.data_changed.emit({structural: true})
    expect(changes).to.be.equal(after_null)
    transform.data = replacement
    expect(transform.compute(1)).to.be.equal(40)

    transform.destroy()
    const after_destroy = changes
    replacement.change.emit()
    replacement.data_changed.emit({structural: true})
    expect(changes).to.be.equal(after_destroy)
  })

  function generate_interpolator_ColumnDataSource() {
    return LinearInterpolator.create({
      x: "var1",
      y: "var2",
      data: ColumnDataSource.create({
        data: {var1: [0, 5, 15], var2: [10, 20, 30]},
      }),
    })
  }

  function generate_interpolator_inline() {
    return LinearInterpolator.create({
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
      expect(transform.v_compute([0, 2, 5])).to.be.equal(new Float64Array([10, 14, 20]))
    })

    it("should map to a Float64Array", () => {
      expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
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
      expect(transform.v_compute([0, 2, 5])).to.be.equal(new Float64Array([10, 14, 20]))
    })

    it("should map to a Float64Array", () => {
      expect(transform.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float64Array)
    })
  })
})
