{expect} = require "chai"
utils = require "../../utils"

{CDSView} = utils.require("models/sources/cds_view")
{ColumnDataSource} = utils.require("models/sources/column_data_source")
{Filter} = utils.require("models/filters/filter")
hittest = utils.require("core/hittest")

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
      selection = hittest.create_hit_test_result()
      selection['1d']['indices'] = [0]
      expect(view.convert_selection_from_subset(selection)['1d']['indices']).to.be.deep.equal [1]

    it "convert_selection_to_subset", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      selection = hittest.create_hit_test_result()
      selection['1d']['indices'] = [1]
      expect(view.convert_selection_to_subset(selection)['1d']['indices']).to.be.deep.equal [0]

    it "convert_indices_from_subset", ->
      view = new CDSView({source: cds, filters: [filter1, filter2]})
      expect(view.convert_indices_from_subset([0, 1])).to.be.deep.equal [1, 2]
