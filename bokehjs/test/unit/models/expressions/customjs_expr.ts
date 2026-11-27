import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CustomJSExpr} from "@bokehjs/models/expressions/customjs_expr"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("CustomJSExpr", () => {

  it("should re-compute every time its code changes", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3]}})

    const e = CustomJSExpr.create({code: "return this.get_column('foo').map((v) => v + 1)"})
    expect(e.v_compute(source)).to.be.equal([2, 3, 4])

    e.code = "return this.get_column('foo').map((v) => v + 2)"
    expect(e.v_compute(source)).to.be.equal([3, 4, 5])

    e.code = "return this.get_column('foo').map((v) => v + 3)"
    expect(e.v_compute(source)).to.be.equal([4, 5, 6])
  })

  it("should re-compute when a model in args changes, also after args are replaced", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3]}})
    const r0 = Range1d.create({start: 0, end: 1})

    const e = CustomJSExpr.create({args: {r: r0}, code: "return this.get_column('foo').map((v) => v + r.start)"})
    expect(e.v_compute(source)).to.be.equal([1, 2, 3])

    r0.start = 5
    expect(e.v_compute(source)).to.be.equal([6, 7, 8])

    const r1 = Range1d.create({start: 10, end: 11})
    e.args = {r: r1}
    expect(e.v_compute(source)).to.be.equal([11, 12, 13])

    r1.start = 20
    expect(e.v_compute(source)).to.be.equal([21, 22, 23])

    r1.start = 30
    expect(e.v_compute(source)).to.be.equal([31, 32, 33])
  })
})
