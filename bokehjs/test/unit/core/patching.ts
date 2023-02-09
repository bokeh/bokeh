import {expect} from "assertions"

import {difference} from "@bokehjs/core/util/set"
import {stream_to_column, slice, patch_to_column} from "@bokehjs/core/patching"
import {ndarray, Int32NDArray, Float32NDArray, Float64NDArray} from "@bokehjs/core/util/ndarray"
import {Slice} from "@bokehjs/core/util/slice"

describe("core/patching module", () => {

  describe("slice", () => {

    it("should return [ind, ind+1, 1] for scalars", () => {
      expect(slice(0, 5)).to.be.equal([0, 1, 1])
      expect(slice(10, 5)).to.be.equal([10, 11, 1])
    })

    it("should return start, stop, end for slice object", () => {
      expect(slice(new Slice({start: 1, stop: 10, step: 2}), 5)).to.be.equal([1, 10, 2])
      expect(slice(new Slice({start: 1, stop: 10, step: 2}), 5)).to.be.equal([1, 10, 2])
      expect(slice(new Slice({start: 1, stop: 10, step: 2}), 15)).to.be.equal([1, 10, 2])
    })

    it("should return 0 for start when slice start is null", () => {
      expect(slice(new Slice({stop: 10, step: 2}), 5)).to.be.equal([0, 10, 2])
      expect(slice(new Slice({stop: 10, step: 2}), 5)).to.be.equal([0, 10, 2])
      expect(slice(new Slice({stop: 10, step: 2}), 15)).to.be.equal([0, 10, 2])
    })

    it("should return 1 for step when slice step is null", () => {
      expect(slice(new Slice({start: 1, stop: 10}), 5)).to.be.equal([1, 10, 1])
      expect(slice(new Slice({start: 1, stop: 10}), 5)).to.be.equal([1, 10, 1])
      expect(slice(new Slice({start: 1, stop: 10}), 15)).to.be.equal([1, 10, 1])
    })

    it("should return length for stop when slice stop is null", () => {
      expect(slice(new Slice({start: 1, step: 2}), 11)).to.be.equal([1, 11, 2])
    })
  })

  describe("patch_to_column", () => {

    describe("with single integer index", () => {

      it("should patch Arrays to Arrays", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        patch_to_column(a, [[3, 100]])
        expect(a).to.be.equal(ndarray([1, 2, 3, 100, 5]))

        patch_to_column(a, [[2, 101]])
        expect(a).to.be.equal(ndarray([1, 2, 101, 100, 5]))
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
          const a = new typ([1, 2, 3, 4, 5])
          patch_to_column(a, [[3, 100]])
          expect(a).to.be.equal(new typ([1, 2, 3, 100, 5]))

          patch_to_column(a, [[2, 101]])
          expect(a).to.be.equal(new typ([1, 2, 101, 100, 5]))
        }
      })

      it("should handle multi-part patches", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        patch_to_column(a, [[3, 100], [0, 10], [4, -1]])
        expect(a).to.be.equal(ndarray([10, 2, 3, 100, -1]))
      })

      it("should return a Set of the patched indices", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        const s = patch_to_column(a, [[3, 100], [0, 10], [4, -1]])
        expect(difference(s, new Set([0, 3, 4]))).to.be.equal(new Set())
      })
    })

    describe("with single slice index", () => {

      it("should patch Arrays to Arrays", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        patch_to_column(a, [[new Slice({start: 2, stop: 4, step: 1}), [100, 101]]])
        expect(a).to.be.equal(ndarray([1, 2, 100, 101, 5]))

        patch_to_column(a, [[new Slice({start: 1, stop: 3, step: 1}), [99, 102]]])
        expect(a).to.be.equal(ndarray([1, 99, 102, 101, 5]))
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
          const a = new typ([1, 2, 3, 4, 5])
          patch_to_column(a, [[new Slice({start: 2, stop: 4, step: 1}), [100, 101]]])
          expect(a).to.be.equal(new typ([1, 2, 100, 101, 5]))

          patch_to_column(a, [[new Slice({start: 1, stop: 3, step: 1}), [99, 102]]])
          expect(a).to.be.equal(new typ([1, 99, 102, 101, 5]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = ndarray([1, 2, 3, 4, 5], {dtype: "int32"})
        patch_to_column(a, [[new Slice({start: 1, stop: 5, step: 2}), [100, 101]]])
        expect(a).to.be.equal(new Int32NDArray([1, 100, 3, 101, 5]))
      })

      it("should handle multi-part patches", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        patch_to_column(a, [[new Slice({start: 2, stop: 4, step: 1}), [100, 101]], [new Slice({stop: 1, step: 1}), [10]], [4, -1]])
        expect(a).to.be.equal(ndarray([10, 2, 100, 101, -1]))
      })

      it("should return a Set of the patched indices", () => {
        const a = ndarray([1, 2, 3, 4, 5])
        const s = patch_to_column(a, [[new Slice({start: 2, stop: 4, step: 1}), [100, 101]], [new Slice({stop: 1, step: 1}), [10]], [4, -1]])
        expect(difference(s, new Set([0, 2, 3, 4]))).to.be.equal(new Set())
      })
    })

    describe("with multi-index for 1d subarrays", () => {

      it("should patch Arrays to Arrays", () => {
        const a = ndarray([1, 2, 3, 4, 5], {shape: [5]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [6]})
        const c = ndarray([1, 2, 3, 4], {shape: [4]})
        patch_to_column([a, b, c], [
          [[0, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
        ])
        expect(a).to.be.equal(ndarray([1, 2, 100, 101, 5]))
        expect(b).to.be.equal(ndarray([10, 20, -1, -2, 0, 10]))
        expect(c).to.be.equal(ndarray([1, 2, 3, 4]))

        patch_to_column([a, b, c], [
          [[1, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
        ])
        expect(a).to.be.equal(ndarray([1, 2, 100, 101, 5]))
        expect(b).to.be.equal(ndarray([10, 20, 100, 101, 0, 10]))
        expect(c).to.be.equal(ndarray([1, 2, 3, 4]))
      })

      it("should patch typed Arrays to typed Arrays", () => {
        for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
          const a = new typ([1, 2, 3, 4, 5], [5])
          const b = new typ([10, 20, -1, -2, 0, 10], [6])
          const c = new typ([1, 2, 3, 4], [4])
          patch_to_column([a, b, c], [
            [[0, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
          ])
          expect(a).to.be.equal(new typ([1, 2, 100, 101, 5]))
          expect(b).to.be.equal(new typ([10, 20, -1, -2, 0, 10]))
          expect(c).to.be.equal(new typ([1, 2, 3, 4]))

          patch_to_column([a, b, c], [
            [[1, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
          ])
          expect(a).to.be.equal(new typ([1, 2, 100, 101, 5]))
          expect(b).to.be.equal(new typ([10, 20, 100, 101, 0, 10]))
          expect(c).to.be.equal(new typ([1, 2, 3, 4]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = new Int32NDArray([1, 2, 3, 4, 5], [5])
        const b = new Int32NDArray([10, 20, -1, -2, 0, 10], [6])
        const c = new Int32NDArray([1, 2, 3, 4], [4])
        patch_to_column([a, b, c], [
          [[0, new Slice({start: 1, stop: 5, step: 2})], [100, 101]],
        ])
        expect(a).to.be.equal(new Int32NDArray([1, 100, 3, 101, 5]))
        expect(b).to.be.equal(new Int32NDArray([10, 20, -1, -2, 0, 10]))
        expect(c).to.be.equal(new Int32NDArray([1, 2, 3, 4]))

        patch_to_column([a, b, c], [
          [[1, new Slice({step: 3})], [100, 101]],
        ])
        expect(a).to.be.equal(new Int32NDArray([1, 100, 3, 101, 5]))
        expect(b).to.be.equal(new Int32NDArray([100, 20, -1, 101, 0, 10]))
        expect(c).to.be.equal(new Int32NDArray([1, 2, 3, 4]))
      })

      it("should handle multi-part patches", () => {
        const a = ndarray([1, 2, 3, 4, 5], {shape: [5]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [6]})
        const c = ndarray([1, 2, 3, 4], {shape: [4]})
        patch_to_column([a, b, c], [
          [[0, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
          [[1, new Slice({stop: 2, step: 1})], [999, 999]],
          [[1, 5], [6]],
        ])
        expect(a).to.be.equal(ndarray([1, 2, 100, 101, 5]))
        expect(b).to.be.equal(ndarray([999, 999, -1, -2, 0, 6]))
        expect(c).to.be.equal(ndarray([1, 2, 3, 4]))
      })

      it("should return a Set of the patched indices", () => {
        const a = ndarray([1, 2, 3, 4, 5], {shape: [5]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [6]})
        const c = ndarray([1, 2, 3, 4], {shape: [4]})
        const s = patch_to_column([a, b, c], [
          [[0, new Slice({start: 2, stop: 4, step: 1})], [100, 101]],
          [[1, new Slice({stop: 2, step: 1})], [999, 999]],
          [[1, 5], [6]],
        ])
        expect(difference(s, new Set([0, 1]))).to.be.equal(new Set())
      })
    })

    describe("with multi-index for 2d subarrays", () => {

      it("should patch Arrays to Arrays", () => {
        const a = ndarray([1, 2, 3, 4, 5, 6], {shape: [2, 3]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [3, 2]})
        const c = ndarray([1, 2], {shape: [1, 2]})
        patch_to_column([a, b, c], [[[0, new Slice(), 2], [100, 101]]])
        expect(a).to.be.equal(ndarray([1, 2, 100, 4, 5, 101], {shape: [2, 3]}))
        expect(b).to.be.equal(ndarray([10, 20, -1, -2, 0, 10], {shape: [3, 2]}))
        expect(c).to.be.equal(ndarray([1, 2], {shape: [1, 2]}))

        patch_to_column([a, b, c], [
          [[1, new Slice({start: 0, stop: 2, step: 1}), new Slice({start: 0, stop: 1, step: 1})], [100, 101]],
        ])
        expect(a).to.be.equal(ndarray([1, 2, 100, 4, 5, 101], {shape: [2, 3]}))
        expect(b).to.be.equal(ndarray([100, 20, 101, -2, 0, 10], {shape: [3, 2]}))
        expect(c).to.be.equal(ndarray([1, 2], {shape: [1, 2]}))
      })

      it("should patch typed Arrays to types Arrays", () => {
        for (const typ of [Float32NDArray, Float64NDArray, Int32NDArray]) {
          const a = new typ([1, 2, 3, 4, 5, 6], [2, 3])
          const b = new typ([10, 20, -1, -2, 0, 10], [3, 2])
          const c = new typ([1, 2], [1, 2])
          patch_to_column([a, b, c], [
            [[0, new Slice(), 2], [100, 101]],
          ])
          expect(a).to.be.equal(new typ([1, 2, 100, 4, 5, 101], [2, 3]))
          expect(b).to.be.equal(new typ([10, 20, -1, -2, 0, 10], [3, 2]))
          expect(c).to.be.equal(new typ([1, 2], [1, 2]))

          patch_to_column([a, b, c], [
            [[1, new Slice({start: 0, stop: 2, step: 1}), new Slice({start: 0, stop: 1, step: 1})], [100, 101]],
          ])
          expect(a).to.be.equal(new typ([1, 2, 100, 4, 5, 101], [2, 3]))
          expect(b).to.be.equal(new typ([100, 20, 101, -2, 0, 10], [3, 2]))
          expect(c).to.be.equal(new typ([1, 2], [1, 2]))
        }
      })

      it("should handle patch indices with strides", () => {
        const a = new Int32NDArray([1, 2, 3, 4, 5, 6], [2, 3])
        const b = new Int32NDArray([10, 20, -1, -2, 0, 10], [3, 2])
        const c = new Int32NDArray([1, 2], [1, 2])
        patch_to_column([a, b, c], [
          [[0, new Slice({step: 1}), 2], [100, 101]],
        ])
        expect(a).to.be.equal(new Int32NDArray([1, 2, 100, 4, 5, 101], [2, 3]))
        expect(b).to.be.equal(new Int32NDArray([10, 20, -1, -2, 0, 10], [3, 2]))
        expect(c).to.be.equal(new Int32NDArray([1, 2], [1, 2]))

        patch_to_column([a, b, c], [
          [[1, new Slice({start: 0, stop: 3, step: 2}), new Slice({start: 0, stop: 1, step: 1})], [100, 101]],
        ])
        expect(a).to.be.equal(new Int32NDArray([1, 2, 100, 4, 5, 101], [2, 3]))
        expect(b).to.be.equal(new Int32NDArray([100, 20, -1, -2, 101, 10], [3, 2]))
        expect(c).to.be.equal(new Int32NDArray([1, 2], [1, 2]))
      })

      it("should handle multi-part patches", () => {
        const a = ndarray([1, 2, 3, 4, 5, 6], {shape: [2, 3]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [3, 2]})
        const c = ndarray([1, 2], {shape: [1, 2]})
        patch_to_column([a, b, c], [
          [[0, new Slice({step: 1}), 2], [100, 101]],
          [[1, new Slice({start: 0, stop: 2, step: 1}), new Slice({start: 0, stop: 1, step: 1})], [100, 101]],
        ])
        expect(a).to.be.equal(ndarray([1, 2, 100, 4, 5, 101], {shape: [2, 3]}))
        expect(b).to.be.equal(ndarray([100, 20, 101, -2, 0, 10], {shape: [3, 2]}))
        expect(c).to.be.equal(ndarray([1, 2], {shape: [1, 2]}))
      })

      it("should return a Set of the patched indices", () => {
        const a = ndarray([1, 2, 3, 4, 5, 6], {shape: [2, 3]})
        const b = ndarray([10, 20, -1, -2, 0, 10], {shape: [3, 2]})
        const c = ndarray([1, 2], {shape: [1, 2]})
        const s = patch_to_column([a, b, c], [
          [[0, new Slice({step: 1}), 2], [100, 101]],
          [[1, new Slice({start: 0, stop: 2, step: 1}), new Slice({start: 0, stop: 1, step: 1})], [100, 101]],
        ])
        expect(difference(s, new Set([0, 1]))).to.be.equal(new Set())
      })
    })
  })

  describe("stream_to_column", () => {

    it("should stream Arrays to Arrays", () => {
      const a = [1, 2, 3, 4, 5]
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.equal([1, 2, 3, 4, 5, 100, 200])
    })

    it("should stream Arrays to Arrays with rollover", () => {
      const a0 = [1, 2, 3, 4, 5]
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.equal([4, 5, 100, 200, 300])

      const a1 = [1, 2, 3, 4, 5]
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.equal([3, 4, 5, 100, 200, 300])
    })

    it("should stream Float32 to Float32", () => {
      const a = new Float32NDArray([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.equal(new Float32NDArray([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Float32 to Float32 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Float32NDArray([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.equal(new Float32NDArray([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Float32NDArray([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.equal(new Float32NDArray([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Float32NDArray([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.equal(new Float32NDArray([1, 2, 3, 4, 5, 100, 200, 300]))
    })

    it("should stream Float64 to Float64", () => {
      const a = new Float64NDArray([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.equal(new Float64NDArray([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Float64 to Float64 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Float64NDArray([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.equal(new Float64NDArray([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Float64NDArray([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.equal(new Float64NDArray([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Float64NDArray([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.equal(new Float64NDArray([1, 2, 3, 4, 5, 100, 200, 300]))
    })

    it("should stream Int32 to Int32", () => {
      const a = new Int32NDArray([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.equal(new Int32NDArray([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Int32 to Int32 with rollover", () => {
      // test when col is already at rollover len
      const a0 = new Int32NDArray([1, 2, 3, 4, 5])
      const r0 = stream_to_column(a0, [100, 200, 300], 5)
      expect(r0).to.be.equal(new Int32NDArray([4, 5, 100, 200, 300]))

      // test when col is not at rollover len but will exceed
      const a1 = new Int32NDArray([1, 2, 3, 4, 5])
      const r1 = stream_to_column(a1, [100, 200, 300], 6)
      expect(r1).to.be.equal(new Int32NDArray([3, 4, 5, 100, 200, 300]))

      // test when col is not at rollover len and will not exceed
      const a2 = new Int32NDArray([1, 2, 3, 4, 5])
      const r2 = stream_to_column(a2, [100, 200, 300], 10)
      expect(r2).to.be.equal(new Int32NDArray([1, 2, 3, 4, 5, 100, 200, 300]))
    })

    it("should stream Float64 to Array", () => {
      const a = new Float64NDArray([1, 2, 3, 4, 5])
      const r = stream_to_column(a, [100, 200])
      expect(r).to.be.equal(new Float64NDArray([1, 2, 3, 4, 5, 100, 200]))
    })

    it("should stream Array to Float64", () => {
      const a = [1, 2, 3, 4, 5]
      const r = stream_to_column(a, new Float64NDArray([100, 200]))
      expect(r).to.be.equal(new Float64NDArray([1, 2, 3, 4, 5, 100, 200]))
    })
  })
})
