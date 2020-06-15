import {expect} from "assertions"

import {CategoricalPatternMapper} from "@bokehjs/models/mappers/categorical_pattern_mapper"
import {L1Factor as F1, L2Factor as F2, L3Factor as F3} from "@bokehjs/models/ranges/factor_range"
import {HatchPatternType} from "@bokehjs/core/enums"

type Patterns = HatchPatternType[]

describe("CategoricalPatternMapper module", () => {

  describe("CategoricalPatternMapper.v_compute method", () => {

    describe("with 1-level data factors", () => {

      it("should map factors to patterns with default start/end", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line"]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.equal(["vertical_line", "dot", "+", "dot"])
      })

      it("should map data unknown data to default_value value", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line"]
        const cm = new CategoricalPatternMapper({
          patterns,
          default_value: " ",
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["d", "a", "b"])
        expect(vals).to.be.equal([" ", "+", "dot"])
      })

      it("should map data with short patterns to default_value value", () => {
        const patterns: Patterns = ["+", "dot"]
        const cm = new CategoricalPatternMapper({
          patterns,
          default_value: " ",
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["a", "b", "c"])
        expect(vals).to.be.equal(["+", "dot", " "])
      })

      it("should disregard any start or end values", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line"]
        const factors: F1[] = ["a", "b", "c"]

        const cm0 = new CategoricalPatternMapper({patterns, factors, start: 1})
        const vals0 = cm0.v_compute(["c", "b", "a", "b"])
        expect(vals0).to.be.equal(["vertical_line", "dot", "+", "dot"])

        const cm1 = new CategoricalPatternMapper({patterns, factors, end: 2})
        const vals1 = cm1.v_compute(["c", "b", "a", "b"])
        expect(vals1).to.be.equal(["vertical_line", "dot", "+", "dot"])

        const cm2 = new CategoricalPatternMapper({patterns, factors, start: 1, end: 2})
        const vals2 = cm2.v_compute(["c", "b", "a", "b"])
        expect(vals2).to.be.equal(["vertical_line", "dot", "+", "dot"])
      })
    })
  })

  describe("with 2-level data factors", () => {

    describe("and 1-level patterns factors", () => {

      it("should map factors to patterns with start=0, end=1", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=1, end=2", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      for (const [i, j] of [[0, 2]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
          const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

          const cm0 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(0, 1)[0]),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute([["a", "1"]])
          expect(vals0).to.be.equal([" "])

          const cm1 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(1, 2)[0]),
            start: i,
            end: j,
          })

          const vals1 = cm1.v_compute([["a", "1"]])
          expect(vals1).to.be.equal([" "])
        })
      }
    })

    describe("and 2-level patterns factors", () => {

      it("should map factors to patterns with default start/end", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalPatternMapper({patterns, factors})

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=0, end=2", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalPatternMapper({patterns, factors, start: 0, end: 2})

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      for (const [i, j] of [[0, 1], [1, 2]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
          const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
          const cm = new CategoricalPatternMapper({patterns, factors, start: i, end: j})

          const vals = cm.v_compute([["a", "1"]])
          expect(vals).to.be.equal([" "])
        })
      }
    })
  })

  describe("with 3-level data factors", () => {

    describe("and 1-level patterns factors", () => {

      it("should map factors to patterns with start=0, end=1", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["d", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=1, end=2", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "3", "baz"], ["c", "4", "bar"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=2, end=3", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "quux"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(2, 3)[0]),
          start: 2,
          end: 3,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      for (const [i, j] of [[0, 2], [0, 3], [1, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(0, 1)[0]),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals0).to.be.equal([" "])

          const vals1 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals1).to.be.equal([" "])

          const cm1 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(1, 2)[0]),
            start: i,
            end: j,
          })

          const vals2 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal([" "])

          const vals3 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal([" "])

          const cm2 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(2, 3)[0]),
            start: i,
            end: j,
          })

          const vals4 = cm2.v_compute([["a", "1", "foo"]])
          expect(vals4).to.be.equal([" "])

          const vals5 = cm2.v_compute([["a", "1", "baz"]])
          expect(vals5).to.be.equal([" "])
        })
      }
    })

    describe("and 2-level patterns factors", () => {

      it("should map factors to patterns with start=0, end=2", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(0, 2) as F2),
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=1, end=3", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({
          patterns,
          factors: factors.map((x) => x.slice(1, 3) as F2),
          start: 1,
          end: 3,
        })

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      for (const [i, j] of [[0, 1], [0, 3], [1, 2], [2, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(0, 2) as F2),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute(["a"])
          expect(vals0).to.be.equal([" "])

          const vals1 = cm0.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(i == 0 && j == 3 ? ["+"] : [" "])

          const vals2 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal([" "])

          const vals3 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal([" "])

          const cm1 = new CategoricalPatternMapper({
            patterns,
            factors: factors.map((x) => x.slice(1, 3) as F2),
            start: i,
            end: j,
          })

          const vals4 = cm1.v_compute(["a"])
          expect(vals4).to.be.equal([" "])

          const vals5 = cm1.v_compute([["a", "1"]])
          expect(vals5).to.be.equal([" "])

          const vals6 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals6).to.be.equal([" "])

          const vals7 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals7).to.be.equal([" "])
        })
      }
    })

    describe("and 3-level patterns factors", () => {

      it("should map factors to patterns with default start/end", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({patterns, factors})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      it("should map factors to patterns with start=0, end=3", () => {
        const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalPatternMapper({patterns, factors, start: 0, end: 3})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(patterns)
      })

      for (const [i, j] of [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const patterns: Patterns = ["+", "dot", "vertical_line", "*"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
          const cm = new CategoricalPatternMapper({patterns, factors, start: i, end: j})

          const vals0 = cm.v_compute(["a"])
          expect(vals0).to.be.equal([" "])

          const vals1 = cm.v_compute([["a", "1"]])
          expect(vals1).to.be.equal([" "])

          const vals2 = cm.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal([" "])

          const vals3 = cm.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal([" "])
        })
      }
    })
  })
})
