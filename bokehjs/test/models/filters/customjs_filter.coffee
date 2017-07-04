{expect} = require "chai"
utils = require "../../utils"

{CustomJSFilter} = utils.require("models/filters/customjs_filter")
{Range1d} = utils.require("models/ranges/range1d")
{ColumnDataSource} = utils.require("models/sources/column_data_source")

describe "CustomJSFilter", ->

  describe "default creation", ->
    filter = new CustomJSFilter()

    it "should have empty args", ->
      expect(filter.args).to.be.deep.equal {}

    it "should have empty code property", ->
      expect(filter.code).to.be.equal ""

  describe "values property", ->

    it "should return an array", ->
      filter = new CustomJSFilter()
      expect(filter.values).to.be.an.instanceof Array

    it "should contain the args values in order", ->
      rng1 = Range1d()
      rng2 = Range1d()
      filter = new CustomJSFilter({args: {foo: rng1, bar: rng2}})
      expect(filter.values).to.be.deep.equal([rng1, rng2])

  describe "func property", ->

    it "should return a Function", ->
      filter = new CustomJSFilter()
      expect(filter.func).to.be.an.instanceof Function

    it "should have code property as function body", ->
      filter = new CustomJSFilter({code: "return 10"})
      f = new Function("source", "require", "exports", "return 10")
      expect(filter.func.toString()).to.be.equal f.toString()

    it "should have values as function args", ->
      rng = new Range1d()
      filter = new CustomJSFilter({args: {foo: rng.ref()}, code: "return 10"})
      f = new Function("foo", "source", "require", "exports", "return 10")
      expect(filter.func.toString()).to.be.equal f.toString()

  describe "compute_indices", ->

    cds = new ColumnDataSource({
      data:
        x: ["a", "a", "b", "b", "b"]
        y: [1, 2, 3, 4, 5]
    })

    it "should execute the code and return the result", ->
      filter = new CustomJSFilter({code: "return [0]"})
      expect(filter.compute_indices(cds)).to.be.deep.equal [0]

    it "should compute indices using a source", ->
      code = """
      var indices = [];
      for (var i = 0; i <= source.get_length(); i++){
        if (source.data['x'][i] == 'a') {
          indices.push(true);
        } else {
          indices.push(false);
        }
      }
      return indices;
      """
      filter = new CustomJSFilter({code: code})
      expect(filter.compute_indices(cds)).to.be.deep.equal [0, 1]

    it "should compute indices using an arg property", ->
      code = """
      var indices = [];
      for (var i = 0; i <= source.get_length(); i++){
        if (source.data['y'][i] == foo.start) {
          indices.push(true);
        } else {
          indices.push(false);
        }
      }
      return indices;
      """
      rng = new Range1d({start: 5, end: 21})
      filter = new CustomJSFilter({args: {foo: rng}, code: code})
      expect(filter.compute_indices(cds)).to.be.deep.equal [4]
