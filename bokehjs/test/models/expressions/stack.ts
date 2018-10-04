import {expect} from "chai"

import {ColumnDataSource} from "models/sources/column_data_source"
import {Stack} from "models/expressions/stack"

describe("Stack", () => {

  it("should should compute for a source", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s0 = new Stack({fields: ['foo']})
    const ret0 = s0.v_compute(source)
    expect(ret0).to.deep.equal(new Float64Array([1, 2, 3]))

    const s1 = new Stack({fields: ['foo', 'bar']})
    const ret1 = s1.v_compute(source)
    expect(ret1).to.deep.equal(new Float64Array([1.1, 2.2, 3.3]))
  })

  it("should should compute for different sources", () => {
    const source1 = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
    const source2 = new ColumnDataSource({data: {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}})

    const s0 = new Stack({fields: ['foo']})
    const ret0 = s0.v_compute(source1)
    expect(ret0).to.deep.equal(new Float64Array([1, 2, 3]))

    const s1 = new Stack({fields: ['foo', 'bar']})
    const ret1 = s1.v_compute(source1)
    expect(ret1).to.deep.equal(new Float64Array([1.1, 2.2, 3.3]))

    const s2 = new Stack({fields: ['foo']})
    const ret2 = s2.v_compute(source2)
    expect(ret2).to.deep.equal(new Float64Array([10, 20, 30]))

    const s3 = new Stack({fields: ['foo', 'bar']})
    const ret3 = s3.v_compute(source2)
    expect(ret3).to.deep.equal(new Float64Array([10.01, 20.02, 30.03]))
  })

  it("should should re-compute if a source changes", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = new Stack({fields: ['foo', 'bar']})
    const ret0 = s.v_compute(source)
    expect(ret0).to.deep.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.data = {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}
    const ret1 = s.v_compute(source)
    expect(ret1).to.deep.equal(new Float64Array([10.01, 20.02, 30.03]))
  })

  it("should should re-compute if a source patches", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = new Stack({fields: ['foo', 'bar']})
    const ret0 = s.v_compute(source)
    expect(ret0).to.deep.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.patch({foo: [[1, 12]]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.deep.equal(new Float64Array([1.1, 12.2, 3.3]))

    source.patch({bar: [[0, 1.1]]})
    const ret2 = s.v_compute(source)
    expect(ret2).to.deep.equal(new Float64Array([2.1, 12.2, 3.3]))
  })

  it("should should re-compute if a source streams", () => {
    const source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = new Stack({fields: ['foo', 'bar']})
    const ret0 = s.v_compute(source)
    expect(ret0).to.deep.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.stream({foo: [4], bar: [0.4]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.deep.equal(new Float64Array([1.1, 2.2, 3.3, 4.4]))
  })
})
