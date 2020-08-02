import {expect} from "assertions"

import {
  FactorRange, map_one_level, map_two_levels,
  L1OffsetFactor, L2OffsetFactor, L3OffsetFactor,
} from "@bokehjs/models/ranges/factor_range"
import {NumberArray} from '@bokehjs/core/types'

describe("factor_range module", () => {

  describe("default creation", () => {
    const r = new FactorRange()

    it("should have empty factors", () => {
      expect(r.factors).to.be.equal([])
    })

    it("should have start=0", () => {
      expect(r.start).to.be.equal(0)
    })

    it("should not be reversed ", () => {
      expect(r.is_reversed).to.be.false
    })
  })

  describe("reset method", () => {

  })

  describe("changing model attribute", () => {

  })

  describe("map_one_level function", () => {

    describe("with zero padding", () => {

      it("should evenly map a list of factors starting at 0.5 (with no offset by default)", () => {
        const [m0, p0] = map_one_level(['a'], 0)
        expect(m0).to.be.equal(new Map([["a", {value: 0.5}]]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_one_level(['a', 'b'], 0)
        expect(m1).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 1.5}]]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_one_level(['a', 'b', 'c'], 0)
        expect(m2).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 1.5}], ["c", {value: 2.5}]]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_one_level(['a', 'b', 'c', 'd'], 0)
        expect(m3).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 1.5}], ["c", {value: 2.5}], ["d", {value: 3.5}]]))
        expect(p3).to.be.equal(0)
      })

      it("should also apply an offset if provided", () => {
        const [m0, p0] = map_one_level(['a'], 0, 1)
        expect(m0).to.be.equal(new Map([["a", {value: 1.5}]]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_one_level(['a', 'b'], 0, 1)
        expect(m1).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 2.5}]]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_one_level(['a', 'b', 'c'], 0, 1)
        expect(m2).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 2.5}], ["c", {value: 3.5}]]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_one_level(['a', 'b', 'c', 'd'], 0, 1)
        expect(m3).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 2.5}], ["c", {value: 3.5}], ["d", {value: 4.5}]]))
        expect(p3).to.be.equal(0)
      })

      describe("with positive padding", () => {

        it("should evenly map a list of factors, padded, starting at 0.5 (with no offset by default)", () => {
          const [m0, p0] = map_one_level(['a'], 0.5)
          expect(m0).to.be.equal(new Map([["a", {value: 0.5}]]))
          expect(p0).to.be.equal(0)

          const [m1, p1] = map_one_level(['a', 'b'], 0.5)
          expect(m1).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 2}]]))
          expect(p1).to.be.equal(0.5)

          const [m2, p2] = map_one_level(['a', 'b', 'c'], 0.5)
          expect(m2).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 2}], ["c", {value: 3.5}]]))
          expect(p2).to.be.equal(1)

          const [m3, p3] = map_one_level(['a', 'b', 'c', 'd'], 0.5)
          expect(m3).to.be.equal(new Map([["a", {value: 0.5}], ["b", {value: 2}], ["c", {value: 3.5}], ["d", {value: 5}]]))
          expect(p3).to.be.equal(1.5)
        })

        it("should also apply an offset if provided", () => {
          const [m0, p0] = map_one_level(['a'], 0.5, 1)
          expect(m0).to.be.equal(new Map([["a", {value: 1.5}]]))
          expect(p0).to.be.equal(0)

          const [m1, p1] = map_one_level(['a', 'b'], 0.5, 1)
          expect(m1).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 3}]]))
          expect(p1).to.be.equal(0.5)

          const [m2, p2] = map_one_level(['a', 'b', 'c'], 0.5, 1)
          expect(m2).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 3}], ["c", {value: 4.5}]]))
          expect(p2).to.be.equal(1)

          const [m3, p3] = map_one_level(['a', 'b', 'c', 'd'], 0.5, 1)
          expect(m3).to.be.equal(new Map([["a", {value: 1.5}], ["b", {value: 3}], ["c", {value: 4.5}], ["d", {value: 6}]]))
          expect(p3).to.be.equal(1.5)
        })
      })
    })
  })

  describe("map_two_levels function", () => {

    describe("with zero outer_padding and zero factor_padding", () => {

      it("should evenly map a list of factors starting at 0.5 (with no offset by default)", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 0, 0)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 0.5, mapping: new Map([["1", {value: 0.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 0, 0)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 1, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}]])}],
        ]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 0, 0)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
        ]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 0, 0)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 3.5, mapping: new Map([["1", {value: 3.5}]])}],
        ]))
        expect(p3).to.be.equal(0)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 0, 0)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 4,   mapping: new Map([["1", {value: 3.5}], ["4", {value: 4.5}]])}],
        ]))
        expect(p4).to.be.equal(0)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 0, 0)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 4,   mapping: new Map([["1", {value: 3.5}], ["4", {value: 4.5}]])}],
          ["c", {value: 5.5, mapping: new Map([["0", {value: 5.5}]])}],
        ]))
        expect(p5).to.be.equal(0)
      })

      it("should also apply an offset if provided", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 0, 0, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 1.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 0, 0, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 2, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}]])}],
        ]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 0, 0, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
        ]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 0, 0, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 4.5, mapping: new Map([["1", {value: 4.5}]])}],
        ]))
        expect(p3).to.be.equal(0)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 0, 0, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 5, mapping: new Map([["1", {value: 4.5}], ["4", {value: 5.5}]])}],
        ]))
        expect(p4).to.be.equal(0)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 0, 0, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 5, mapping: new Map([["1", {value: 4.5}], ["4", {value: 5.5}]])}],
          ["c", {value: 6.5, mapping: new Map([["0", {value: 6.5}]])}],
        ]))
        expect(p5).to.be.equal(0)
      })
    })

    describe("with nonzero outer_padding and zero factor_padding", () => {

      it("should map a list of factors starting at 0.5 (with no offset by default)", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 2, 0)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 0.5, mapping: new Map([["1", {value: 0.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 2, 0)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 1, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}]])}],
        ]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 2, 0)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
        ]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 2, 0)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 5.5, mapping: new Map([["1", {value: 5.5}]])}],
        ]))
        expect(p3).to.be.equal(2)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 2, 0)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 6,   mapping: new Map([["1", {value: 5.5}], ["4", {value: 6.5}]])}],
        ]))
        expect(p4).to.be.equal(2)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 2, 0)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 1.5}], ["3", {value: 2.5}]])}],
          ["b", {value: 6,   mapping: new Map([["1", {value: 5.5}], ["4", {value: 6.5}]])}],
          ["c", {value: 9.5, mapping: new Map([["0", {value: 9.5}]])}],
        ]))
        expect(p5).to.be.equal(4)
      })

      it("should also apply an offset if provided", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 2, 0, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 1.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 2, 0, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 2, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}]])}],
        ]))
        expect(p1).to.be.equal(0)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 2, 0, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
        ]))
        expect(p2).to.be.equal(0)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 2, 0, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 6.5, mapping: new Map([["1", {value: 6.5}]])}],
        ]))
        expect(p3).to.be.equal(2)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 2, 0, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 7, mapping: new Map([["1", {value: 6.5}], ["4", {value: 7.5}]])}],
        ]))
        expect(p4).to.be.equal(2)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 2, 0, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value:  1.5}], ["2", {value: 2.5}], ["3", {value: 3.5}]])}],
          ["b", {value: 7, mapping: new Map([["1", {value:  6.5}], ["4", {value: 7.5}]])}],
          ["c", {value: 10.5, mapping: new Map([["0", {value: 10.5}]])}],
        ]))
        expect(p5).to.be.equal(4)
      })
    })

    describe("with zero outer_padding and nonzero factor_padding", () => {

      it("should map a list of factors starting at 0.5 (with no offset by default)", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 0, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 0.5, mapping: new Map([["1", {value: 0.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 0, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}]])}],
        ]))
        expect(p1).to.be.equal(1)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 0, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
        ]))
        expect(p2).to.be.equal(2)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 0, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 5.5, mapping: new Map([["1", {value: 5.5}]])}],
        ]))
        expect(p3).to.be.equal(2)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 0, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 6.5, mapping: new Map([["1", {value: 5.5}], ["4", {value: 7.5}]])}],
        ]))
        expect(p4).to.be.equal(3)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 0, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 6.5, mapping: new Map([["1", {value: 5.5}], ["4", {value: 7.5}]])}],
          ["c", {value: 8.5, mapping: new Map([["0", {value: 8.5}]])}],
        ]))
        expect(p5).to.be.equal(3)
      })

      it("should also apply an offset if provided", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 0, 1, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 1.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 0, 1, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}]])}],
        ]))
        expect(p1).to.be.equal(1)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 0, 1, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
        ]))
        expect(p2).to.be.equal(2)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 0, 1, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 6.5, mapping: new Map([["1", {value: 6.5}]])}],
        ]))
        expect(p3).to.be.equal(2)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 0, 1, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 7.5, mapping: new Map([["1", {value: 6.5}], ["4", {value: 8.5}]])}],
        ]))
        expect(p4).to.be.equal(3)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 0, 1, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 7.5, mapping: new Map([["1", {value: 6.5}], ["4", {value: 8.5}]])}],
          ["c", {value: 9.5, mapping: new Map([["0", {value: 9.5}]])}],
        ]))
        expect(p5).to.be.equal(3)
      })
    })

    describe("with nonzero outer_padding and nonzero factor_padding", () => {

      it("should map a list of factors starting at 0.5 (with no offset by default)", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 2, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 0.5, mapping: new Map([["1", {value: 0.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 2, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}]])}],
        ]))
        expect(p1).to.be.equal(1)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 2, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
        ]))
        expect(p2).to.be.equal(2)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 2, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 7.5, mapping: new Map([["1", {value: 7.5}]])}],
        ]))
        expect(p3).to.be.equal(4)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 2, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 8.5, mapping: new Map([["1", {value: 7.5}], ["4", {value: 9.5}]])}],
        ]))
        expect(p4).to.be.equal(5)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 2, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 0.5}], ["2", {value: 2.5}], ["3", {value: 4.5}]])}],
          ["b", {value: 8.5, mapping: new Map([["1", {value: 7.5}], ["4", {value: 9.5}]])}],
          ["c", {value: 12.5, mapping: new Map([["0", {value: 12.5}]])}],
        ]))
        expect(p5).to.be.equal(7)
      })

      it("should also apply an offset if provided", () => {
        const [m0, p0] = map_two_levels([['a', '1']], 2, 1, 1)
        expect(m0).to.be.equal(new Map([
          ["a", {value: 1.5, mapping: new Map([["1", {value: 1.5}]])}],
        ]))
        expect(p0).to.be.equal(0)

        const [m1, p1] = map_two_levels([['a', '1'], ['a', '2']], 2, 1, 1)
        expect(m1).to.be.equal(new Map([
          ["a", {value: 2.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}]])}],
        ]))
        expect(p1).to.be.equal(1)

        const [m2, p2] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3']], 2, 1, 1)
        expect(m2).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
        ]))
        expect(p2).to.be.equal(2)

        const [m3, p3] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1']], 2, 1, 1)
        expect(m3).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 8.5, mapping: new Map([["1", {value: 8.5}]])}],
        ]))
        expect(p3).to.be.equal(4)

        const [m4, p4] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4']], 2, 1, 1)
        expect(m4).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 9.5, mapping: new Map([["1", {value: 8.5}], ["4", {value: 10.5}]])}],
        ]))
        expect(p4).to.be.equal(5)

        const [m5, p5] = map_two_levels([['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '4'], ['c', '0']], 2, 1, 1)
        expect(m5).to.be.equal(new Map([
          ["a", {value: 3.5, mapping: new Map([["1", {value: 1.5}], ["2", {value: 3.5}], ["3", {value: 5.5}]])}],
          ["b", {value: 9.5, mapping: new Map([["1", {value: 8.5}], ["4", {value: 10.5}]])}],
          ["c", {value: 13.5, mapping: new Map([["0", {value: 13.5}]])}],
        ]))
        expect(p5).to.be.equal(7)
      })
    })
  })

  describe("map_three_levels function", () => {})

  describe("simple list of factors", () => {

    describe("validation", () => {

      it("should throw an error on duplicate factors", () => {
        expect(() => new FactorRange({factors: ['a', 'a']})).to.throw()
      })

      /* XXX: null
      it("should throw an error on null factors", () => {
        expect(() => new FactorRange({factors: [null]})).to.throw()
        expect(() => new FactorRange({factors: ['a', null]})).to.throw()
        expect(() => new FactorRange({factors: [null, 'a']})).to.throw()
      })
      */
    })

    describe("levels internal property", () => {

      it("should be set to 1", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D']})
        expect(r.levels).to.be.equal(1)
      })
    })

    describe("mids internal property", () => {

      it("should be set to null", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D']})
        expect(r.mids).to.be.null
      })
    })

    describe("tops internal property", () => {

      it("should be set to null", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D']})
        expect(r.tops).to.be.null
      })
    })

    describe("min/max properties", () => {
      const r = new FactorRange({factors: ['FOO']})

      it("should return values from synthetic range", () => {
        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = ['FOO', 'BAR']

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(2)

        r.factors = ['A', 'B', 'C']

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(3)
      })

      it("min should equal start", () => {
        expect(r.min).to.be.equal(r.start)
      })

      it("max should equal end", () => {
        expect(r.max).to.be.equal(r.end)
      })
    })

    describe("start/end properties", () => {
      const r = new FactorRange({factors: ['FOO']})

      it("should return values from synthetic range", () => {
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = ['FOO', 'BAR']

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(2)

        r.factors = ['A', 'B', 'C']

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3)
      })
    })

    describe("range_padding", () => {

      it("should not pad start/end by  by default", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D']}) // default range padding

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4)
      })

      it("should update start/end when changed", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D'], range_padding: 0.1})
        expect(r.start).to.be.equal(-0.2)
        expect(r.end).to.be.equal(4.2)

        r.range_padding = 0.2
        expect(r.start).to.be.equal(-0.4)
        expect(r.end).to.be.equal(4.4)
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: ['A', 'B'], range_padding: 0.1})
        expect(r.start).to.be.equal(-0.1)
        expect(r.end).to.be.equal(2.1)

        r.factors = ['A']
        expect(r.start).to.be.equal(-0.05)
        expect(r.end).to.be.equal(1.05)
      })

      it("should accept absolute units", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C', 'D'], range_padding_units: "absolute", range_padding: 1})

        expect(r.start).to.be.equal(-1)
        expect(r.end).to.be.equal(5)
      })
    })

    describe("factor_padding", () => {

      it("should pad all factors", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C'], factor_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic(['A', 'B', 'C'])).to.be.equal(new NumberArray([0.5, 1.6, 2.7]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: ['A', 'B', 'C'], factor_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic(['A', 'B', 'C'])).to.be.equal(new NumberArray([0.5, 1.6, 2.7]))

        r.factor_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.4)
        expect(r.v_synthetic(['A', 'B', 'C'])).to.be.equal(new NumberArray([0.5, 1.7, 2.9]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: ['A', 'B'], factor_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(2.1)
        expect(r.v_synthetic(['A', 'B'])).to.be.equal(new NumberArray([0.5, 1.6]))

        r.factors = ['A', 'B', 'C']
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic(['A', 'B', 'C'])).to.be.equal(new NumberArray([0.5, 1.6, 2.7]))
      })
    })

    describe("synthetic method", () => {
      const r = new FactorRange({factors: ['A', 'B', 'C']})

      it("should return numeric offsets as-is", () => {
        expect(r.synthetic(10)).to.be.equal(10)
        expect(r.synthetic(10.2)).to.be.equal(10.2)
        expect(r.synthetic(-5.7)).to.be.equal(-5.7)
        expect(r.synthetic(-5)).to.be.equal(-5)
      })

      it("should map simple factors to synthetic coords", () => {
        expect(r.synthetic("A")).to.be.equal(0.5)
        expect(r.synthetic("B")).to.be.equal(1.5)
        expect(r.synthetic("C")).to.be.equal(2.5)
      })

      it("should map simple factors with offsets to synthetic coords", () => {
        expect(r.synthetic(["A", 0.1])).to.be.equal(0.6)
        expect(r.synthetic(["B", -0.2])).to.be.equal(1.3)
        expect(r.synthetic(["C"])).to.be.equal(2.5)
      })

      it("should not modify inputs", () => {
        const x: L1OffsetFactor = ["B", -0.2]
        r.synthetic(x)
        expect(x).to.be.equal(["B", -0.2])
      })

      it("should return NaN for unknown factors", () => {
        expect(r.synthetic(['JUNK'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1'])).to.be.NaN
      })
    })

    describe("v_synthetic method", () => {
      const r = new FactorRange({factors: ['A', 'B', 'C']})

      it("should return an Array", () => {
        const x0 = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x0).to.be.instanceof(NumberArray)

        const x1 = r.v_synthetic(["A", "B", "C", "A"])
        expect(x1).to.be.instanceof(NumberArray)

        const x2 = r.v_synthetic([])
        expect(x2).to.be.instanceof(NumberArray)
      })

      it("should return lists of numeric offsets as-is", () => {
        const x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.equal(new NumberArray([10, 10.2, -5.7, -5]))
      })

      it("should map simple factors to synthetic coords", () => {
        expect(r.v_synthetic(["A", "B", "C", "A"])).to.be.equal(new NumberArray([0.5, 1.5, 2.5, 0.5]))
      })

      it("should map simple factors with offsets to synthetic coords", () => {
        expect(r.v_synthetic([["A", 0.1], ["B", -0.2], ["C"], ["A", 0]])).to.be.equal(new NumberArray([0.6, 1.3, 2.5, 0.5]))
      })

      it("should not modify inputs", () => {
        const x: L1OffsetFactor[] = [["A", 0.1], ["B", -0.2]]
        r.v_synthetic(x)
        expect(x).to.be.equal([["A", 0.1], ["B", -0.2]])
      })

      it("should map unknown factors to NaN", () => {
        expect(r.v_synthetic(["A", "JUNK", "C", "A"])).to.be.equal(new NumberArray([0.5, NaN, 2.5, 0.5]))
        expect(r.v_synthetic([["A", 0.1], ["JUNK", -0.2], ["C"], ["A", 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5, 0.5]))
      })
    })
  })

  describe("tuple list of double factors", () => {

    describe("validation", () => {

      it("should throw an error on duplicate factors", () => {
        expect(() => new FactorRange({factors: [['a', '1'], ['a', '1']]})).to.throw()
      })

      /* XXX: null
      it("should throw an error on null factors", () => {
        expect(() => new FactorRange({factors: [[null, 'a'], ['b', 'c']]})).to.throw()
        expect(() => new FactorRange({factors: [['a', null], ['b', 'c']]})).to.throw()
        expect(() => new FactorRange({factors: [[null, null], ['b', 'c']]})).to.throw()
      })
      */

      it("should allow sub-factors repeated on different levels", () => {
        expect(() => new FactorRange({factors: [['a', 'foo'], ['a', 'bar']]})).to.not.throw()
        expect(() => new FactorRange({factors: [['a', 'foo'], ['b', 'foo']]})).to.not.throw()
      })
    })

    describe("levels internal property", () => {

      it("should be set to 2", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})
        expect(r.levels).to.be.equal(2)
      })
    })

    describe("mids internal property", () => {

      it("should be set to null", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})
        expect(r.mids).to.be.null
      })
    })

    describe("tops internal property", () => {

      it("should be set to unique ordered list of top level factors", () => {
        const r0 = new FactorRange({factors: [['A', '1'], ['A', '2']]})
        expect(r0.tops).to.be.equal(['A'])

        const r1 = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']]})
        expect(r1.tops).to.be.equal(['A', 'C'])

        const r2 = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '1']]})
        expect(r2.tops).to.be.equal(['A', 'C', 'D'])
      })
    })

    describe("min/max properties", () => {
      const r = new FactorRange({factors: [['FOO', 'a']], group_padding: 0})

      it("should return values from synthetic range", () => {
        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = [['FOO', 'a'], ['BAR', 'b']]

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(2)

        r.factors = [['A', '1'], ['A', '2'], ['C', '1']]

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(3)
      })

      it("min should equal start", () => {
        expect(r.min).to.be.equal(r.start)
      })

      it("max should equal end", () => {
        expect(r.max).to.be.equal(r.end)
      })
    })

    describe("start/end properties", () => {
      const r = new FactorRange({factors: [['FOO', 'a']], group_padding: 0})

      it("should return values from synthetic range", () => {
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = [['FOO', 'a'], ['BAR', 'b']]

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(2)

        r.factors = [['A', '1'], ['A', '2'], ['C', '1']]

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3)
      })
    })

    describe("range_padding", () => {

      it("should not pad start/end by default", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']], group_padding: 0})

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4)
      })

      it("should update start/end when changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']], group_padding: 0, range_padding: 0.1})
        expect(r.start).to.be.equal(-0.2)
        expect(r.end).to.be.equal(4.2)

        r.range_padding = 0.2
        expect(r.start).to.be.equal(-0.4)
        expect(r.end).to.be.equal(4.4)
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2']], group_padding: 0, range_padding: 0.1})
        expect(r.start).to.be.equal(-0.1)
        expect(r.end).to.be.equal(2.1)

        r.factors = ['A']
        expect(r.start).to.be.equal(-0.05)
        expect(r.end).to.be.equal(1.05)
      })

      it("should accept absolute units", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']], range_padding_units: "absolute", range_padding: 1, group_padding: 0})

        expect(r.start).to.be.equal(-1)
        expect(r.end).to.be.equal(5)
      })
    })

    describe("factor_padding", () => {

      it("should pad all low-level factors", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], factor_padding: 0.1, group_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], factor_padding: 0.1, group_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.factor_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.7, 2.7]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], factor_padding: 0.1, group_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.factors = [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']]
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6, 3.6]))
      })
    })

    describe("group_padding", () => {

      it("should pad all top-level groups", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))

        r.group_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.5, 2.7]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))

        r.factors = [['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']]
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4.2)
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1'], ['D', '2']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6, 3.7]))
      })
    })

    describe("synthetic method", () => {
      const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], group_padding: 0})

      it("should return numeric offsets as-is", () => {
        expect(r.synthetic(10)).to.be.equal(10)
        expect(r.synthetic(10.2)).to.be.equal(10.2)
        expect(r.synthetic(-5.7)).to.be.equal(-5.7)
        expect(r.synthetic(-5)).to.be.equal(-5)
      })

      it("should map dual factors to synthetic coords", () => {
        expect(r.synthetic(['A', '1'])).to.be.equal(0.5)
        expect(r.synthetic(['A', '2'])).to.be.equal(1.5)
        expect(r.synthetic(['C', '1'])).to.be.equal(2.5)
      })

      it("should map dual factors with offsets to synthetic coords", () => {
        expect(r.synthetic(['A', '1', 0.1])).to.be.equal(0.6)
        expect(r.synthetic(['A', '2', -0.2])).to.be.equal(1.3)
        expect(r.synthetic(['C', '1', 0.0])).to.be.equal(2.5)
      })

      it("should map first-level factors to average group synthetic coords", () => {
        expect(r.synthetic(['A'])).to.be.equal(1)
        expect(r.synthetic(['C'])).to.be.equal(2.5)

        expect(r.synthetic('A')).to.be.equal(1)
        expect(r.synthetic('C')).to.be.equal(2.5)
      })

      it("should map first-level factors with offsets to average group synthetic coords", () => {
        expect(r.synthetic(['A', 0.1])).to.be.equal(1.1)
        expect(r.synthetic(['C', -0.2])).to.be.equal(2.3)
        expect(r.synthetic(['C', 0.0])).to.be.equal(2.5)
      })

      it("should not modify inputs", () => {
        const x: L2OffsetFactor = ['A', '1', 0.1]
        r.synthetic(x)
        expect(x).to.be.equal(['A', '1', 0.1])
      })

      it("should return NaN for unknown factors", () => {
        expect(r.synthetic(['JUNK'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1', 0.1])).to.be.NaN
        expect(r.synthetic(['A', 'JUNK', 0.1])).to.be.NaN
      })
    })

    describe("v_synthetic method", () => {
      const r = new FactorRange({factors: [['A', '1'], ['A', '2'], ['C', '1']], group_padding: 0})

      it("should return an Array", () => {
        const x0 = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x0).to.be.instanceof(NumberArray)

        const x1 = r.v_synthetic(["A", "C", "A"])
        expect(x1).to.be.instanceof(NumberArray)

        const x2 = r.v_synthetic([])
        expect(x2).to.be.instanceof(NumberArray)
      })

      it("should return lists of numeric offsets as-is", () => {
        const x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.equal(new NumberArray([10, 10.2, -5.7, -5]))
      })

      it("should map dual factors to synthetic coords", () => {
        expect(r.v_synthetic([['A', '1'], ['A', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, 1.5, 2.5]))
      })

      it("should map dual factors with offsets to synthetic coords", () => {
        expect(r.v_synthetic([['A', '1', 0.1], ['A', '2', -0.2], ['C', '1', 0]])).to.be.equal(new NumberArray([0.6, 1.3, 2.5]))
      })

      it("should map first-level factors to average group synthetic coords", () => {
        expect(r.v_synthetic([['A'], ['C']])).to.be.equal(new NumberArray([1, 2.5]))

        expect(r.v_synthetic(['A', 'C'])).to.be.equal(new NumberArray([1, 2.5]))
      })

      it("should map first-level factors with offsets to average group synthetic coords", () => {
        expect(r.v_synthetic([['A', 0.1], ['C', -0.2], ['C', 0]])).to.be.equal(new NumberArray([1.1, 2.3, 2.5]))
      })

      it("should not modify inputs", () => {
        const x: L2OffsetFactor = ['A', '1', 0.1]
        r.v_synthetic([x])
        expect(x).to.be.equal(['A', '1', 0.1])
      })

      it("should map unknown factors to NaN", () => {
        expect(r.v_synthetic([['A'], ['JUNK']])).to.be.equal(new NumberArray([1, NaN]))
        expect(r.v_synthetic([['A', 0.1], ['JUNK', -0.2], ['C', 0]])).to.be.equal(new NumberArray([1.1, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1'], ['JUNK', '2'], ['C', '1']])).to.be.equal(new NumberArray([0.5, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1'], ['A', 'JUNK'], ['C', '1']])).to.be.equal(new NumberArray([0.5, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 0.1], ['JUNK', '2', -0.2], ['C', '1', 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 0.1], ['A', 'JUNK', -0.2], ['C', '1', 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5]))
      })
    })
  })

  describe("tuple list of triple factors", () => {

    describe("validation", () => {

      it("should throw an error on duplicate factors", () => {
        expect(() => new FactorRange({factors: [['a', '1', 'foo'], ['a', '1', 'foo']]})).to.throw()
      })

      /* XXX: null
      it("should throw an error on null factors", () => {
        expect(() => new FactorRange({factors: [['foo', null, null]]})).to.throw()
        expect(() => new FactorRange({factors: [[null, 'foo', null]]})).to.throw()
        expect(() => new FactorRange({factors: [[null, null, 'a']]})).to.throw()
        expect(() => new FactorRange({factors: [['a', 'foo', null]]})).to.throw()
        expect(() => new FactorRange({factors: [['foo', null, 'a']]})).to.throw()
        expect(() => new FactorRange({factors: [[null, 'foo', 'a']]})).to.throw()
        expect(() => new FactorRange({factors: [[null, null, null]]})).to.throw()
      })
      */

      it("should allow sub-factors repeated on different levels", () => {
        expect(() => new FactorRange({factors: [['a', 'foo', '1'], ['a', 'bar', '1']]})).to.not.throw()
        expect(() => new FactorRange({factors: [['a', 'foo', '1'], ['a', 'foo', '2']]})).to.not.throw()
        expect(() => new FactorRange({factors: [['a', 'foo', '1'], ['b', 'foo', '1']]})).to.not.throw()
      })
    })

    describe("levels internal property", () => {

      it("should be set to 3", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'bar'], ['C', '1', 'baz']]})
        expect(r.levels).to.be.equal(3)
      })
    })

    describe("mids internal property", () => {

      it("should be set to unique ordered list of top level factors", () => {
        const r0 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo']]})
        expect(r0.mids).to.be.equal([['A', '1'], ['A', '2']])

        const r1 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['A', '2', 'foo']]})
        expect(r1.mids).to.be.equal([['A', '1'], ['A', '2']])

        const r2 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['A', '2', 'foo'], ['C', '1', 'foo']]})
        expect(r2.mids).to.be.equal([['A', '1'], ['A', '2'], ['C', '1']])

        const r3 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '4', 'baz']]})
        expect(r3.mids).to.be.equal([['A', '1'], ['A', '2'], ['C', '1'], ['D', '4']])
      })
    })

    describe("tops internal property", () => {

      it("should be set to unique ordered list of top level factors", () => {
        const r0 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo']]})
        expect(r0.tops).to.be.equal(['A'])

        const r1 = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']]})
        expect(r1.tops).to.be.equal(['A', 'C'])
      })
    })

    describe("min/max properties", () => {
      const r = new FactorRange({factors: [['FOO', 'a', '1']], group_padding: 0, subgroup_padding: 0})

      it("should return values from synthetic range", () => {
        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = [['FOO', 'a', '1'], ['BAR', 'b', '2']]

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(2)

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']]

        expect(r.min).to.be.equal(0)
        expect(r.max).to.be.equal(3)
      })

      it("min should equal start", () => {
        expect(r.min).to.be.equal(r.start)
      })

      it("max should equal end", () => {
        expect(r.max).to.be.equal(r.end)
      })
    })

    describe("start/end properties", () => {
      const r = new FactorRange({factors: [['FOO', 'a', 'foo']], group_padding: 0, subgroup_padding: 0})

      it("should return values from synthetic range", () => {
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(1)
      })

      it("should update when factors update", () => {
        r.factors = [['FOO', 'a', '1'], ['BAR', 'b', '2']]

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(2)

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']]

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3)
      })
    })

    describe("range_padding", () => {

      it("should not pad start/end by by default", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']], group_padding: 0, subgroup_padding: 0}) // default range padding

        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4)
      })

      it("should update start/end when changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']], group_padding: 0, subgroup_padding: 0, range_padding:0.1})
        expect(r.start).to.be.equal(-0.2)
        expect(r.end).to.be.equal(4.2)

        r.range_padding = 0.2
        expect(r.start).to.be.equal(-0.4)
        expect(r.end).to.be.equal(4.4)
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo']], group_padding: 0, subgroup_padding: 0, range_padding: 0.1})
        expect(r.start).to.be.equal(-0.1)
        expect(r.end).to.be.equal(2.1)

        r.factors = ['A']
        expect(r.start).to.be.equal(-0.05)
        expect(r.end).to.be.equal(1.05)
      })

      it("should accept absolute units", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']], range_padding_units: "absolute", range_padding: 1, group_padding: 0, subgroup_padding: 0})

        expect(r.start).to.be.equal(-1)
        expect(r.end).to.be.equal(5)
      })
    })

    describe("factor_padding", () => {

      it("should pad all lowest-level factors", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']], factor_padding: 0.1, group_padding: 0, subgroup_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']], factor_padding: 0.1, group_padding: 0, subgroup_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.factor_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.7, 2.7]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']], factor_padding: 0.1, group_padding: 0, subgroup_padding: 0})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.factors = [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo'], ['D', '2', 'foo']]
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo'], ['D', '2', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6, 3.6]))
      })
    })

    describe("subgroup_padding", () => {

      it("should pad all middle-level groups", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, group_padding: 0, subgroup_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, group_padding: 0, subgroup_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.subgroup_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.7, 2.7]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, group_padding: 0, subgroup_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6]))

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']]
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']])).to.be.equal(new NumberArray([0.5, 1.6, 2.6, 3.6]))
      })
    })

    describe("group_padding", () => {

      it("should pad all top-level groups", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, subgroup_padding: 0, group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))
      })

      it("should update range when changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, subgroup_padding: 0, group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))

        r.group_padding = 0.2
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.2)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.7]))
      })

      it("should update start/end when factors changed", () => {
        const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']], factor_padding: 0, subgroup_padding: 0, group_padding: 0.1})
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(3.1)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6]))

        r.factors = [['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']]
        expect(r.start).to.be.equal(0)
        expect(r.end).to.be.equal(4.2)
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '2', 'foo'], ['C', '1', 'foo'], ['D', '2', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.6, 3.7]))
      })
    })

    describe("synthetic method", () => {
      const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']], group_padding: 0, subgroup_padding: 0})

      it("should return numeric offsets as-is", () => {
        expect(r.synthetic(10)).to.be.equal(10)
        expect(r.synthetic(10.2)).to.be.equal(10.2)
        expect(r.synthetic(-5.7)).to.be.equal(-5.7)
        expect(r.synthetic(-5)).to.be.equal(-5)
      })

      it("should map triple factors to synthetic coords", () => {
        expect(r.synthetic(['A', '1', 'foo'])).to.be.equal(0.5)
        expect(r.synthetic(['A', '1', 'bar'])).to.be.equal(1.5)
        expect(r.synthetic(['C', '1', 'foo'])).to.be.equal(2.5)
      })

      it("should map triple factors with offsets to synthetic coords", () => {
        expect(r.synthetic(['A', '1', 'foo', 0.1])).to.be.equal(0.6)
        expect(r.synthetic(['A', '1', 'bar', -0.2])).to.be.equal(1.3)
        expect(r.synthetic(['C', '1', 'foo', 0.0])).to.be.equal(2.5)
      })

      it("should map first-level factors to average group synthetic coords", () => {
        expect(r.synthetic(['A'])).to.be.equal(1)
        expect(r.synthetic(['C'])).to.be.equal(2.5)

        expect(r.synthetic('A')).to.be.equal(1)
        expect(r.synthetic('C')).to.be.equal(2.5)
      })

      it("should map first-level factors with offsets to average group synthetic coords", () => {
        expect(r.synthetic(['A', 0.1])).to.be.equal(1.1)
        expect(r.synthetic(['C', -0.2])).to.be.equal(2.3)
        expect(r.synthetic(['C', 0.0])).to.be.equal(2.5)
      })

      it("should map second-level factors to average group synthetic coords", () => {
        expect(r.synthetic(['A', '1'])).to.be.equal(1)
      })

      it("should map second-level factors with offsets to average group synthetic coords", () => {
        expect(r.synthetic(['A', '1', 0.1])).to.be.equal(1.1)
      })

      it("should not modify inputs", () => {
        const x: L3OffsetFactor = ['A', '1', 'foo', 0.1]
        r.synthetic(x)
        expect(x).to.be.equal(['A', '1', 'foo', 0.1])
      })

      it("should return NaN for unknown factors", () => {
        expect(r.synthetic(['JUNK'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1', 0.1])).to.be.NaN
        expect(r.synthetic(['A', 'JUNK', 0.1])).to.be.NaN
        expect(r.synthetic(['JUNK', '1', 'foo'])).to.be.NaN
        expect(r.synthetic(['A', 'JUNK', 'foo'])).to.be.NaN
        expect(r.synthetic(['A', '1', 'JUNK'])).to.be.NaN
        expect(r.synthetic(['JUNK', '1', 'foo', 0.1])).to.be.NaN
        expect(r.synthetic(['A', 'JUNK', 'foo', 0.1])).to.be.NaN
        expect(r.synthetic(['A', '1', 'JUNK', 0.1])).to.be.NaN
      })
    })

    describe("v_synthetic method", () => {
      const r = new FactorRange({factors: [['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']], group_padding: 0, subgroup_padding: 0})

      it("should return an Array", () => {
        const x0 = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x0).to.be.instanceof(NumberArray)

        const x1 = r.v_synthetic(["A", "C", "A"])
        expect(x1).to.be.instanceof(NumberArray)

        const x2 = r.v_synthetic([])
        expect(x2).to.be.instanceof(NumberArray)
      })

      it("should return lists of numeric offsets as-is", () => {
        const x = r.v_synthetic([10, 10.2, -5.7, -5])
        expect(x).to.be.equal(new NumberArray([10, 10.2, -5.7, -5]))
      })

      it("should map triple factors to synthetic coords", () => {
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, 1.5, 2.5]))
      })

      it("should map triple factors with offsets to synthetic coords", () => {
        expect(r.v_synthetic([['A', '1', 'foo', 0.1], ['A', '1', 'bar', -0.2], ['C', '1', 'foo', 0]])).to.be.equal(new NumberArray([0.6, 1.3, 2.5]))
      })

      it("should map first-level factors to average group synthetic coords", () => {
        expect(r.v_synthetic([['A'], ['C']])).to.be.equal(new NumberArray([1, 2.5]))

        expect(r.v_synthetic(['A', 'C'])).to.be.equal(new NumberArray([1, 2.5]))
      })

      it("should map first-level factors with offsets to average group synthetic coords", () => {
        expect(r.v_synthetic([['A', 0.1], ['C', -0.2], ['C', 0]])).to.be.equal(new NumberArray([1.1, 2.3, 2.5]))
      })

      it("should map second-level factors to average group synthetic coords", () => {
        expect(r.v_synthetic([['A', '1']])).to.be.equal(new NumberArray([1]))
      })

      it("should map second-level factors with offsets to average group synthetic coords", () => {
        expect(r.v_synthetic([['A', '1', 0.1]])).to.be.equal(new NumberArray(new NumberArray([1.1])))
      })

      it("should not modify inputs", () => {
        const x: L3OffsetFactor = ['A', '1', 'foo', 0.1]
        r.v_synthetic([x])
        expect(x).to.be.equal(['A', '1', 'foo', 0.1])
      })

      it("should map unknown factors to NaN", () => {
        expect(r.v_synthetic([['A', '1', 'foo'], ['JUNK', '1', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', 'JUNK', 'bar'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 'foo'], ['A', '1', 'JUNK'], ['C', '1', 'foo']])).to.be.equal(new NumberArray([0.5, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 'foo', 0.1], ['JUNK', '1', 'bar', -0.2], ['C', '1', 'foo', 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 'foo', 0.1], ['A', 'JUNK', 'bar', -0.2], ['C', '1', 'foo', 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5]))
        expect(r.v_synthetic([['A', '1', 'foo', 0.1], ['A', '1', 'JUNK', -0.2], ['C', '1', 'foo', 0]])).to.be.equal(new NumberArray([0.6, NaN, 2.5]))
        expect(r.v_synthetic([['A'], ['JUNK']])).to.be.equal(new NumberArray([1, NaN]))
        expect(r.v_synthetic(['A', 'JUNK'])).to.be.equal(new NumberArray([1, NaN]))
        expect(r.v_synthetic([['A', 0.1], ['JUNK', -0.2], ['C', 0]])).to.be.equal(new NumberArray([1.1, NaN, 2.5]))
        expect(r.v_synthetic([['JUNK', '1']])).to.be.equal(new NumberArray([NaN]))
        expect(r.v_synthetic([['A', 'JUNK']])).to.be.equal(new NumberArray([NaN]))
        expect(r.v_synthetic([['JUNK', '1', 0.1]])).to.be.equal(new NumberArray([NaN]))
        expect(r.v_synthetic([['A', 'JUNK', 0.1]])).to.be.equal(new NumberArray([NaN]))
      })
    })
  })
})
