import {expect} from "assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CumSum} from "@bokehjs/models/expressions/cumsum"
import {NumberArray} from '@bokehjs/core/types'

describe("CumSum", () => {

  it("should should compute for a source", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})

    const s0 = new CumSum({field: 'foo'})
    const ret0 = s0.v_compute(source)
    expect(ret0).to.be.equal(new NumberArray([1, 3, 6, 10]))

    const s1 = new CumSum({field: 'foo', include_zero: true})
    const ret1 = s1.v_compute(source)
    expect(ret1).to.be.equal(new NumberArray([0, 1, 3, 6]))
  })

  it("should should compute for different sources", () => {
    const source1 = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
    const source2 = new ColumnDataSource({data: {foo: [10, 20, 30, 40]}})

    const s0 = new CumSum({field: 'foo'})
    const ret0 = s0.v_compute(source1)
    expect(ret0).to.be.equal(new NumberArray([1, 3, 6, 10]))

    const s1 = new CumSum({field: 'foo', include_zero: true})
    const ret1 = s1.v_compute(source1)
    expect(ret1).to.be.equal(new NumberArray([0, 1, 3, 6]))

    const s2 = new CumSum({field: 'foo'})
    const ret2 = s2.v_compute(source2)
    expect(ret2).to.be.equal(new NumberArray([10, 30, 60, 100]))

    const s3 = new CumSum({field: 'foo', include_zero: true})
    const ret3 = s3.v_compute(source2)
    expect(ret3).to.be.equal(new NumberArray([0, 10, 30, 60]))
  })

  it("should should re-compute if a source changes", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})

    const s = new CumSum({field: 'foo'})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new NumberArray([1, 3, 6, 10]))

    source.data = {foo: [10, 20, 30, 40]}
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new NumberArray([10, 30, 60, 100]))
  })

  it("should should re-compute if a source patches", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})

    const s = new CumSum({field: 'foo'})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new NumberArray([1, 3, 6, 10]))

    source.patch({foo: [[1, 12]]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new NumberArray([1, 13, 16, 20]))

    source.patch({foo: [[0, 1.1]]})
    const ret2 = s.v_compute(source)
    expect(ret2).to.be.equal(new NumberArray([1.1, 13.1, 16.1, 20.1]))
  })

  it("should should re-compute if a source streams", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})

    const s = new CumSum({field: 'foo'})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new NumberArray([1, 3, 6, 10]))

    source.stream({foo: [5]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new NumberArray([1, 3, 6, 10, 15]))
  })
})
