import {expect} from "assertions"

import {CDSView} from "@bokehjs/models/sources/cds_view"
import {Selection} from "@bokehjs/models/selections/selection"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {GroupFilter} from "@bokehjs/models/filters/group_filter"

describe("CDSView", () => {

  const cds = new ColumnDataSource({
    data: {
      x: ["a", "a", "b", "b", "b"],
      y: [1, 2, 3, 4, 5],
    },
  })

  const filter1 = new IndexFilter({indices: [0, 1, 2]})
  const filter2 = new IndexFilter({indices: [1, 2, 3]})
  const filter_null = new IndexFilter()

  describe("compute_indices", () => {

    it("is called on init and sets the cds view's indices", () => {
      const view = new CDSView({source: cds, filters: [filter1]})
      expect([...view.indices]).to.be.equal([0, 1, 2])
    })

    it("updates indices when filters is changed", () => {
      const view = new CDSView({source: cds, filters: [filter1]})
      expect([...view.indices]).to.be.equal([0, 1, 2])
      view.filters = [filter2]
      expect([...view.indices]).to.be.equal([1, 2, 3])
    })

    it("computes indices based on the intersection of filters", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect([...view.indices]).to.be.equal([1, 2])
    })

    it("computes indices ignoring null filters", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2, filter_null]})
      expect([...view.indices]).to.be.equal([1, 2])
    })
  })

  describe("indices_map_to_subset", () => {

    it("sets indices_map, a mapping from full data set indices to subset indices", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.indices_map).to.be.equal({1: 0, 2: 1})
    })
  })

  describe("functions for converting selections and indices", () => {

    it("convert_selection_from_subset", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2]})
      const selection = new Selection({indices: [0]})
      expect(view.convert_selection_from_subset(selection).indices).to.be.equal([1])
    })

    it("convert_selection_to_subset", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2]})
      const selection = new Selection({indices: [1]})
      expect(view.convert_selection_to_subset(selection).indices).to.be.equal([0])
    })

    it("convert_indices_from_subset", () => {
      const view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.convert_indices_from_subset([0, 1])).to.be.equal([1, 2])
    })
  })

  it("should update its indices when its source streams new data", () => {
    const cds = new ColumnDataSource({data: {x: [], y: []}})
    const new_data = {x: [1], y: [1]}

    const view = new CDSView({source: cds})
    expect([...view.indices]).to.be.equal([])
    cds.stream(new_data)
    expect([...view.indices]).to.be.equal([0])
  })

  it("should update its indices when its source patches new data", () => {
    const cds = new ColumnDataSource({data: {x: ["a"], y: [1]}})
    const group_filter = new GroupFilter({column_name: "x", group: "b"})

    const view = new CDSView({source: cds, filters: [group_filter]})
    expect([...view.indices]).to.be.equal([])
    cds.patch({x: [[0, "b"]]})
    expect([...view.indices]).to.be.equal([0])
  })

  it("should update its indices when its source's data changes", () => {
    const data1 = {x: ["a"], y: [1]}
    const data2 = {x: ["b"], y: [1]}
    const cds = new ColumnDataSource({data: data1})
    const group_filter = new GroupFilter({column_name: "x", group: "b"})

    const view = new CDSView({source: cds, filters: [group_filter]})
    expect([...view.indices]).to.be.equal([])
    cds.data = data2
    expect([...view.indices]).to.be.equal([0])
  })
})
