{expect} = require "chai"

{ColumnDataSource} = require("models/sources/column_data_source")
{CumSum} = require("models/expressions/cumsum")

describe "CumSum", ->

    it "should should compute for a source", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10])

      s = new CumSum({field: 'foo', include_zero: true})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([0, 1, 3, 6])

    it "should should compute for different sources", ->
      source1 = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
      source2 = new ColumnDataSource({data: {foo: [10, 20, 30, 40]}})
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source1)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10])

      s = new CumSum({field: 'foo', include_zero: true})
      ret = s.v_compute(source1)
      expect(ret).to.deep.equal new Float64Array([0, 1, 3, 6])
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source2)
      expect(ret).to.deep.equal new Float64Array([10, 30, 60, 100])

      s = new CumSum({field: 'foo', include_zero: true})
      ret = s.v_compute(source2)
      expect(ret).to.deep.equal new Float64Array([0, 10, 30, 60])

    it "should should re-compute if a source changes", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10])

      source.data = {foo: [10, 20, 30, 40]}
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([10, 30, 60, 100])

    it "should should re-compute if a source patches", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10])

      source.patch({"foo": [[1, 12]]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 13, 16, 20])

      source.patch({"foo": [[0, 1.1]]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 13.1, 16.1, 20.1])

    it "should should re-compute if a source streams", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3, 4]}})
      s = new CumSum({field: 'foo'})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10])

      source.stream({foo: [5]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 3, 6, 10, 15])
