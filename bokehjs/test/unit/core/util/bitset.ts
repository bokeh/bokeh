import {expect} from "#framework/assertions"
import {trap} from "#framework/util"

import {BitSet} from "@bokehjs/core/util/bitset"
import {range} from "@bokehjs/core/util/array"
import {is_equal} from "@bokehjs/core/util/eq"
import {may_have_refs} from "@bokehjs/core/util/refs"
import {version as js_version} from "@bokehjs/version"

const bsc0 = BitSet.from_indices(39, [0, 1, 15, 16, 31, 32, 33, 38])
const bsc1 = BitSet.from_indices(39, [1, 6, 15, 31, 32, 34, 35, 38])

const _prime_count = (bs: BitSet): BitSet => {
  void bs.count // populate the cached count
  return bs
}

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

      expect(bs0.get(-1)).to.be.equal(true)
      expect(bs0.get(39)).to.be.equal(false)

      expect(bs0.get(-39)).to.be.equal(true)
      expect(bs0.get(-40)).to.be.equal(false)
    })

    it("should support set() method", () => {
      const bs = BitSet.from_indices(5, [0, 1, 4])

      expect(bs.get(0)).to.be.true
      bs.set(0, false)
      expect(bs.get(0)).to.be.false
      bs.set(0, true)
      expect(bs.get(0)).to.be.true

      expect(bs.get(-1)).to.be.true
      expect(bs.get(4)).to.be.true
      bs.set(-1, false)
      expect(bs.get(-1)).to.be.false
      expect(bs.get(4)).to.be.false
      bs.set(-1, true)
      expect(bs.get(-1)).to.be.true
      expect(bs.get(4)).to.be.true

      const out0 = trap(() => bs.set(5, true))
      expect(out0.warn).to.be.equal(`[bokeh ${js_version}] out of bounds access: index=5 >= size=5\n`)
      expect(bs.get(5)).to.be.false

      const out1 = trap(() => bs.set(-6, true))
      expect(out1.warn).to.be.equal(`[bokeh ${js_version}] out of bounds access: index=-1 >= size=5\n`)
      expect(bs.get(-6)).to.be.false
    })

    it("should support iterator protocol", () => {
      expect([...bs0]).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect(bs0.ones()).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
      expect(bs0.zeros()).to.be.equal([
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
      expect(bs.ones()).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
      expect(bs.count).to.be.equal(31)
    })

    it("should support a | b operation", () => {
      const bs = bs0.union(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 1, 6, 15, 16, 31, 32, 33, 34, 35, 38])
      expect(bs.count).to.be.equal(11)
    })

    it("should support a & b operation", () => {
      const bs = bs0.intersection(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([1, 15, 31, 32, 38])
      expect(bs.count).to.be.equal(5)
    })

    it("should support a - b operation", () => {
      const bs = bs0.difference(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 16, 33])
      expect(bs.count).to.be.equal(3)
    })

    it("should support a ^ b operation", () => {
      const bs = bs0.symmetric_difference(bs1)
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 6, 16, 33, 34, 35])
      expect(bs.count).to.be.equal(6)
    })

    it("should support inplace ~a", () => {
      const bs = bs0.clone()
      bs.invert()
      expect(bs).to.be.instanceof(BitSet)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 34, 35, 36, 37,
      ])
      expect(bs.count).to.be.equal(31)
    })

    it("should support inplace a | b operation", () => {
      const bs = bs0.clone()
      bs.add(bs1)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 1, 6, 15, 16, 31, 32, 33, 34, 35, 38])
      expect(bs.count).to.be.equal(11)
    })

    it("should support inplace a & b operation", () => {
      const bs = bs0.clone()
      bs.intersect(bs1)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([1, 15, 31, 32, 38])
      expect(bs.count).to.be.equal(5)
    })

    it("should support inplace a - b operation", () => {
      const bs = bs0.clone()
      bs.subtract(bs1)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 16, 33])
      expect(bs.count).to.be.equal(3)
    })

    it("should support inplace a ^ b operation", () => {
      const bs = bs0.clone()
      bs.symmetric_subtract(bs1)
      expect(bs.size).to.be.equal(39)
      expect(bs.ones()).to.be.equal([0, 6, 16, 33, 34, 35])
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

    it("zeros() should return exactly the unset indices", () => {
      expect(new BitSet(39, 1).zeros()).to.be.equal([])
      expect(new BitSet(39, 0).zeros().length).to.be.equal(39)
      expect(bs0.inversion().zeros()).to.be.equal([0, 1, 15, 16, 31, 32, 33, 38])
    })
  })

  describe("BitSet count", () => {
    it("should handle sizes around word boundaries", () => {
      for (const size of [0, 1, 31, 32, 33, 63, 64, 65, 100]) {
        expect(BitSet.all_unset(size).count).to.be.equal(0)
        expect(BitSet.all_set(size).count).to.be.equal(size)
        // invert() sets bits beyond `size` in the trailing word; they must not be counted
        expect(BitSet.all_unset(size).inversion().count).to.be.equal(size)
      }
    })

    it("should be updated after set() and unset()", () => {
      const bs = BitSet.from_indices(40, [1, 2, 3])
      expect(bs.count).to.be.equal(3)  // prime the cache

      bs.set(10)
      expect(bs.count).to.be.equal(4)
      bs.set(10)                       // already set
      expect(bs.count).to.be.equal(4)
      bs.unset(1)
      expect(bs.count).to.be.equal(3)
      bs.unset(1)                      // already unset
      expect(bs.count).to.be.equal(3)
      bs.set(-1)                       // negative index
      expect(bs.count).to.be.equal(4)

      trap(() => bs.set(40))           // out of bounds, must not change anything
      expect(bs.count).to.be.equal(4)
    })

    it("should be updated after in-place operations", () => {
      const a = _prime_count(bsc0.clone()); a.add(bsc1)
      expect(a.count).to.be.equal(11)

      const b = _prime_count(bsc0.clone()); b.intersect(bsc1)
      expect(b.count).to.be.equal(5)

      const c = _prime_count(bsc0.clone()); c.subtract(bsc1)
      expect(c.count).to.be.equal(3)

      const d = _prime_count(bsc0.clone()); d.symmetric_subtract(bsc1)
      expect(d.count).to.be.equal(6)

      const e = _prime_count(bsc0.clone()); e.invert()
      expect(e.count).to.be.equal(31)
    })

    it("should not be shared between clones", () => {
      const a = _prime_count(bsc0.clone())
      const b = a.clone()
      b.set(2)
      expect(a.count).to.be.equal(8)
      expect(b.count).to.be.equal(9)
    })

    it("should agree with a naive count for pseudo-random bit sets", () => {
      let seed = 12345
      const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2**32
      for (const size of [1, 31, 32, 33, 64, 95, 200]) {
        const indices: number[] = []
        for (let i = 0; i < size; i++) {
          if (rand() < 0.3) {
            indices.push(i)
          }
        }
        const bs = BitSet.from_indices(size, indices)
        expect(bs.count).to.be.equal(indices.length)
        bs.invert()
        expect(bs.count).to.be.equal(size - indices.length)
      }
    })
  })
})
