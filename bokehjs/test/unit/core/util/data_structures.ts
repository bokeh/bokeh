import {expect} from "assertions"
import {BitSet} from "@bokehjs/core/util/data_structures"

describe("core/util/data_structures module", () => {

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

    it("should suppport get() method", () => {
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

    it("should suppport iterator protocol", () => {
      expect([...bs0]).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect([...bs0.ones()]).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect([...bs0.zeros()]).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
    })

    it("should suppport a | b operation", () => {
      const bs = bs0.union(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 1, 6, 15, 16, 31, 32, 33, 34, 35, 38])
    })

    it("should suppport a & b operation", () => {
      const bs = bs0.intersection(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([1, 15, 31, 32, 38])
    })

    it("should suppport a - b operation", () => {
      const bs = bs0.difference(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect([...bs.ones()]).to.be.equal([0, 16, 33])
    })
  })
})
