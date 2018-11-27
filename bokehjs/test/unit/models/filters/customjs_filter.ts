import {expect} from "chai"

import {CustomJSFilter} from "@bokehjs/models/filters/customjs_filter"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("CustomJSFilter", () => {

  describe("default creation", () => {
    const filter = new CustomJSFilter()

    it("should have empty args", () => {
      expect(filter.args).to.be.deep.equal({})
    })

    it("should have empty code property", () => {
      expect(filter.code).to.be.equal("")
    })
  })

  describe("values property", () => {

    it("should return an array", () => {
      const filter = new CustomJSFilter()
      expect(filter.values).to.be.an.instanceof(Array)
    })

    it("should contain the args values in order", () => {
      const rng1 = new Range1d()
      const rng2 = new Range1d()
      const filter = new CustomJSFilter({args: {foo: rng1, bar: rng2}})
      expect(filter.values).to.be.deep.equal([rng1, rng2])
    })
  })

  describe("func property", () => {

    it("should return a Function", () => {
      const filter = new CustomJSFilter()
      expect(filter.func).to.be.an.instanceof(Function)
    })

    it("should have code property as function body", () => {
      const filter = new CustomJSFilter({code: "return 10"})
      const f = new Function("source", "require", "exports", "'use strict';\nreturn 10")
      expect(filter.func.toString()).to.be.equal(f.toString())
    })

    it("should have values as function args", () => {
      const rng = new Range1d()
      const filter = new CustomJSFilter({args: {foo: rng.ptr()}, code: "return 10"})
      const f = new Function("foo", "source", "require", "exports", "'use strict';\nreturn 10")
      expect(filter.func.toString()).to.be.equal(f.toString())
    })
  })

  describe("compute_indices", () => {

    const cds = new ColumnDataSource({
      data: {
        x: ["a", "a", "b", "b", "b"],
        y: [1, 2, 3, 4, 5],
      },
    })

    it("should execute the code and return the result", () => {
      const filter = new CustomJSFilter({code: "return [0]"})
      expect(filter.compute_indices(cds)).to.be.deep.equal([0])
    })

    it("should compute indices using a source", () => {
      const code = `
        var column = source.data["x"];
        var indices = [];
        for (var i = 0; i < source.get_length(); i++) {
          indices.push(column[i] == "a");
        }
        return indices;
      `
      const filter = new CustomJSFilter({code})
      expect(filter.compute_indices(cds)).to.be.deep.equal([0, 1])
    })

    it("should compute indices using an arg property", () => {
      const code = `
        var column = source.data["y"];
        var indices = [];
        for (var i = 0; i < source.get_length(); i++) {
          indices.push(column[i] == foo.start)
        }
        return indices;
      `
      const rng = new Range1d({start: 5, end: 21})
      const filter = new CustomJSFilter({args: {foo: rng}, code})
      expect(filter.compute_indices(cds)).to.be.deep.equal([4])
    })
  })
})
