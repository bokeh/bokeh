import {expect} from "#framework/assertions"

import {figure} from "@bokehjs/api/figure"
import type * as p from "@bokehjs/core/properties"
import type {Arrayable, Dict} from "@bokehjs/core/types"
import {dict, keys, to_object} from "@bokehjs/core/util/object"
import {isNumber} from "@bokehjs/core/util/types"
import type {Index} from "@bokehjs/core/util/templating"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {DataView} from "@bokehjs/models/sources/data_view"
import {DataSource, type DataChange} from "@bokehjs/models/sources/data_source"
import {IndexedDataSource} from "@bokehjs/models/sources/indexed_data_source"

namespace RecordDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    records: p.Property<Dict<unknown>[]>
  }
}

interface RecordDataSource extends RecordDataSource.Attrs {}

class RecordDataSource extends IndexedDataSource {
  declare properties: RecordDataSource.Props

  static {
    this.define<RecordDataSource.Props>(({List, Dict, Unknown}) => ({
      records: [ List(Dict(Unknown)), [] ],
    }))
  }

  get_length(): number {
    return this.records.length
  }

  get_field(name: string): Arrayable | null {
    if (!this.fields().includes(name)) {
      return null
    }
    return this.records.map((record) => dict(record).get(name))
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    return to_object(this.records[i])
  }

  fields(): string[] {
    return [...new Set(this.records.flatMap((record) => keys(record)))]
  }
}

class CompositeDataSource extends DataSource {}

describe("DataSource", () => {
  it("does not assume a selectable record axis", () => {
    const source = CompositeDataSource.create()

    expect("selected" in source).to.be.false
    expect("selection_policy" in source).to.be.false
    expect("get_length" in source).to.be.false
  })
})

describe("IndexedDataSource", () => {
  const source = RecordDataSource.create({
    records: [
      {x: 1, y: 2, group: "a"},
      {x: 3, y: 4, group: "b"},
      {x: 5, y: 6, group: "a"},
    ],
  })

  it("provides a storage-neutral indexed-field contract", () => {
    expect(source.length).to.be.equal(3)
    expect(source.fields()).to.be.equal(["x", "y", "group"])
    expect(source.get_field("x")).to.be.equal([1, 3, 5])
    expect(source.get_field("missing")).to.be.null
    expect(source.get_record(1)).to.be.equal({x: 3, y: 4, group: "b"})
  })

  it("resolves dataspec fields without columnar storage", () => {
    const glyph = Scatter.create({x: {field: "x"}, y: {field: "y"}})
    expect(glyph.properties.x.array(source)).to.be.equal([1, 3, 5])
    expect(glyph.properties.y.array(source)).to.be.equal([2, 4, 6])
  })

  it("supports source-neutral filtering and views", () => {
    const filter = GroupFilter.create({field_name: "group", group: "a"})
    expect([...filter.compute_indices(source)]).to.be.equal([0, 2])

    const view = DataView.create({filter})
    view.compute_indices(source)
    expect([...view.indices]).to.be.equal([0, 2])
  })

  it("can be used by a glyph renderer", () => {
    const glyph = Scatter.create({x: {field: "x"}, y: {field: "y"}})
    const renderer = GlyphRenderer.create({glyph, data_source: source})
    expect(renderer.data_source as IndexedDataSource).to.be.equal(source)
    expect(renderer.get_selection_manager().source).to.be.equal(source)
  })

  it("can be used by the high-level plotting API", () => {
    const plot = figure()
    const renderer = plot.scatter({x: {field: "x"}, y: {field: "y"}, source})
    expect(renderer.data_source as IndexedDataSource).to.be.equal(source)
  })

  it("rejects sequence literals in the high-level API", () => {
    const plot = figure()
    expect(() => plot.scatter({x: [1, 2, 3], y: {field: "y"}, source})).to.throw(
      Error,
      "sequence literals cannot be used with a non-columnar data source",
    )
  })

  it("reports fine-grained in-place changes through a source-neutral signal", () => {
    const changes: DataChange[] = []
    source.data_changed.connect((event) => changes.push(event))
    source.data_changed.emit({fields: ["x"], indices: [1], structural: false})
    expect(changes).to.be.equal([{fields: ["x"], indices: [1], structural: false}])
  })
})
