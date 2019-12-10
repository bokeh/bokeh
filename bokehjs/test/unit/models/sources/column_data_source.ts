import {expect} from "chai"

import {Set} from "@bokehjs/core/util/data_structures"
import {set_log_level} from "@bokehjs/core/logging"

import {keys} from "@bokehjs/core/util/object"
import {ColumnDataSource, stream_to_column, slice, patch_to_column} from "@bokehjs/models/sources/column_data_source"

import {trap} from "../../../util"

describe("column_data_source module", () => {

  describe("slice", () => {

    it("should return [ind, ind+1, 1] for scalars", () => {
      expect(slice(0, 5)).to.be.deep.equal([0, 1, 1])
      expect(slice(10, 5)).to.be.deep.equal([10, 11, 1])
    })

    it("should return start, stop, end for slice object", () => {
      expect(slice({start:1, stop:10, step:2}, 5)).to.be.deep.equal([1, 10, 2])
      expect(slice({start:1, stop:10, step:2}, 5)).to.be.deep.equal([1, 10, 2])
      expect(slice({start:1, stop:10, step:2}, 15)).to.be.deep.equal([1, 10, 2])
    })

    it("should return 0 for start when slice start is null", () => {
      expect(slice({stop:10, step:2}, 5)).to.be.deep.equal([0, 10, 2])
      expect(slice({stop:10, step:2}, 5)).to.be.deep.equal([0, 10, 2])
      expect(slice({stop:10, step:2}, 15)).to.be.deep.equal([0, 10, 2])
    })

    it("should return 1 for step when slice step is null", () => {
      expect(slice({start:1, stop:10}, 5)).to.be.deep.equal([1, 10, 1])
      expect(slice({start:1, stop:10}, 5)).to.be.deep.equal([1, 10, 1])
      expect(slice({start:1, stop:10}, 15)).to.be.deep.equal([1, 10, 1])
    })

    it("should return length for stop when slice stop is null", () => {
      expect(slice({start:1, step:2}, 11)).to.be.deep.equal([1, 11, 2])
    })
  })

  describe("patch_to_column", () => {

    describe("with single integer index", () => {

      it("should patch Arrays to Arrays", () => {
        const a = [1, 2, 3, 4, 5]
        patch_to_column(a, [[3, 100]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 3, 100, 5])

        patch_to_column(a, [[2, 101]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 101, 100, 5])
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32Array, Float64Array, Int32Array]) {
          const a = new typ([1, 2, 3, 4, 5])
          patch_to_column(a, [[3, 100]], [])
          expect(a).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 3, 100, 5]))

          patch_to_column(a, [[2, 101]], [])
          expect(a).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 101, 100, 5]))
        }
      })

      it("should handle multi-part patches", () => {
        const a = [1, 2, 3, 4, 5]
        patch_to_column(a, [[3, 100], [0, 10], [4, -1]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([10, 2, 3, 100, -1])
      })

      it("should return a Set of the patched indices", () => {
        const a = [1, 2, 3, 4, 5]
        const s = patch_to_column(a, [[3, 100], [0, 10], [4, -1]], [])
        expect(s).to.be.instanceof(Set)
        expect(s.diff(new Set([0, 3, 4])).values).to.be.deep.equal([])
      })
    })

    describe("with single slice index", () => {

      it("should patch Arrays to Arrays", () => {
        const a = [1, 2, 3, 4, 5]
        patch_to_column(a, [[{start:2, stop:4, step:1}, [100, 101]]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 101, 5])

        patch_to_column(a, [[{start:1, stop:3, step:1}, [99, 102]]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 99, 102, 101, 5])
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32Array, Float64Array, Int32Array]) {
          const a = new typ([1, 2, 3, 4, 5])
          patch_to_column(a, [[{start:2, stop:4, step:1}, [100, 101]]], [])
          expect(a).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 100, 101, 5]))

          patch_to_column(a, [[{start:1, stop:3, step:1}, [99, 102]]], [])
          expect(a).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 99, 102, 101, 5]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = new Int32Array([1, 2, 3, 4, 5])
        patch_to_column(a, [[{start:1, stop:5, step:2}, [100, 101]]], [])
        expect(a).to.be.instanceof(Int32Array)
        expect(a).to.be.deep.equal(new Int32Array([1, 100, 3, 101, 5]))
      })

      it("should handle multi-part patches", () => {
        const a = [1, 2, 3, 4, 5]
        patch_to_column(a, [[{start:2, stop:4, step:1}, [100, 101]], [{stop:1, step:1}, [10]], [4, -1]], [])
        expect(a).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([10, 2, 100, 101, -1])
      })

      it("should return a Set of the patched indices", () => {
        const a = [1, 2, 3, 4, 5]
        const s = patch_to_column(a, [[{start:2, stop:4, step:1}, [100, 101]], [{stop:1, step:1}, [10]], [4, -1]], [])
        expect(s).to.be.instanceof(Set)
        expect(s.diff(new Set([0, 2, 3, 4])).values).to.be.deep.equal([])
      })
    })

    describe("with multi-index for 1d subarrays", () => {

      it("should patch Arrays to Arrays", () => {
        const a = [1, 2, 3, 4, 5]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2, 3, 4]
        patch_to_column([a, b, c], [
          [[0, {start:2, stop:4, step:1}], [100, 101]],
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(c).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 101, 5])
        expect(b).to.be.deep.equal([10, 20, -1, -2, 0, 10])
        expect(c).to.be.deep.equal([1, 2, 3, 4])

        patch_to_column([a, b, c], [
          [[1, {start:2, stop:4, step:1}], [100, 101]],
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(c).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 101, 5])
        expect(b).to.be.deep.equal([10, 20, 100, 101, 0, 10])
        expect(c).to.be.deep.equal([1, 2, 3, 4])
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32Array, Float64Array, Int32Array]) {
          const a = new typ([1, 2, 3, 4, 5])
          const b = new typ([10, 20, -1, -2, 0, 10])
          const c = new typ([1, 2, 3, 4])
          patch_to_column([a, b, c], [
            [[0, {start:2, stop:4, step:1}], [100, 101]],
          ], [[5], [6], [4]])
          expect(a).to.be.instanceof(typ)
          expect(b).to.be.instanceof(typ)
          expect(c).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 100, 101, 5]))
          expect(b).to.be.deep.equal(new typ([10, 20, -1, -2, 0, 10]))
          expect(c).to.be.deep.equal(new typ([1, 2, 3, 4]))

          patch_to_column([a, b, c], [
            [[1, {start:2, stop:4, step:1}], [100, 101]],
          ], [[5], [6], [4]])
          expect(a).to.be.instanceof(typ)
          expect(b).to.be.instanceof(typ)
          expect(c).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 100, 101, 5]))
          expect(b).to.be.deep.equal(new typ([10, 20, 100, 101, 0, 10]))
          expect(c).to.be.deep.equal(new typ([1, 2, 3, 4]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = new Int32Array([1, 2, 3, 4, 5])
        const b = new Int32Array([10, 20, -1, -2, 0, 10])
        const c = new Int32Array([1, 2, 3, 4])
        patch_to_column([a, b, c], [
          [[0, {start:1, stop:5, step:2}], [100, 101]],
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof(Int32Array)
        expect(b).to.be.instanceof(Int32Array)
        expect(c).to.be.instanceof(Int32Array)
        expect(a).to.be.deep.equal(new Int32Array([1, 100, 3, 101, 5]))
        expect(b).to.be.deep.equal(new Int32Array([10, 20, -1, -2, 0, 10]))
        expect(c).to.be.deep.equal(new Int32Array([1, 2, 3, 4]))

        patch_to_column([a, b, c], [
          [[1, {step:3}], [100, 101]],
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof(Int32Array)
        expect(b).to.be.instanceof(Int32Array)
        expect(c).to.be.instanceof(Int32Array)
        expect(a).to.be.deep.equal(new Int32Array([1, 100, 3, 101, 5]))
        expect(b).to.be.deep.equal(new Int32Array([100, 20, -1, 101, 0, 10]))
        expect(c).to.be.deep.equal(new Int32Array([1, 2, 3, 4]))
      })

      it("should handle multi-part patches", () => {
        const a = [1, 2, 3, 4, 5]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2, 3, 4]
        patch_to_column([a, b, c], [
          [[0, {start:2, stop:4, step:1}], [100, 101]],
          [[1, {stop:2, step:1}], [999, 999]],
          [[1, 5], [6]],
        ], [[5], [6], [4]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(c).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 101, 5])
        expect(b).to.be.deep.equal([999, 999, -1, -2, 0, 6])
        expect(c).to.be.deep.equal([1, 2, 3, 4])
      })

      it("should return a Set of the patched indices", () => {
        const a = [1, 2, 3, 4, 5]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2, 3, 4]
        const s = patch_to_column([a, b, c], [
          [[0, {start:2, stop:4, step:1}], [100, 101]],
          [[1, {stop:2, step:1}], [999, 999]],
          [[1, 5], [6]],
        ], [[5], [6], [4]])
        expect(s).to.be.instanceof(Set)
        expect(s.diff(new Set([0, 1])).values).to.be.deep.equal([])
      })
    })

    describe("with multi-index for 2d subarrays", () => {

      it("should patch Arrays to Arrays", () => {
        const a = [1, 2, 3, 4, 5, 6]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2]
        patch_to_column([a, b, c], [[[0, {}, 2], [100, 101]]], [[2, 3], [3, 2], [1, 2]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 4, 5, 101])
        expect(b).to.be.deep.equal([10, 20, -1, -2, 0, 10])
        expect(c).to.be.deep.equal([1, 2])

        patch_to_column([a, b, c], [
          [[1, {start:0, stop:2, step:1}, {start:0, stop:1, step:1}], [100, 101]],
        ], [[2, 3], [3, 2], [1, 2]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 4, 5, 101])
        expect(b).to.be.deep.equal([100, 20, 101, -2, 0, 10])
        expect(c).to.be.deep.equal([1, 2])
      })

      it("should patch typed Arrays to types Arrays", () => {
        for (const typ of [Float32Array, Float64Array, Int32Array]) {
          const a = new typ([1, 2, 3,
                             4, 5, 6])
          const b = new typ([10, 20,
                             -1, -2,
                             0, 10])
          const c = new typ([1, 2])
          patch_to_column([a, b, c], [
            [[0, {}, 2], [100, 101]],
          ], [[2, 3], [3, 2], [1, 2]])
          expect(a).to.be.instanceof(typ)
          expect(b).to.be.instanceof(typ)
          expect(c).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 100, 4, 5, 101]))
          expect(b).to.be.deep.equal(new typ([10, 20, -1, -2, 0, 10]))
          expect(c).to.be.deep.equal(new typ([1, 2]))

          patch_to_column([a, b, c], [
            [[1, {start:0, stop:2, step:1}, {start:0, stop:1, step:1}], [100, 101]],
          ], [[2, 3], [3, 2], [1, 2]])
          expect(a).to.be.instanceof(typ)
          expect(b).to.be.instanceof(typ)
          expect(c).to.be.instanceof(typ)
          expect(a).to.be.deep.equal(new typ([1, 2, 100, 4, 5, 101]))
          expect(b).to.be.deep.equal(new typ([100, 20, 101, -2, 0, 10]))
          expect(c).to.be.deep.equal(new typ([1, 2]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = new Int32Array([1, 2, 3, 4, 5, 6])
        const b = new Int32Array([10, 20, -1, -2, 0, 10])
        const c = new Int32Array([1, 2])
        patch_to_column([a, b, c], [
          [[0, {step:1}, 2], [100, 101]],
        ], [[2, 3], [3, 2], [1, 2]])
        expect(a).to.be.instanceof(Int32Array)
        expect(b).to.be.instanceof(Int32Array)
        expect(c).to.be.instanceof(Int32Array)
        expect(a).to.be.deep.equal(new Int32Array([1, 2, 100, 4, 5, 101]))
        expect(b).to.be.deep.equal(new Int32Array([10, 20, -1, -2, 0, 10]))
        expect(c).to.be.deep.equal(new Int32Array([1, 2]))

        patch_to_column([a, b, c], [
          [[1, {start:0, stop:3, step:2}, {start:0, stop:1, step:1}], [100, 101]],
        ], [[2, 3], [3, 2], [1, 2]])
        expect(a).to.be.instanceof(Int32Array)
        expect(b).to.be.instanceof(Int32Array)
        expect(c).to.be.instanceof(Int32Array)
        expect(c).to.be.deep.equal(new Int32Array([1, 2]))
        expect(a).to.be.deep.equal(new Int32Array([1, 2, 100, 4, 5, 101]))
        expect(b).to.be.deep.equal(new Int32Array([100, 20, -1, -2, 101, 10]))
        expect(c).to.be.deep.equal(new Int32Array([1, 2]))
      })

      it("should handle multi-part patches", () => {
        const a = [1, 2, 3, 4, 5, 6]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2]
        patch_to_column([a, b, c], [
          [[0, {step:1}, 2], [100, 101]],
          [[1, {start:0, stop:2, step:1}, {start:0, stop:1, step:1}], [100, 101]],
        ], [[2, 3], [3, 2], [1, 2]])
        expect(a).to.be.instanceof(Array)
        expect(b).to.be.instanceof(Array)
        expect(c).to.be.instanceof(Array)
        expect(a).to.be.deep.equal([1, 2, 100, 4, 5, 101])
        expect(b).to.be.deep.equal([100, 20, 101, -2, 0, 10])
        expect(c).to.be.deep.equal([1, 2])
      })

      it("should return a Set of the patched indices", () => {
        const a = [1, 2, 3, 4, 5, 6]
        const b = [10, 20, -1, -2, 0, 10]
        const c = [1, 2]
        const s = patch_to_column([a, b, c], [
          [[0, {step:1}, 2], [100, 101]],
          [[1, {start:0, stop:2, step:1}, {start:0, stop:1, step:1}], [100, 101]],
        ], [[2, 3], [3, 2], [1, 2]])
        expect(s).to.be.instanceof(Set)
        expect(s.diff(new Set([0, 1])).values).to.be.deep.equal([])
      })
    })
  })

  describe("stream_to_column", () => {

    it("should stream Arrays to Arrays", () => {
      const a = [1, 2, 3, 4, 5]
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof(Array)
      expect(r).to.be.deep.equal([1, 2, 3, 4, 5, 100, 200])
    })

    it("should stream Arrays to Arrays with rollover", () => {
      const a0 = [1, 2, 3, 4, 5]
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.instanceof(Array)
      expect(r0).to.be.deep.equal([4, 5, 100, 200, 300])

      const a1 = [1, 2, 3, 4, 5]
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.instanceof(Array)
      expect(r1).to.be.deep.equal([3, 4, 5, 100, 200, 300])
    })

    it("should stream Float32 to Float32", () => {
      const a = new Float32Array([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof(Float32Array)
      expect(r).to.be.deep.equal(new Float32Array([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Float32 to Float32 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Float32Array([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.instanceof(Float32Array)
      expect(r0).to.be.deep.equal(new Float32Array([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Float32Array([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.instanceof(Float32Array)
      expect(r1).to.be.deep.equal(new Float32Array([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Float32Array([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.instanceof(Float32Array)
      expect(r2).to.be.deep.equal(new Float32Array([1, 2, 3, 4, 5, 100, 200, 300]))
    })

    it("should stream Float64 to Float64", () => {
      const a = new Float64Array([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof(Float64Array)
      expect(r).to.be.deep.equal(new Float64Array([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Float64 to Float64 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Float64Array([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.instanceof(Float64Array)
      expect(r0).to.be.deep.equal(new Float64Array([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Float64Array([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.instanceof(Float64Array)
      expect(r1).to.be.deep.equal(new Float64Array([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Float64Array([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.instanceof(Float64Array)
      expect(r2).to.be.deep.equal(new Float64Array([1, 2, 3, 4, 5, 100, 200, 300]))
    })

    it("should stream Int32 to Int32", () => {
      const a = new Int32Array([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.instanceof(Int32Array)
      expect(r).to.be.deep.equal(new Int32Array([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Int32 to Int32 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Int32Array([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.instanceof(Int32Array)
      expect(r0).to.be.deep.equal(new Int32Array([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Int32Array([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.instanceof(Int32Array)
      expect(r1).to.be.deep.equal(new Int32Array([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Int32Array([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.instanceof(Int32Array)
      expect(r2).to.be.deep.equal(new Int32Array([1, 2, 3, 4, 5, 100, 200, 300]))
    })
  })

  describe("default creation", () => {
    const r = new ColumnDataSource()

    it("should have empty data", () => {
      expect(r.data).to.be.deep.equal({})
    })

    it("should have empty columns", () => {
      expect(r.columns()).to.be.deep.equal([])
    })

    it("should return null for get_length", () => {
      expect(r.get_length()).to.be.null
    })
  })

  describe("single column added", () => {
    const r = new ColumnDataSource({data: {foo: []}})

    it("should return supplied data", () => {
      expect(r.data).to.be.deep.equal({foo: []})
    })

    it("should return one column", () => {
      expect(r.columns()).to.be.deep.equal(["foo"])
    })
  })

  describe("single column added", () => {
    const r = new ColumnDataSource({data: {foo: [], bar:[]}})

    it("should return supplied data", () => {
      expect(r.data).to.be.deep.equal({foo: [], bar: []})
    })

    it("should return all columns", () => {
      expect((r.columns()).sort()).to.be.deep.equal(["bar", "foo"])
    })
  })

  describe("get_length function", () => {

    it("should return 0 for empty columns", () => {
      const r0 = new ColumnDataSource({data: {foo: []}})
      expect(r0.get_length()).to.be.equal(0)

      const r1 = new ColumnDataSource({data: {foo: [], bar:[]}})
      expect(r1.get_length()).to.be.equal(0)
    })

    it("should return common length for columns with data", () => {
      const r0 = new ColumnDataSource({data: {foo: [10]}})
      expect(r0.get_length()).to.be.equal(1)

      const r1 = new ColumnDataSource({data: {foo: [10], bar:[10]}})
      expect(r1.get_length()).to.be.equal(1)

      const r2 = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r2.get_length()).to.be.equal(2)
    })

    it("should not alert for consistent column lengths (including zero)", () => {
      const original = set_log_level("info")
      try {
        const r0 = new ColumnDataSource({data: {foo: []}})
        const out0 = trap(() => r0.get_length())
        expect(out0.warn).to.be.equal("")

        const r1 = new ColumnDataSource({data: {foo: [], bar:[]}})
        const out1 = trap(() => r1.get_length())
        expect(out1.warn).to.be.equal("")

        const r2 = new ColumnDataSource({data: {foo: [10]}})
        const out2 = trap(() => r2.get_length())
        expect(out2.warn).to.be.equal("")

        const r3 = new ColumnDataSource({data: {foo: [10], bar:[10]}})
        const out3 = trap(() => r3.get_length())
        expect(out3.warn).to.be.equal("")

        const r4 = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
        const out4 = trap(() => r4.get_length())
        expect(out4.warn).to.be.equal("")
      } finally {
        set_log_level(original)
      }
    })

    it("should alert if column lengths are inconsistent", () => {
      const original = set_log_level("info")
      try {
        const r0 = new ColumnDataSource({data: {foo: [1], bar: [1, 2]}})
        const out0 = trap(() => r0.get_length())
        expect(out0.warn).to.be.equal("[bokeh] data source has columns of inconsistent lengths\n")

        const r1 = new ColumnDataSource({data: {foo: [1], bar: [1, 2], baz: [1]}})
        const out1 = trap(() => r1.get_length())
        expect(out1.warn).to.be.equal("[bokeh] data source has columns of inconsistent lengths\n")
      } finally {
        set_log_level(original)
      }
    })
  })

  describe("columns method", () => {

    it("should report .data.keys", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r.columns()).to.be.deep.equal(keys(r.data))
    })

    it("should update if columns update", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      r.data.baz = [11, 21]
      expect(r.columns()).to.be.deep.equal(keys(r.data))
    })
  })

  describe("clear method", () => {

    it("should clear plain arrys to plain arrays", () => {
      const r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      r.clear()
      expect(r.data).to.be.deep.equal({foo: [], bar:[]})
    })

    it("should clear typed arrays to typed arrays", () => {
      for (const typ of [Float32Array, Float64Array, Int32Array]) {
        const r = new ColumnDataSource({data: {foo: [10, 20], bar: new typ([1, 2])}})
        r.clear()
        expect(r.data).to.be.deep.equal({foo: [], bar: new typ([])})
      }
    })

    it("should clear columns added later", () => {
      for (const typ of [Float32Array, Float64Array, Int32Array]) {
        const r = new ColumnDataSource({data: {foo: [10, 20]}})
        r.data.bar = [100, 200]
        r.data.baz = new typ([1, 2])
        r.clear()
        expect(r.data).to.be.deep.equal({foo: [], bar: [], baz: new typ([])})
      }
    })
  })
})
