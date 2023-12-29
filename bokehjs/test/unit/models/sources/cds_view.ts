import {expect} from "assertions"

import type {CDSViewView} from "@bokehjs/models/sources/cds_view"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {Selection} from "@bokehjs/models/selections/selection"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {BooleanFilter} from "@bokehjs/models/filters/boolean_filter"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {IntersectionFilter} from "@bokehjs/models/filters/intersection_filter"
import {UnionFilter} from "@bokehjs/models/filters/union_filter"
import {InversionFilter} from "@bokehjs/models/filters/inversion_filter"
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
  const filter3 = new BooleanFilter({booleans: [true, true, false, false, true]})
  const filter_null = new IndexFilter()

  describe("compute_indices", () => {

    it("is called on init and sets the cds view's indices", async () => {
      const cds = new CDSView({filter: filter1})
      await build(cds, source)
      expect([...cds.indices]).to.be.equal([0, 1, 2])
    })

    it("updates indices when filter is changed", async () => {
      const view = new CDSView({filter: filter1})
      await build(view, source)
      expect([...view.indices]).to.be.equal([0, 1, 2])
      view.filter = filter2
      expect([...view.indices]).to.be.equal([1, 2, 3])
      view.filter = filter3
      expect([...view.indices]).to.be.equal([0, 1, 4])
    })

    it("updates indices when filter's properties are changed", async () => {
      const boolean_filter = new BooleanFilter({booleans: [true, true, false, false, true]})
      const boolean_view = new CDSView({filter: boolean_filter})
      await build(boolean_view, source)
      expect([...boolean_view.indices]).to.be.equal([0, 1, 4])
      boolean_filter.booleans = [false, true, true, false, true]
      expect([...boolean_view.indices]).to.be.equal([1, 2, 4])

      const index_filter = new IndexFilter({indices: [0, 1, 2]})
      const index_view = new CDSView({filter: index_filter})
      await build(index_view, source)
      expect([...index_view.indices]).to.be.equal([0, 1, 2])
      index_filter.indices = [1, 2, 3]
      expect([...index_view.indices]).to.be.equal([1, 2, 3])

      const union_filter = new UnionFilter({operands: [boolean_filter, index_filter]})
      const union_view = new CDSView({filter: union_filter})
      await build(union_view, source)
      expect([...union_view.indices]).to.be.equal([1, 2, 3, 4])
      boolean_filter.booleans = [false, false, false, false, true]
      index_filter.indices = [0, 3]
      expect([...union_view.indices]).to.be.equal([0, 3, 4])
      expect([...index_view.indices]).to.be.equal([0, 3])
      expect([...boolean_view.indices]).to.be.equal([4])

      const inversion_filter = new InversionFilter({operand: union_filter})
      const intersection_view = new CDSView({filter: inversion_filter})
      await build(intersection_view, source)
      expect([...intersection_view.indices]).to.be.equal([1, 2])
      boolean_filter.booleans = [true, false, false, true, false]
      index_filter.indices = [1, 2, 4]
      expect([...intersection_view.indices]).to.be.equal([])
      expect([...union_view.indices]).to.be.equal([0, 1, 2, 3, 4])
      expect([...index_view.indices]).to.be.equal([1, 2, 4])
      expect([...boolean_view.indices]).to.be.equal([0, 3])
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
      expect(view.indices_map).to.be.equal(new Map([[1, 0], [2, 1]]))
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
