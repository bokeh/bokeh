import {expect} from "#framework/assertions"

import {Indices} from "@bokehjs/core/types"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Text} from "@bokehjs/models/glyphs/text"
import {Quad} from "@bokehjs/models/glyphs/quad"
import {LabelSet} from "@bokehjs/models/annotations/label_set"
import {HTMLLabelSet} from "@bokehjs/models/annotations/html/label_set"
import {Patch} from "@bokehjs/models/glyphs/patch"
import {LegendItem} from "@bokehjs/models/annotations/legend_item"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"

// Exercise the declarations migrated from the specialized nullable spec classes.
describe("nullable model specs", () => {
  for (const {name, create} of [
    {name: "Text", create: () => Text.create()},
    {name: "LabelSet", create: () => LabelSet.create()},
    {name: "HTMLLabelSet", create: () => HTMLLabelSet.create()},
  ]) {
    it(`should preserve null ${name} text through selection and source updates`, () => {
      const model = create()
      model.text = {field: "text"}
      const source = ColumnDataSource.create({data: {text: ["first", null, "last"]}})
      const prop = model.properties.text
      expect([...prop.uniform(source)]).to.be.equal(["first", null, "last"])
      expect([...prop.uniform(source).select(Indices.from_indices(3, [1, 2]))]).to.be.equal([null, "last"])
      source.data = {text: [null, "updated", null]}
      expect([...prop.uniform(source)]).to.be.equal([null, "updated", null])
    })
  }

  it("should preserve null legend labels through selection and source updates", () => {
    const source = ColumnDataSource.create({data: {text: ["first", null, "last"]}})
    const renderer = GlyphRenderer.create({glyph: Text.create(), data_source: source})
    const item = LegendItem.create({label: {field: "text"}, renderers: [renderer]})
    const prop = item.properties.label
    expect([...prop.uniform(source).select(Indices.from_indices(3, [1, 2]))]).to.be.equal([null, "last"])
    source.data = {text: [null, "updated", null]}
    expect([...prop.uniform(source)]).to.be.equal([null, "updated", null])
    item.label = null
    expect(prop.uniform(source).get(0)).to.be.null
  })

  it("should preserve null hatch patterns in vector and scalar visuals", () => {
    const source = ColumnDataSource.create({data: {pattern: ["/", null, "x"]}})
    const quad = Quad.create({hatch_pattern: {field: "pattern"}})
    const prop = quad.properties.hatch_pattern
    expect([...prop.uniform(source).select(Indices.from_indices(3, [0, 1]))]).to.be.equal(["/", null])
    source.data = {pattern: [null, "x", null]}
    expect([...prop.uniform(source)]).to.be.equal([null, "x", null])
    const patch = Patch.create({hatch_pattern: null})
    expect(patch.properties.hatch_pattern.uniform(source).get(0)).to.be.null
    patch.hatch_pattern = "/"
    expect(patch.properties.hatch_pattern.uniform(source).get(0)).to.be.equal("/")
  })
})
