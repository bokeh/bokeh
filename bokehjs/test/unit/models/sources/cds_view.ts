import {expect} from "assertions"

import type {CDSViewView} from "@bokehjs/models/sources/cds_view"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {Selection} from "@bokehjs/models/selections/selection"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {IntersectionFilter} from "@bokehjs/models/filters/intersection_filter"
import {build_view} from "@bokehjs/core/build_views"
import type * as p from "@bokehjs/core/properties"
import {View} from "@bokehjs/core/view"
import {Model} from "@bokehjs/model"

class DummyView extends View {
  declare model: DummyModel

  get data_source(): p.Property<ColumnDataSource> {
    return this.model.properties.source
  }
}

namespace DummyModel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    source: p.Property<ColumnDataSource>
  }
}

interface DummyModel extends DummyModel.Attrs {}

class DummyModel extends Model {
  declare properties: DummyModel.Props
  declare __view_type__: DummyView

  constructor(attrs?: Partial<DummyModel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DummyView

    this.define<any>(({Ref}) => ({
      source: [ Ref(ColumnDataSource) ],
    }))
  }
}

export async function build(cds: CDSView, source: ColumnDataSource): Promise<CDSViewView> {
  const model = new DummyModel({source})
  const parent = await build_view(model)
  return await build_view(cds, {parent})
}

describe("CDSView", () => {

  const source = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
      y: [1, 2, 3, 4, 5],
    },
  })

  const filter1 = new IndexFilter({indices: [0, 1, 2]})
  const filter2 = new IndexFilter({indices: [1, 2, 3]})
  const filter_null = new IndexFilter()

  describe("compute_indices", () => {

    it("is called on init and sets the cds view's indices", async () => {
      const cds = new CDSView({filter: filter1})
      await build(cds, source)
      expect([...cds.indices]).to.be.equal([0, 1, 2])
    })

    it("updates indices when filters is changed", async () => {
      const view = new CDSView({filter: filter1})
      await build(view, source)
      expect([...view.indices]).to.be.equal([0, 1, 2])
      view.filter = filter2
      expect([...view.indices]).to.be.equal([1, 2, 3])
    })

    it("computes indices based on the intersection of filters", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2]})})
      await build(view, source)
      expect([...view.indices]).to.be.equal([1, 2])
    })

    it("computes indices ignoring null filters", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2, filter_null]})})
      await build(view, source)
      expect([...view.indices]).to.be.equal([1, 2])
    })
  })

  describe("indices_map_to_subset", () => {

    it("sets indices_map, a mapping from full data set indices to subset indices", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2]})})
      await build(view, source)
      expect(view.indices_map).to.be.equal({1: 0, 2: 1})
    })
  })

  describe("functions for converting selections and indices", () => {

    it("convert_selection_from_subset", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2]})})
      await build(view, source)
      const selection = new Selection({indices: [0]})
      expect(view.convert_selection_from_subset(selection).indices).to.be.equal([1])
    })

    it("convert_selection_to_subset", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2]})})
      await build(view, source)
      const selection = new Selection({indices: [1]})
      expect(view.convert_selection_to_subset(selection).indices).to.be.equal([0])
    })

    it("convert_indices_from_subset", async () => {
      const view = new CDSView({filter: new IntersectionFilter({operands: [filter1, filter2]})})
      await build(view, source)
      expect(view.convert_indices_from_subset([0, 1])).to.be.equal([1, 2])
    })
  })

  it("should update its indices when its source streams new data", async () => {
    const source = new ColumnDataSource({data: {x: [], y: []}})
    const new_data = {x: [1], y: [1]}

    const view = new CDSView()
    await build(view, source)
    expect([...view.indices]).to.be.equal([])
    source.stream(new_data)
    expect([...view.indices]).to.be.equal([0])
  })

  it("should update its indices when its source patches new data", async () => {
    const source = new ColumnDataSource({data: {x: ["a"], y: [1]}})
    const group_filter = new GroupFilter({column_name: "x", group: "b"})

    const view = new CDSView({filter: group_filter})
    await build(view, source)
    expect([...view.indices]).to.be.equal([])
    source.patch({x: [[0, "b"]]})
    expect([...view.indices]).to.be.equal([0])
  })

  it("should update its indices when its source's data changes", async () => {
    const data1 = {x: ["a"], y: [1]}
    const data2 = {x: ["b"], y: [1]}
    const source = new ColumnDataSource({data: data1})
    const group_filter = new GroupFilter({column_name: "x", group: "b"})

    const view = new CDSView({filter: group_filter})
    await build(view, source)
    expect([...view.indices]).to.be.equal([])
    source.data = data2
    expect([...view.indices]).to.be.equal([0])
  })
})
