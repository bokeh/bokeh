{expect} = require "chai"

{ColumnDataSource} = require("models/sources/column_data_source")
{Stack} = require("models/expressions/stack")

describe "Stack", ->

    it "should should compute for a source", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
      s = new Stack({fields: ['foo']})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1, 2, 3])

      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3])

    it "should should compute for different sources", ->
      source1 = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
      source2 = new ColumnDataSource({data: {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}})
      s = new Stack({fields: ['foo']})
      ret = s.v_compute(source1)
      expect(ret).to.deep.equal new Float64Array([1, 2, 3])

      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source1)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3])

      s = new Stack({fields: ['foo']})
      ret = s.v_compute(source2)
      expect(ret).to.deep.equal new Float64Array([10, 20, 30])

      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source2)
      expect(ret).to.deep.equal new Float64Array([10.01, 20.02, 30.03])

    it "should should re-compute if a source changes", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3])

      source.data = {foo: [10, 20, 30], bar: [0.01, 0.02, 0.03]}
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([10.01, 20.02, 30.03])

    it "should should re-compute if a source patches", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3])

      source.patch({"foo": [[1, 12]]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 12.2, 3.3])

      source.patch({"bar": [[0, 1.1]]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([2.1, 12.2, 3.3])

    it "should should re-compute if a source streams", ->
      source = new ColumnDataSource({data: {foo: [1, 2, 3], bar: [0.1, 0.2, 0.3]}})
      s = new Stack({fields: ['foo', 'bar']})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3])

      source.stream({foo: [4], bar: [0.4]})
      ret = s.v_compute(source)
      expect(ret).to.deep.equal new Float64Array([1.1, 2.2, 3.3, 4.4])
