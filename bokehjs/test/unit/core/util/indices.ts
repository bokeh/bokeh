import {expect} from "#framework/assertions"
import {SubsetIndexMapper} from "@bokehjs/core/util/indices"

describe("SubsetIndexMapper", () => {

  describe("constructor", () => {
    it("should initialize with the correct size and empty subset", () => {
      const mapper = new SubsetIndexMapper(10)
      expect(mapper.size).to.be.equal(10)
      expect(mapper.has_subset_index(0)).to.be.false
      expect(() => mapper.get_global_index(0)).to.throw(Error)
    })
  })

  describe("set_subset", () => {
    it("should correctly clear old mappings when called again", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8])
      expect(mapper.has_subset_index(5)).to.be.true

      mapper.set_subset([1, 4])
      expect(mapper.has_subset_index(2)).to.be.false
      expect(mapper.has_subset_index(5)).to.be.false
      expect(mapper.has_subset_index(8)).to.be.false
      expect(mapper.has_subset_index(1)).to.be.true
      expect(mapper.get_subset_index(4)).to.be.equal(1)
      expect(mapper.get_global_index(0)).to.be.equal(1)
    })

    it("should support setting an empty subset", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([1, 2])
      mapper.set_subset([])
      expect(mapper.has_subset_index(1)).to.be.false
      expect(mapper.has_subset_index(2)).to.be.false
      expect(() => mapper.get_global_index(0)).to.throw(Error)
    })
  })

  describe("has_subset_index", () => {
    it("should return true only for global indices in the active subset", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8])
      expect(mapper.has_subset_index(2)).to.be.true
      expect(mapper.has_subset_index(5)).to.be.true
      expect(mapper.has_subset_index(8)).to.be.true
      expect(mapper.has_subset_index(3)).to.be.false
    })

    it("should return false for out-of-bounds indices", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5])
      expect(mapper.has_subset_index(-1)).to.be.false
      expect(mapper.has_subset_index(10)).to.be.false
    })
  })

  describe("get_subset_index", () => {
    it("should return the correct subset index for global indices in the subset", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8])
      expect(mapper.get_subset_index(2)).to.be.equal(0)
      expect(mapper.get_subset_index(5)).to.be.equal(1)
      expect(mapper.get_subset_index(8)).to.be.equal(2)
    })

    it("should throw for out-of-bounds global indices", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([1, 3])
      expect(() => mapper.get_subset_index(-1)).to.throw(Error, /out of bounds/i)
      expect(() => mapper.get_subset_index(5)).to.throw(Error, /out of bounds/i)
    })

    it("should throw for in-bounds global indices not in the subset", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([1, 3])
      expect(() => mapper.get_subset_index(2)).to.throw(Error, /not part of the subset/i)
    })
  })

  describe("get_global_index", () => {
    it("should return the correct global index for subset indices", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8])
      expect(mapper.get_global_index(0)).to.be.equal(2)
      expect(mapper.get_global_index(1)).to.be.equal(5)
      expect(mapper.get_global_index(2)).to.be.equal(8)
    })

    it("should throw for out-of-bounds subset indices", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([1, 3])
      expect(() => mapper.get_global_index(-1)).to.throw(Error, /out of bounds/i)
      expect(() => mapper.get_global_index(2)).to.throw(Error, /out of bounds/i)
    })
  })

  describe("convert_indices_to_subset", () => {
    it("should map global indices to their corresponding subset indices", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8, 9])
      expect(mapper.convert_indices_to_subset([9, 5, 2])).to.be.equal([3, 1, 0])
    })

    it("should throw if any global index is not in the subset", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([1, 3])
      expect(() => mapper.convert_indices_to_subset([1, 2])).to.throw(Error)
    })
  })

  describe("convert_indices_from_subset", () => {
    it("should map subset indices back to their corresponding global indices", () => {
      const mapper = new SubsetIndexMapper(10)
      mapper.set_subset([2, 5, 8, 9])
      expect(mapper.convert_indices_from_subset([3, 1, 0])).to.be.equal([9, 5, 2])
    })
  })

  describe("subset_index_of", () => {
    it("should return the subset index of the first matching value", () => {
      const mapper = new SubsetIndexMapper(5)
      const data = ["apple", "banana", "cherry", "date", "elderberry"]
      mapper.set_subset([1, 3, 4])
      expect(mapper.subset_index_of(data, "banana")).to.be.equal(0)
      expect(mapper.subset_index_of(data, "date")).to.be.equal(1)
    })

    it("should return null for a value not in the active subset", () => {
      const mapper = new SubsetIndexMapper(5)
      const data = ["apple", "banana", "cherry", "date", "elderberry"]
      mapper.set_subset([1, 3, 4])
      expect(mapper.subset_index_of(data, "apple")).to.be.null
      expect(mapper.subset_index_of(data, "fig")).to.be.null
    })

    it("should return null when the subset is empty", () => {
      const mapper = new SubsetIndexMapper(5)
      mapper.set_subset([])
      expect(mapper.subset_index_of(["apple", "banana"], "apple")).to.be.null
    })
  })
})