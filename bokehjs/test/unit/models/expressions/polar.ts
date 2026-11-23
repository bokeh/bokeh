import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CumSum} from "@bokehjs/models/expressions/cumsum"
import {PolarTransform} from "@bokehjs/models/expressions/polar"

describe("PolarTransform", () => {

  it("should re-compute its components every time the transform changes", () => {
    const source = ColumnDataSource.create({data: {r: [1, 2], r2: [3, 4], a: [0, 0]}})

    const t = PolarTransform.create({radius: {field: "r"}, angle: {field: "a"}})
    const x = t.x
    let changes = 0
    x.change.connect(() => changes++)
    expect(x.v_compute(source)).to.be.equal(new Float64Array([1, 2]))

    t.radius = {field: "r2"}
    expect(changes).to.be.equal(1)
    expect(x.v_compute(source)).to.be.equal(new Float64Array([3, 4]))

    t.radius = {field: "r"}
    expect(changes).to.be.equal(2)
    expect(x.v_compute(source)).to.be.equal(new Float64Array([1, 2]))

    x.transform = PolarTransform.create({radius: {field: "r2"}, angle: {field: "a"}})
    expect(changes).to.be.equal(3)
    expect(x.v_compute(source)).to.be.equal(new Float64Array([3, 4]))
  })

  it("should re-compute every time an expression used in its specs changes", () => {
    const source = ColumnDataSource.create({data: {r: [1, 2], r2: [3, 4], a: [0, 0]}})

    const radius = CumSum.create({field: "r"})
    const t = PolarTransform.create({radius: {expr: radius}, angle: {field: "a"}})
    const x = t.x
    expect(x.v_compute(source)).to.be.equal(new Float64Array([1, 3]))

    radius.field = "r2"
    expect(x.v_compute(source)).to.be.equal(new Float64Array([3, 7]))

    radius.field = "r"
    expect(x.v_compute(source)).to.be.equal(new Float64Array([1, 3]))
  })
})
