import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Maximum} from "@bokehjs/models/expressions/maximum"
import {Minimum} from "@bokehjs/models/expressions/minimum"
import {CumSum} from "@bokehjs/models/expressions/cumsum"
import {Jitter} from "@bokehjs/models/transforms/jitter"
import {VBar} from "@bokehjs/models/glyphs/vbar"

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

describe("Expressions and transforms in specs", () => {

  it("should be followed after the spec is replaced", () => {
    const glyph = VBar.create({top: {field: "y"}})
    let exprs = 0
    let transforms = 0
    glyph.exprchange.connect(() => exprs++)
    glyph.transformchange.connect(() => transforms++)

    const old_expr = CumSum.create({field: "y"})
    const old_transform = Jitter.create()
    glyph.top = {expr: old_expr, transform: old_transform}

    const expr = CumSum.create({field: "y"})
    const transform = Jitter.create()
    glyph.top = {expr, transform}

    expr.field = "z"
    expr.field = "y"
    transform.width = 2
    expect(exprs).to.be.equal(2)
    expect(transforms).to.be.equal(1)

    old_expr.field = "z"
    old_transform.width = 2
    expect(exprs).to.be.equal(2)
    expect(transforms).to.be.equal(1)

    glyph.top = {field: "y"}
    expr.field = "z"
    transform.width = 3
    expect(exprs).to.be.equal(2)
    expect(transforms).to.be.equal(1)
  })

  it("should be followed while another spec still uses them", () => {
    const glyph = VBar.create({top: {field: "y"}, bottom: {value: 0}})
    let exprs = 0
    let transforms = 0
    glyph.exprchange.connect(() => exprs++)
    glyph.transformchange.connect(() => transforms++)

    const expr = CumSum.create({field: "y"})
    const transform = Jitter.create()
    glyph.top = {expr, transform}
    glyph.bottom = {expr, transform}

    glyph.top = {field: "y"}
    expr.field = "z"
    transform.width = 2
    expect(exprs).to.be.equal(1)
    expect(transforms).to.be.equal(1)

    glyph.bottom = {value: 0}
    expr.field = "y"
    transform.width = 3
    expect(exprs).to.be.equal(1)
    expect(transforms).to.be.equal(1)
  })
})
