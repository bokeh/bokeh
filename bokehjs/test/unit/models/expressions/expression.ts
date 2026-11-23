import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Maximum} from "@bokehjs/models/expressions/maximum"
import {Minimum} from "@bokehjs/models/expressions/minimum"

describe("ScalarExpression", () => {

  it("should re-compute every time its own properties change", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [10, 20, 30]}})

    const max = Maximum.create({field: "foo"})
    expect(max.compute(source)).to.be.equal(3)

    max.field = "bar"
    expect(max.compute(source)).to.be.equal(30)

    max.field = "foo"
    expect(max.compute(source)).to.be.equal(3)

    max.initial = 100
    expect(max.compute(source)).to.be.equal(100)

    const min = Minimum.create({field: "foo"})
    expect(min.compute(source)).to.be.equal(1)

    min.field = "bar"
    expect(min.compute(source)).to.be.equal(10)

    min.field = "foo"
    expect(min.compute(source)).to.be.equal(1)
  })
})
