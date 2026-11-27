import {expect, expect_instanceof} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Stack} from "@bokehjs/models/expressions/stack"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {VBar, VBarView} from "@bokehjs/models/glyphs/vbar"

describe("Stack", () => {

  it("should should compute for a source", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s0 = Stack.create({fields: ["foo"]})
    const ret0 = s0.v_compute(source)
    expect(ret0).to.be.equal(new Float64Array([1, 2, 3]))

    const s1 = Stack.create({fields: ["foo", "bar"]})
    const ret1 = s1.v_compute(source)
    expect(ret1).to.be.equal(new Float64Array([1.1, 2.2, 3.3]))
  })

  it("should should compute for different sources", () => {
    const source1 = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
    const source2 = ColumnDataSource.create({data: {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}})

    const s0 = Stack.create({fields: ["foo"]})
    const ret0 = s0.v_compute(source1)
    expect(ret0).to.be.equal(new Float64Array([1, 2, 3]))

    const s1 = Stack.create({fields: ["foo", "bar"]})
    const ret1 = s1.v_compute(source1)
    expect(ret1).to.be.equal(new Float64Array([1.1, 2.2, 3.3]))

    const s2 = Stack.create({fields: ["foo"]})
    const ret2 = s2.v_compute(source2)
    expect(ret2).to.be.equal(new Float64Array([10, 20, 30]))

    const s3 = Stack.create({fields: ["foo", "bar"]})
    const ret3 = s3.v_compute(source2)
    expect(ret3).to.be.equal(new Float64Array([10.01, 20.02, 30.03]))
  })

  it("should should re-compute if a source changes", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = Stack.create({fields: ["foo", "bar"]})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.data = {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new Float64Array([10.01, 20.02, 30.03]))
  })

  it("should should re-compute if a source patches", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = Stack.create({fields: ["foo", "bar"]})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.patch({foo: [[1, 12]]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new Float64Array([1.1, 12.2, 3.3]))

    source.patch({bar: [[0, 1.1]]})
    const ret2 = s.v_compute(source)
    expect(ret2).to.be.equal(new Float64Array([2.1, 12.2, 3.3]))
  })

  it("should should re-compute if a source streams", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})

    const s = Stack.create({fields: ["foo", "bar"]})
    const ret0 = s.v_compute(source)
    expect(ret0).to.be.equal(new Float64Array([1.1, 2.2, 3.3]))

    source.stream({foo: [4], bar: [0.4]})
    const ret1 = s.v_compute(source)
    expect(ret1).to.be.equal(new Float64Array([1.1, 2.2, 3.3, 4.4]))
  })

  it("should re-compute every time its fields change", () => {
    const source = ColumnDataSource.create({data: {foo: [1, 2, 3], bar: [3, 2, 1]}})

    const s = Stack.create({fields: ["foo"]})
    expect(s.v_compute(source)).to.be.equal(new Float64Array([1, 2, 3]))

    s.fields = ["bar"]
    expect(s.v_compute(source)).to.be.equal(new Float64Array([3, 2, 1]))

    s.fields = ["foo", "bar"]
    expect(s.v_compute(source)).to.be.equal(new Float64Array([4, 4, 4]))
  })

  it("should update a glyph every time its fields change", async () => {
    const source = ColumnDataSource.create({data: {x: [1, 2, 3], a: [1, 2, 3], b: [3, 2, 1]}})
    const top = Stack.create({fields: ["a"]})
    const glyph = VBar.create({x: {field: "x"}, top: {expr: top}, width: 0.5})
    const renderer = GlyphRenderer.create({glyph, data_source: source})
    const plot = fig([200, 200], {x_range: [0, 4], y_range: [0, 7], renderers: [renderer]})
    const {view} = await display(plot)
    const glyph_view = view.owner.get_one(renderer).glyph
    expect_instanceof(glyph_view, VBarView)
    expect([...glyph_view.top]).to.be.equal([1, 2, 3])

    top.fields = ["b"]
    await view.ready
    expect([...glyph_view.top]).to.be.equal([3, 2, 1])

    top.fields = ["a", "b"]
    await view.ready
    expect([...glyph_view.top]).to.be.equal([4, 4, 4])
  })
})
