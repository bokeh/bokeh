import {expect} from "assertions"
import * as typed_array from "@bokehjs/core/util/typed_array"

describe("core/util/typed_array module", () => {

  describe("concat", () => {

    it("should concat Float32 arrays", () => {
      const a = new Float32Array([1, 2])
      const b = new Float32Array([3, 4])
      const r = typed_array.concat(a, b)
      expect(r).to.be.instanceof(Float32Array)
      expect(r).to.be.equal(new Float32Array([1, 2, 3, 4]))
    })

    it("should concat Float64 arrays", () => {
      const a = new Float64Array([1, 2])
      const b = new Float64Array([3, 4])
      const r = typed_array.concat(a, b)
      expect(r).to.be.instanceof(Float64Array)
      expect(r).to.be.equal(new Float64Array([1, 2, 3, 4]))
    })

    it("should concat Int32 arrays", () => {
      const a = new Int32Array([1, 2])
      const b = new Int32Array([3, 4])
      const r = typed_array.concat(a, b)
      expect(r).to.be.instanceof(Int32Array)
      expect(r).to.be.equal(new Int32Array([1, 2, 3, 4]))
    })

    it("should concat multiple arrays", () => {
      const a = new Float32Array([1, 2])
      const b = new Float32Array([3, 4])
      const c = new Float32Array([5, 6])
      const d = new Float32Array([7, 8])
      const r = typed_array.concat(a, b, c, d)
      expect(r).to.be.instanceof(Float32Array)
      expect(r).to.be.equal(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]))
    })
  })
})
