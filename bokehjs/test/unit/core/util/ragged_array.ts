import {expect} from "assertions"
import {RaggedArray} from "@bokehjs/core/util/ragged_array"

describe("core/util/ragged_array module", () => {

  describe("RaggedArray data structure", () => {

    it("should be constructable", () => {
      const array = RaggedArray.from([[0], [1, 2], [3, 4, 5], [6, 7, 8, 9]], Uint8Array)
      expect(array.length).to.be.equal(4)
      expect(array.get(0)).to.be.equal(new Uint8Array([0]))
      expect(array.get(1)).to.be.equal(new Uint8Array([1, 2]))
      expect(array.get(2)).to.be.equal(new Uint8Array([3, 4, 5]))
      expect(array.get(3)).to.be.equal(new Uint8Array([6, 7, 8, 9]))
      expect([...array]).to.be.equal([
        new Uint8Array([0]),
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4, 5]),
        new Uint8Array([6, 7, 8, 9]),
      ])
    })
  })
})
