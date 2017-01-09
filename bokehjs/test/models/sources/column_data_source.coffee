_ = require "underscore"

{expect} = require "chai"
utils = require "../../utils"
{ stdoutTrap, stderrTrap } = require 'logtrap'

{set_log_level} = utils.require "core/logging"

{ColumnDataSource, concat_typed_arrays, stream_to_column, patch_to_column} = utils.require("models/sources/column_data_source")

describe "column_data_source module", ->

  describe "concat_typed_arrays", ->

    it "should concat Float32 arrays", ->
      a = new Float32Array([1,2])
      b = new Float32Array([3,4])
      c = concat_typed_arrays(a, b)
      expect(c).to.be.instanceof Float32Array
      expect(c).to.be.deep.equal new Float32Array([1,2,3,4])

    it "should concat Float64 arrays", ->
      a = new Float64Array([1,2])
      b = new Float64Array([3,4])
      c = concat_typed_arrays(a, b)
      expect(c).to.be.instanceof Float64Array
      expect(c).to.be.deep.equal new Float64Array([1,2,3,4])

   it "should concat Int32 arrays", ->
      a = new Int32Array([1,2])
      b = new Int32Array([3,4])
      c = concat_typed_arrays(a, b)
      expect(c).to.be.instanceof Int32Array
      expect(c).to.be.deep.equal new Int32Array([1,2,3,4])

  describe "patch_to_column", ->

    it "should patch Arrays to Arrays", ->
      a = [1,2,3,4,5]
      patch_to_column(a, [[3, 100]])
      expect(a).to.be.instanceof Array
      expect(a).to.be.deep.equal [1,2,3,100,5]

    it "should patch Float32 to Float32", ->
      a = new Float32Array([1,2,3,4,5])
      patch_to_column(a, [[3, 100]])
      expect(a).to.be.instanceof Float32Array
      expect(a).to.be.deep.equal new Float32Array([1,2,3,100,5])

    it "should patch Float64 to Float64", ->
      a = new Float64Array([1,2,3,4,5])
      patch_to_column(a, [[3, 100]])
      expect(a).to.be.instanceof Float64Array
      expect(a).to.be.deep.equal new Float64Array([1,2,3,100,5])

    it "should patch Int32 to Int32", ->
      a = new Int32Array([1,2,3,4,5])
      patch_to_column(a, [[3, 100]])
      expect(a).to.be.instanceof Int32Array
      expect(a).to.be.deep.equal new Int32Array([1,2,3,100,5])

    it "should handle multi-part patches", ->
      a = [1,2,3,4,5]
      patch_to_column(a, [[3, 100], [0, 10], [4, -1]])
      expect(a).to.be.instanceof Array
      expect(a).to.be.deep.equal [10,2,3,100,-1]

  describe "stream_to_column", ->

    it "should stream Arrays to Arrays", ->
      a = [1,2,3,4,5]
      r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof Array
      expect(r).to.be.deep.equal [1,2,3,4,5,100,200]

    it "should stream Arrays to Arrays with rollover", ->
      a = [1,2,3,4,5]
      r = stream_to_column(a, [100, 200, 300], 5)
      expect(r).to.be.instanceof Array
      expect(r).to.be.deep.equal [4,5,100,200,300]

      a = [1,2,3,4,5]
      r = stream_to_column(a, [100, 200, 300], 6)
      expect(r).to.be.instanceof Array
      expect(r).to.be.deep.equal [3,4,5,100,200,300]

    it "should stream Float32 to Float32", ->
      a = new Float32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof Float32Array
      expect(r).to.be.deep.equal new Float32Array([1,2,3,4,5,100,200])

    it "should stream Float32 to Float32 with rollover", ->
      # test when col is already at rollover len
      a = new Float32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 5)
      expect(r).to.be.instanceof Float32Array
      expect(r).to.be.deep.equal new Float32Array([4,5,100,200,300])

      # test when col is not at rollover len but will exceed
      a = new Float32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 6)
      expect(r).to.be.instanceof Float32Array
      expect(r).to.be.deep.equal new Float32Array([3,4,5,100,200,300])

      # test when col is not at rollover len and will not exceed
      a = new Float32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 10)
      expect(r).to.be.instanceof Float32Array
      expect(r).to.be.deep.equal new Float32Array([1,2,3,4,5,100,200,300])

    it "should stream Float64 to Float64", ->
      a = new Float64Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof Float64Array
      expect(r).to.be.deep.equal new Float64Array([1,2,3,4,5,100,200])

    it "should stream Float64 to Float64 with rollover", ->
      # test when col is already at rollover len
      a = new Float64Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 5)
      expect(r).to.be.instanceof Float64Array
      expect(r).to.be.deep.equal new Float64Array([4,5,100,200,300])

      # test when col is not at rollover len but will exceed
      a = new Float64Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 6)
      expect(r).to.be.instanceof Float64Array
      expect(r).to.be.deep.equal new Float64Array([3,4,5,100,200,300])

      # test when col is not at rollover len and will not exceed
      a = new Float64Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 10)
      expect(r).to.be.instanceof Float64Array
      expect(r).to.be.deep.equal new Float64Array([1,2,3,4,5,100,200,300])

    it "should stream Int32 to Int32", ->
      a = new Int32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof Int32Array
      expect(r).to.be.deep.equal new Int32Array([1,2,3,4,5,100,200])

    it "should stream Int32 to Int32 with rollover", ->
      # test when col is already at rollover len
      a = new Int32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 5)
      expect(r).to.be.instanceof Int32Array
      expect(r).to.be.deep.equal new Int32Array([4,5,100,200,300])

      # test when col is not at rollover len but will exceed
      a = new Int32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 6)
      expect(r).to.be.instanceof Int32Array
      expect(r).to.be.deep.equal new Int32Array([3,4,5,100,200,300])

      # test when col is not at rollover len and will not exceed
      a = new Int32Array([1,2,3,4,5])
      r = stream_to_column(a, [100, 200, 300], 10)
      expect(r).to.be.instanceof Int32Array
      expect(r).to.be.deep.equal new Int32Array([1,2,3,4,5,100,200,300])

  describe "default creation", ->
    r = new ColumnDataSource()

    it "should have empty data", ->
      expect(r.data).to.be.deep.equal {}

    it "should have empty columns", ->
      expect(r.columns()).to.be.deep.equal []

    it "should return null for get_length", ->
      expect(r.get_length()).to.be.null

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: []}})

    it "should return supplied data", ->
      expect(r.data).to.be.deep.equal {foo: []}

    it "should return one column", ->
      expect(r.columns()).to.be.deep.equal ["foo"]

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: [], bar:[]}})

    it "should return supplied data", ->
      expect(r.data).to.be.deep.equal {foo: [], bar: []}

    it "should return all columns", ->
      expect((r.columns()).sort()).to.be.deep.equal ["bar", "foo"]

  describe "get_length function", ->

    it "should return 0 for empty columns", ->
      r = new ColumnDataSource({data: {foo: []}})
      expect(r.get_length()).to.be.equal 0

      r = new ColumnDataSource({data: {foo: [], bar:[]}})
      expect(r.get_length()).to.be.equal 0

    it "should return common length for columns with data", ->
      r = new ColumnDataSource({data: {foo: [10]}})
      expect(r.get_length()).to.be.equal 1

      r = new ColumnDataSource({data: {foo: [10], bar:[10]}})
      expect(r.get_length()).to.be.equal 1

      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r.get_length()).to.be.equal 2

    it "should not alert for consistent column lengths (including zero)", ->
      set_log_level("info")
      r = new ColumnDataSource({data: {foo: []}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [], bar:[]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10], bar:[10]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

    it "should alert if column lengths are inconsistent", ->
      set_log_level("info")
      r = new ColumnDataSource({data: {foo: [1], bar: [1,2]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal "[bokeh] data source has columns of inconsistent lengths\n"

      r = new ColumnDataSource({data: {foo: [1], bar: [1,2], baz: [1]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal "[bokeh] data source has columns of inconsistent lengths\n"
