import {expect} from "assertions"

import {CategoricalColorMapper} from "@bokehjs/models/mappers/categorical_color_mapper"
import {L2Factor as F2, L3Factor as F3} from "@bokehjs/models/ranges/factor_range"

describe("CategoricalColorMapper module", () => {

  describe("CategoricalColorMapper.v_compute method", () => {

    describe("with 1-level data factors", () => {

      it("should map factors to palette with default start/end", () => {
        const palette = ["red", "green", "blue"]
        const cm = new CategoricalColorMapper({palette, factors: ["a", "b", "c"]})
        const vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.equal(["blue", "green", "red", "green"])
      })

      it("should map data unknown data to nan_color value", () => {
        const palette = ["red", "green", "blue"]
        const cm = new CategoricalColorMapper({palette, nan_color: "gray", factors: ["a", "b", "c"]})
        const vals = cm.v_compute(["d", "a", "b"])
        expect(vals).to.be.equal(["gray", "red", "green"])
      })

      it("should map data with short palette to nan_color value", () => {
        const palette = ["red", "green"]
        const cm = new CategoricalColorMapper({palette, nan_color: "gray", factors: ["a", "b", "c"]})
        const vals = cm.v_compute(["a", "b", "c"])
        expect(vals).to.be.equal(["red", "green", "gray"])
      })

      it("should disregard any start or end values", () => {
        const palette = ["red", "green", "blue"]

        const cm0 = new CategoricalColorMapper({palette, factors: ["a", "b", "c"], start: 1})
        const vals0 = cm0.v_compute(["c", "b", "a", "b"])
        expect(vals0).to.be.equal(["blue", "green", "red", "green"])

        const cm1 = new CategoricalColorMapper({palette, factors: ["a", "b", "c"], end: 2})
        const vals1 = cm1.v_compute(["c", "b", "a", "b"])
        expect(vals1).to.be.equal(["blue", "green", "red", "green"])

        const cm2 = new CategoricalColorMapper({palette, factors: ["a", "b", "c"], start: 1, end: 2})
        const vals2 = cm2.v_compute(["c", "b", "a", "b"])
        expect(vals2).to.be.equal(["blue", "green", "red", "green"])
      })
    })
  })

  describe("with 2-level data factors", () => {

    describe("and 1-level palette factors", () => {

      it("should map factors to palette with start=0, end=1", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=1, end=2", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map everything to nan_color with start=0, end=2", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

        const cm0 = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          start: 0,
          end: 2,
        })

        const vals0 = cm0.v_compute([["a", "1"]])
        expect(vals0).to.be.equal(["gray"])

        const cm1 = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 0,
          end: 2,
        })

        const vals1 = cm1.v_compute([["a", "1"]])
        expect(vals1).to.be.equal(["gray"])
      })
    })

    describe("and 2-level palette factors", () => {

      it("should map factors to palette with default start/end", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalColorMapper({palette, factors})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=0, end=2", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalColorMapper({palette, factors, start: 0, end: 2})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      for (const [i, j] of [[0, 1], [1, 2]]) {
        it(`should map everything to nan_color with start=${i}, end=${j}`, () => {
          const palette = ["red", "green", "blue", "orange"]
          const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

          const cm = new CategoricalColorMapper({palette, factors, start: i, end: j})

          const vals = cm.v_compute([["a", "1"]])
          expect(vals).to.be.equal(["gray"])
        })
      }
    })
  })

  describe("with 3-level data factors", () => {

    describe("and 1-level palette factors", () => {

      it("should map factors to palette with start=0, end=1", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["d", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=1, end=2", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "3", "baz"], ["c", "4", "bar"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=2, end=3", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "quux"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(2, 3)[0]),
          start: 2,
          end: 3,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      for (const [i, j] of [[0, 2], [0, 3], [1, 3]]) {
        it(`should map everything to nan_color with start=${i}, end=${j}`, () => {
          const palette = ["red", "green", "blue", "orange"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalColorMapper({
            palette,
            factors: factors.map((x) => x.slice(0, 1)[0]),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals0).to.be.equal(["gray"])

          const vals1 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals1).to.be.equal(["gray"])

          const cm1 = new CategoricalColorMapper({
            palette,
            factors: factors.map((x) => x.slice(1, 2)[0]),
            start: i,
            end: j,
          })

          const vals2 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["gray"])

          const vals3 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["gray"])

          const cm2 = new CategoricalColorMapper({
            palette,
            factors: factors.map((x) => x.slice(2, 3)[0]),
            start: i,
            end: j,
          })

          const vals4 = cm2.v_compute([["a", "1", "foo"]])
          expect(vals4).to.be.equal(["gray"])

          const vals5 = cm2.v_compute([["a", "1", "baz"]])
          expect(vals5).to.be.equal(["gray"])
        })
      }
    })

    describe("and 2-level palette factors", () => {

      it("should map factors to palette with start=0, end=2", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(0, 2) as F2),
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=1, end=3", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({
          palette,
          factors: factors.map((x) => x.slice(1, 3) as F2),
          start: 1,
          end: 3,
        })

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      for (const [i, j] of [[0, 1], [0, 3], [1, 2], [2, 3]]) {
        it(`should map everything to nan_color with start=${i}, end=${j}`, () => {
          const palette = ["red", "green", "blue", "orange"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalColorMapper({
            palette,
            factors: factors.map((x) => x.slice(0, 2) as F2),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute(["a"])
          expect(vals0).to.be.equal(["gray"])

          const vals1 = cm0.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(i == 0 && j == 3 ? ["red"] : ["gray"])

          const vals2 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["gray"])

          const vals3 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["gray"])

          const cm1 = new CategoricalColorMapper({
            palette,
            factors: factors.map((x) => x.slice(1, 3) as F2),
            start: i,
            end: j,
          })

          const vals4 = cm1.v_compute(["a"])
          expect(vals4).to.be.equal(["gray"])

          const vals5 = cm1.v_compute([["a", "1"]])
          expect(vals5).to.be.equal(["gray"])

          const vals6 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals6).to.be.equal(["gray"])

          const vals7 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals7).to.be.equal(["gray"])
        })
      }
    })

    describe("and 3-level palette factors", () => {

      it("should map factors to palette with default start/end", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({palette, factors})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      it("should map factors to palette with start=0, end=3", () => {
        const palette = ["red", "green", "blue", "orange"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalColorMapper({palette, factors, start: 0, end: 3})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(palette)
      })

      for (const [i, j] of [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]]) {
        it(`should map everything to nan_color with start=${i}, end=${j}`, () => {
          const palette = ["red", "green", "blue", "orange"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
          const cm = new CategoricalColorMapper({palette, factors, start: i, end: j})

          const vals0 = cm.v_compute(["a"])
          expect(vals0).to.be.equal(["gray"])

          const vals1 = cm.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(["gray"])

          const vals2 = cm.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["gray"])

          const vals3 = cm.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["gray"])
        })
      }
    })
  })
})
