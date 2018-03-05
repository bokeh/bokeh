import {expect} from "chai"
import * as typed_array from "core/util/typed_array"

describe("core/util/typed_array module", () => {

  describe("concat", () => {

    it("should concat Float32 arrays", () => {
      const a = new Float32Array([1, 2])
      const b = new Float32Array([3, 4])
      const c = typed_array.concat(a, b)
      expect(c).to.be.instanceof(Float32Array)
      expect(c).to.be.deep.equal(new Float32Array([1, 2, 3, 4]))
    })

    it("should concat Float64 arrays", () => {
      const a = new Float64Array([1, 2])
      const b = new Float64Array([3, 4])
      const c = typed_array.concat(a, b)
      expect(c).to.be.instanceof(Float64Array)
      expect(c).to.be.deep.equal(new Float64Array([1, 2, 3, 4]))
    })

    it("should concat Int32 arrays", () => {
      const a = new Int32Array([1, 2])
      const b = new Int32Array([3, 4])
      const c = typed_array.concat(a, b)
      expect(c).to.be.instanceof(Int32Array)
      expect(c).to.be.deep.equal(new Int32Array([1, 2, 3, 4]))
    })
  })
})
