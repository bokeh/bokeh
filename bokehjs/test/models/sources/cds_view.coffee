{expect} = require "chai"

{CDSView} = require("models/sources/cds_view")
{ColumnDataSource} = require("models/sources/column_data_source")
{Filter} = require("models/filters/filter")
{GroupFilter} = require("models/filters/group_filter")
hittest = require("core/hittest")

describe "CDSView", ->

  cds = new ColumnDataSource({
    data:
      x: ["a", "a", "b", "b", "b"]
      y: [1, 2, 3, 4, 5]
  })

  filter1 = new Filter({filter: [0, 1, 2]})
  filter2 = new Filter({filter: [1, 2, 3]})
  filter_null = new Filter()

  describe "compute_indices", ->

    it "is called on init and sets the cds view's indices", ->
      view = new CDSView({source: cds, filters: [filter1]})
      expect(view.indices).to.be.deep.equal([0, 1, 2])

    it "updates indices when filters is changed", ->
      view = new CDSView({source: cds, filters: [filter1]})
      expect(view.indices).to.be.deep.equal([0, 1, 2])
      view.filters = [filter2]
      expect(view.indices).to.be.deep.equal([1, 2, 3])

    it "computes indices based on the intersection of filters", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.indices).to.be.deep.equal([1, 2])

    it "computes indices ignoring null filters", ->
      view = new CDSView({source: cds, filters: [filter1, filter2, filter_null]})
      expect(view.indices).to.be.deep.equal([1, 2])

  describe "indices_map_to_subset", ->

    it "sets indices_map, a mapping from full data set indices to subset indices", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.indices_map).to.be.deep.equal({1: 0, 2: 1})

  describe "functions for converting selections and indices", ->

    it "convert_selection_from_subset", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      selection = hittest.create_empty_hit_test_result()
      selection.indices = [0]
      expect(view.convert_selection_from_subset(selection).indices).to.be.deep.equal [1]

    it "convert_selection_to_subset", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      selection = hittest.create_empty_hit_test_result()
      selection.indices = [1]
      expect(view.convert_selection_to_subset(selection).indices).to.be.deep.equal [0]

    it "convert_indices_from_subset", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.convert_indices_from_subset([0, 1])).to.be.deep.equal [1, 2]

  it "should update its indices when its source streams new data", ->
    cds = new ColumnDataSource({data: {x: [], y: []}})
    new_data = {x: [1], y: [1]}

    view = new CDSView({source: cds})
    expect(view.indices).to.be.deep.equal([])
    cds.stream(new_data)
    expect(view.indices).to.be.deep.equal([0])

  it "should update its indices when its source patches new data", ->
    cds = new ColumnDataSource({data: {x: ["a"], y: [1]}})
    group_filter = new GroupFilter({column_name: "x", group: "b"})

    view = new CDSView({source: cds, filters: [group_filter]})
    expect(view.indices).to.be.deep.equal([])
    cds.patch({"x" :[[0, "b"]]})
    expect(view.indices).to.be.deep.equal([0])

  it "should update its indices when its source's data changes", ->
    data1 = {x: ["a"], y: [1]}
    data2 = {x: ["b"], y: [1]}
    cds = new ColumnDataSource({data: data1})
    group_filter = new GroupFilter({column_name: "x", group: "b"})

    view = new CDSView({source: cds, filters: [group_filter]})
    expect(view.indices).to.be.deep.equal([])
    cds.data = data2
    expect(view.indices).to.be.deep.equal([0])
