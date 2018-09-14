{expect} = require "chai"
{ stdoutTrap, stderrTrap } = require 'logtrap'

{Set} = require("core/util/data_structures")
{set_log_level} = require "core/logging"

{keys} = require("core/util/object")
{ColumnDataSource, stream_to_column, slice, patch_to_column} = require("models/sources/column_data_source")

describe "column_data_source module", ->

  describe "slice", ->

    it "should return [ind, ind+1, 1] for scalars", ->
      expect(slice(0)).to.be.deep.equal [0, 1, 1]
      expect(slice(10)).to.be.deep.equal [10, 11, 1]

    it "should return start, stop, end for slice object", ->
      expect(slice({start:1, stop:10, step:2})).to.be.deep.equal [1, 10, 2]
      expect(slice({start:1, stop:10, step:2}, 5)).to.be.deep.equal [1, 10, 2]
      expect(slice({start:1, stop:10, step:2}, 15)).to.be.deep.equal [1, 10, 2]

    it "should return 0 for start when slice start is null", ->
      expect(slice({start:null, stop:10, step:2})).to.be.deep.equal [0, 10, 2]
      expect(slice({start:null, stop:10, step:2}, 5)).to.be.deep.equal [0, 10, 2]
      expect(slice({start:null, stop:10, step:2}, 15)).to.be.deep.equal [0, 10, 2]

    it "should return 1 for step when slice step is null", ->
      expect(slice({start:1, stop:10, step:null})).to.be.deep.equal [1, 10, 1]
      expect(slice({start:1, stop:10, step:null}, 5)).to.be.deep.equal [1, 10, 1]
      expect(slice({start:1, stop:10, step:null}, 15)).to.be.deep.equal [1, 10, 1]

    it "should return length for stop when slice stop is null", ->
      expect(slice({start:1, stop:null, step:2}, 11)).to.be.deep.equal [1, 11, 2]

  describe "patch_to_column", ->

    describe "with single integer index", ->

      it "should patch Arrays to Arrays", ->
        a = [1,2,3,4,5]
        patch_to_column(a, [[3, 100]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,3,100,5]

        patch_to_column(a, [[2, 101]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,101,100,5]

      it "should patch typed Arrays to typed Arrays", ->
        for typ in [Float32Array, Float64Array, Int32Array]
          a = new typ([1,2,3,4,5])
          patch_to_column(a, [[3, 100]])
          expect(a).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,3,100,5])

          patch_to_column(a, [[2, 101]])
          expect(a).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,101,100,5])

      it "should handle multi-part patches", ->
        a = [1,2,3,4,5]
        patch_to_column(a, [[3, 100], [0, 10], [4, -1]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [10,2,3,100,-1]

      it "should return a Set of the patched indices", ->
        a = [1,2,3,4,5]
        s = patch_to_column(a, [[3, 100], [0, 10], [4, -1]])
        expect(s).to.be.instanceof Set
        expect(s.diff(new Set([0,3,4])).values).to.be.deep.equal []

    describe "with single slice index", ->

      it "should patch Arrays to Arrays", ->
        a = [1,2,3,4,5]
        patch_to_column(a, [[{start:2,stop:4,step:1}, [100, 101]]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,101,5]

        patch_to_column(a, [[{start:1,stop:3,step:1}, [99, 102]]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,99,102,101,5]

      it "should patch typed Arrays to typed Arrays", ->
        for typ in [Float32Array, Float64Array, Int32Array]
          a = new typ([1,2,3,4,5])
          patch_to_column(a, [[{start:2,stop:4,step:1}, [100, 101]]])
          expect(a).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,100,101,5])

          patch_to_column(a, [[{start:1,stop:3,step:1}, [99, 102]]])
          expect(a).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,99,102,101,5])

      it "should handle patch indices with strides", ->
        a = new Int32Array([1,2,3,4,5])
        patch_to_column(a, [[{start:1,stop:5,step:2}, [100, 101]]])
        expect(a).to.be.instanceof Int32Array
        expect(a).to.be.deep.equal new Int32Array([1,100,3,101,5])

      it "should handle multi-part patches", ->
        a = [1,2,3,4,5]
        patch_to_column(a, [[{start:2,stop:4,step:1}, [100, 101]], [{start:null, stop:1, step:1}, [10]], [4, -1]])
        expect(a).to.be.instanceof Array
        expect(a).to.be.deep.equal [10,2,100,101,-1]

      it "should return a Set of the patched indices", ->
        a = [1,2,3,4,5]
        s = patch_to_column(a, [[{start:2,stop:4,step:1}, [100, 101]], [{start:null, stop:1, step:1}, [10]], [4, -1]])
        expect(s).to.be.instanceof Set
        expect(s.diff(new Set([0,2,3,4])).values).to.be.deep.equal []

    describe "with multi-index for 1d subarrays", ->

      it "should patch Arrays to Arrays", ->
        a = [1,2,3,4,5]
        b = [10, 20, -1, -2, 0, 10]
        c = [1,2,3,4]
        patch_to_column([a, b, c], [
          [[0, {start:2,stop:4,step:1}], [100, 101]]
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(c).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,101,5]
        expect(b).to.be.deep.equal [10, 20, -1, -2, 0, 10]
        expect(c).to.be.deep.equal [1,2,3,4]

        patch_to_column([a, b, c], [
          [[1, {start:2,stop:4,step:1}], [100, 101]]
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(c).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,101,5]
        expect(b).to.be.deep.equal [10, 20, 100, 101, 0, 10]
        expect(c).to.be.deep.equal [1,2,3,4]

      it "should patch typed Arrays to typed Arrays", ->
        for typ in [Float32Array, Float64Array, Int32Array]
          a = new typ([1,2,3,4,5])
          b = new typ([10, 20, -1, -2, 0, 10])
          c = new typ([1,2,3,4])
          patch_to_column([a, b, c], [
            [[0, {start:2,stop:4,step:1}], [100, 101]]
          ], [[5], [6], [4]])
          expect(a).to.be.instanceof typ
          expect(b).to.be.instanceof typ
          expect(c).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,100,101,5])
          expect(b).to.be.deep.equal new typ([10, 20, -1, -2, 0, 10])
          expect(c).to.be.deep.equal new typ([1,2,3,4])

          patch_to_column([a, b, c], [
            [[1, {start:2,stop:4,step:1}], [100, 101]]
          ], [[5], [6], [4]])
          expect(a).to.be.instanceof typ
          expect(b).to.be.instanceof typ
          expect(c).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,100,101,5])
          expect(b).to.be.deep.equal new typ([10, 20, 100, 101, 0, 10])
          expect(c).to.be.deep.equal new typ([1,2,3,4])

      it "should handle patch indices with strides", ->
        a = new Int32Array([1,2,3,4,5])
        b = new Int32Array([10, 20, -1, -2, 0, 10])
        c = new Int32Array([1,2,3,4])
        patch_to_column([a, b,c], [
          [[0, {start:1,stop:5,step:2}], [100, 101]]
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof Int32Array
        expect(b).to.be.instanceof Int32Array
        expect(c).to.be.instanceof Int32Array
        expect(a).to.be.deep.equal new Int32Array([1,100,3,101,5])
        expect(b).to.be.deep.equal new Int32Array([10, 20, -1, -2, 0, 10])
        expect(c).to.be.deep.equal new Int32Array([1,2,3,4])

        patch_to_column([a, b, c], [
          [[1, {start:null,stop:null,step:3}], [100, 101]]
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof Int32Array
        expect(b).to.be.instanceof Int32Array
        expect(c).to.be.instanceof Int32Array
        expect(a).to.be.deep.equal new Int32Array([1,100,3,101,5])
        expect(b).to.be.deep.equal new Int32Array([100, 20, -1, 101, 0, 10])
        expect(c).to.be.deep.equal new Int32Array([1,2,3,4])

      it "should handle multi-part patches", ->
        a = [1,2,3,4,5]
        b = [10, 20, -1, -2, 0, 10]
        c = [1,2,3,4]
        patch_to_column([a, b, c], [
          [[0, {start:2,stop:4,step:1}], [100, 101]],
          [[1, {start:null, stop:2, step:1}], [999, 999]],
          [[1, 5], [6]]
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(c).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,101,5]
        expect(b).to.be.deep.equal [999, 999, -1, -2, 0, 6]
        expect(c).to.be.deep.equal [1,2,3,4]

      it "should return a Set of the patched indices", ->
        a = [1,2,3,4,5]
        b = [10, 20, -1, -2, 0, 10]
        c = [1,2,3,4]
        s = patch_to_column([a, b, c], [
          [[0, {start:2,stop:4,step:1}], [100, 101]],
          [[1, {start:null, stop:2, step:1}], [999, 999]],
          [[1, 5], [6]]
        ], [[5], [6], [4]])
        expect(s).to.be.instanceof Set
        expect(s.diff(new Set([0,1])).values).to.be.deep.equal []

    describe "with multi-index for 2d subarrays", ->

      it "should patch Arrays to Arrays", ->
        a = [1,2,3,
             4,5,6]
        b = [10, 20,
             -1, -2,
              0, 10]
        c = [1,2]
        patch_to_column([a, b, c], [
          [[0, {start:null,stop:null,step:null}, 2], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,
                                    4,5,101]
        expect(b).to.be.deep.equal [10, 20,
                                    -1, -2,
                                     0, 10]
        expect(c).to.be.deep.equal [1,2]

        patch_to_column([a, b, c], [
          [[1, {start:0,stop:2,step:1}, {start:0,stop:1,step:1}], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,
                                    4,5,101]
        expect(b).to.be.deep.equal [100, 20,
                                    101, -2,
                                      0, 10]
        expect(c).to.be.deep.equal [1,2]

      it "should patch typed Arrays to types Arrays", ->
        for typ in [Float32Array, Float64Array, Int32Array]
          a = new typ([1,2,3,
                       4,5,6])
          b = new typ([10, 20,
                       -1, -2,
                        0, 10])
          c = new typ([1,2])
          patch_to_column([a, b, c], [
            [[0, {start:null,stop:null,step:null}, 2], [100, 101]]
          ], [[2,3], [3,2], [1,2]])
          expect(a).to.be.instanceof typ
          expect(b).to.be.instanceof typ
          expect(c).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,100,
                                              4,5,101])
          expect(b).to.be.deep.equal new typ([10, 20,
                                              -1, -2,
                                               0, 10])
          expect(c).to.be.deep.equal new typ([1,2])

          patch_to_column([a, b, c], [
            [[1, {start:0,stop:2,step:1}, {start:0,stop:1,step:1}], [100, 101]]
          ], [[2,3], [3,2], [1,2]])
          expect(a).to.be.instanceof typ
          expect(b).to.be.instanceof typ
          expect(c).to.be.instanceof typ
          expect(a).to.be.deep.equal new typ([1,2,100,
                                              4,5,101])
          expect(b).to.be.deep.equal new typ([100, 20,
                                              101, -2,
                                                0, 10])
          expect(c).to.be.deep.equal new typ([1,2])

      it "should handle patch indices with strides", ->
        a = new Int32Array([1,2,3,4,5,6])
        b = new Int32Array([10, 20, -1, -2, 0, 10])
        c = new Int32Array([1,2])
        patch_to_column([a, b, c], [
          [[0, {start:null,stop:null,step:1}, 2], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(a).to.be.instanceof Int32Array
        expect(b).to.be.instanceof Int32Array
        expect(c).to.be.instanceof Int32Array
        expect(a).to.be.deep.equal new Int32Array([1,2,100,
                                                   4,5,101])
        expect(b).to.be.deep.equal new Int32Array([10, 20,
                                                   -1, -2,
                                                    0, 10])
        expect(c).to.be.deep.equal new Int32Array([1,2])

        patch_to_column([a, b, c], [
          [[1, {start:0,stop:3,step:2}, {start:0,stop:1,step:1}], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(a).to.be.instanceof Int32Array
        expect(b).to.be.instanceof Int32Array
        expect(c).to.be.instanceof Int32Array
        expect(c).to.be.deep.equal new Int32Array([1,2])
        expect(a).to.be.deep.equal new Int32Array([1,2,100,
                                                   4,5,101])
        expect(b).to.be.deep.equal new Int32Array([100, 20,
                                                    -1, -2,
                                                  101, 10]) # this will literally fail to compile if another space is added to line things up
        expect(c).to.be.deep.equal new Int32Array([1,2])


      it "should handle multi-part patches", ->
        a = [1,2,3,
             4,5,6]
        b = [10, 20,
             -1, -2,
              0, 10]
        c = [1,2]
        patch_to_column([a, b, c], [
          [[0, {start:null,stop:null,step:1}, 2], [100, 101]],
          [[1, {start:0,stop:2,step:1}, {start:0,stop:1,step:1}], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(a).to.be.instanceof Array
        expect(b).to.be.instanceof Array
        expect(c).to.be.instanceof Array
        expect(a).to.be.deep.equal [1,2,100,
                                    4,5,101]
        expect(b).to.be.deep.equal [100, 20,
                                    101, -2,
                                      0, 10]
        expect(c).to.be.deep.equal [1, 2]

      it "should return a Set of the patched indices", ->
        a = [1,2,3,
             4,5,6]
        b = [10, 20,
             -1, -2,
              0, 10]
        c = [1,2]
        s = patch_to_column([a, b, c], [
          [[0, {start:null,stop:null,step:1}, 2], [100, 101]],
          [[1, {start:0,stop:2,step:1}, {start:0,stop:1,step:1}], [100, 101]]
        ], [[2,3], [3,2], [1,2]])
        expect(s).to.be.instanceof Set
        expect(s.diff(new Set([0,1])).values).to.be.deep.equal []

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

  describe "columns method", ->

    it "should report .data.keys", ->
      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r.columns()).to.be.deep.equal keys(r.data)

    it "should update if columns update", ->
      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      r.data.baz = [11, 21]
      expect(r.columns()).to.be.deep.equal keys(r.data)

  describe "clear method", ->

    it "should clear plain arrys to plain arrays", ->
      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      r.clear()
      expect(r.data).to.be.deep.equal {foo: [], bar:[]}

    it "should clear typed arrays to typed arrays", ->
      for typ in [Float32Array, Float64Array, Int32Array]
        r = new ColumnDataSource({data: {foo: [10, 20], bar: new typ([1,2])}})
        r.clear()
        expect(r.data).to.be.deep.equal {foo: [], bar: new typ([])}

    it "should clear columns added later", ->
      for typ in [Float32Array, Float64Array, Int32Array]
        r = new ColumnDataSource({data: {foo: [10, 20]}})
        r.data.bar = [100, 200]
        r.data.baz = new typ([1,2])
        r.clear()
        expect(r.data).to.be.deep.equal {foo: [], bar: [], baz: new typ([])}
