import {expect} from "assertions"
import {BitSet} from "@bokehjs/core/util/bitset"
import {range} from "@bokehjs/core/util/array"
import {is_equal} from "@bokehjs/core/util/eq"
import {may_have_refs} from "@bokehjs/core/util/refs"

describe("core/util/bitset module", () => {

  describe("BitSet data structure", () => {

    it("should constructable", () => {
      const bs0 = new BitSet(39)
      expect(bs0.size).to.be.equal(39)
      expect([...bs0].length).to.be.equal(0)

      const bs1 = new BitSet(39, 0)
      expect(bs1.size).to.be.equal(39)
      expect([...bs1].length).to.be.equal(0)

      const bs2 = new BitSet(39, 1)
      expect(bs2.size).to.be.equal(39)
      expect([...bs2].length).to.be.equal(39)
    })

    const bs0 = BitSet.from_indices(39, [0, 1, 15, 16, 31, 32, 33, 38])
    const bs1 = BitSet.from_indices(39, [1, 6, 15, 31, 32, 34, 35, 38])

    it("should support get() method", () => {
      expect(bs0.get(0)).to.be.equal(true)
      expect(bs0.get(1)).to.be.equal(true)
      expect(bs0.get(2)).to.be.equal(false)

      expect(bs0.get(14)).to.be.equal(false)
      expect(bs0.get(15)).to.be.equal(true)
      expect(bs0.get(16)).to.be.equal(true)
      expect(bs0.get(17)).to.be.equal(false)

      expect(bs0.get(30)).to.be.equal(false)
      expect(bs0.get(31)).to.be.equal(true)
      expect(bs0.get(32)).to.be.equal(true)
      expect(bs0.get(33)).to.be.equal(true)
      expect(bs0.get(34)).to.be.equal(false)

      expect(bs0.get(36)).to.be.equal(false)
      expect(bs0.get(37)).to.be.equal(false)
      expect(bs0.get(38)).to.be.equal(true)

      expect(() => bs0.get(39)).to.throw()
    })

    it("should support iterator protocol", () => {
      expect([...bs0]).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect([...bs0.ones()]).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect([...bs0.zeros()]).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
    })

    it("should support count getter", () => {
      expect(bs0.count).to.be.equal(8)
      expect(bs1.count).to.be.equal(8)
    })

    it("should support ~a", () => {
      const bs = bs0.inversion()
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
      expect(bs.count).to.be.equal(31)
    })

    it("should support a | b operation", () => {
      const bs = bs0.union(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 1, 6, 15, 16, 31, 32, 33, 34, 35, 38])
      expect(bs.count).to.be.equal(11)
    })

    it("should support a & b operation", () => {
      const bs = bs0.intersection(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([1, 15, 31, 32, 38])
      expect(bs.count).to.be.equal(5)
    })

    it("should support a - b operation", () => {
      const bs = bs0.difference(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 16, 33])
      expect(bs.count).to.be.equal(3)
    })

    it("should support a ^ b operation", () => {
      const bs = bs0.symmetric_difference(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 6, 16, 33, 34, 35])
      expect(bs.count).to.be.equal(6)
    })

    it("should support inplace ~a", () => {
      const bs = bs0.clone()
      bs.invert()
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
      expect(bs.count).to.be.equal(31)
    })

    it("should support inplace a | b operation", () => {
      const bs = bs0.clone()
      bs.add(bs1)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 1, 6, 15, 16, 31, 32, 33, 34, 35, 38])
      expect(bs.count).to.be.equal(11)
    })

    it("should support inplace a & b operation", () => {
      const bs = bs0.clone()
      bs.intersect(bs1)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([1, 15, 31, 32, 38])
      expect(bs.count).to.be.equal(5)
    })

    it("should support inplace a - b operation", () => {
      const bs = bs0.clone()
      bs.subtract(bs1)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 16, 33])
      expect(bs.count).to.be.equal(3)
    })

    it("should support inplace a ^ b operation", () => {
      const bs = bs0.clone()
      bs.symmetric_subtract(bs1)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 6, 16, 33, 34, 35])
      expect(bs.count).to.be.equal(6)
    })

    it("should support selection from an array", () => {
      const k = 100
      expect(bs0.select(range(k, k + bs0.size))).to.be.equal([100, 101, 115, 116, 131, 132, 133, 138])
      expect(bs1.select(range(k, k + bs1.size))).to.be.equal([101, 106, 115, 131, 132, 134, 135, 138])
    })

    it("should support selection from an oversized array", () => {
      const k = 100
      expect(bs0.select(range(k, k + bs0.size + 10))).to.be.equal([100, 101, 115, 116, 131, 132, 133, 138])
      expect(bs1.select(range(k, k + bs1.size + 10))).to.be.equal([101, 106, 115, 131, 132, 134, 135, 138])
    })

    it("should support equality comparisons", () => {
      const bs2 = BitSet.from_indices(159, [])
      const bs3 = BitSet.from_indices(159, [158])
      expect(is_equal(bs2, bs3)).to.be.equal(false)
    })

    it("doesn't have refs", () => {
      expect(may_have_refs(new BitSet(10))).to.be.equal(false)
    })
  })
})
