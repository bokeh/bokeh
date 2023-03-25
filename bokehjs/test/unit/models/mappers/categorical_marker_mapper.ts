import {expect} from "assertions"

import {CategoricalMarkerMapper} from "@bokehjs/models/mappers/categorical_marker_mapper"
import {L1Factor as F1, L2Factor as F2, L3Factor as F3} from "@bokehjs/models/ranges/factor_range"
import {MarkerType} from "@bokehjs/core/enums"

type Markers = MarkerType[]

describe("CategoricalMarkerMapper module", () => {

  describe("CategoricalMarkerMapper.v_compute method", () => {

    describe("with 1-level data factors", () => {

      it("should map factors to markers with default start/end", () => {
        const markers: Markers = ["hex", "circle", "dash"]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["c", "b", "a", "b"])
        expect(vals).to.be.equal(["dash", "circle", "hex", "circle"])
      })

      it("should map data unknown data to default_value value", () => {
        const markers: Markers = ["hex", "circle", "dash"]
        const cm = new CategoricalMarkerMapper({
          markers,
          default_value: "circle",
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["d", "a", "b"])
        expect(vals).to.be.equal(["circle", "hex", "circle"])
      })

      it("should map data with short markers to default_value value", () => {
        const markers: Markers = ["hex", "circle"]
        const cm = new CategoricalMarkerMapper({
          markers,
          default_value: "circle",
          factors: ["a", "b", "c"],
        })
        const vals = cm.v_compute(["a", "b", "c"])
        expect(vals).to.be.equal(["hex", "circle", "circle"])
      })

      it("should disregard any start or end values", () => {
        const markers: Markers = ["hex", "circle", "dash"]
        const factors: F1[] = ["a", "b", "c"]

        const cm0 = new CategoricalMarkerMapper({markers, factors, start: 1})
        const vals0 = cm0.v_compute(["c", "b", "a", "b"])
        expect(vals0).to.be.equal(["dash", "circle", "hex", "circle"])

        const cm1 = new CategoricalMarkerMapper({markers, factors, end: 2})
        const vals1 = cm1.v_compute(["c", "b", "a", "b"])
        expect(vals1).to.be.equal(["dash", "circle", "hex", "circle"])

        const cm2 = new CategoricalMarkerMapper({markers, factors, start: 1, end: 2})
        const vals2 = cm2.v_compute(["c", "b", "a", "b"])
        expect(vals2).to.be.equal(["dash", "circle", "hex", "circle"])
      })
    })
  })

  describe("with 2-level data factors", () => {

    describe("and 1-level markers factors", () => {

      it("should map factors to markers with start=0, end=1", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=1, end=2", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      for (const [i, j] of [[0, 2]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const markers: Markers = ["hex", "circle", "dash", "square"]
          const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]

          const cm0 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(0, 1)[0]),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute([["a", "1"]])
          expect(vals0).to.be.equal(["circle"])

          const cm1 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(1, 2)[0]),
            start: i,
            end: j,
          })

          const vals1 = cm1.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(["circle"])
        })
      }
    })

    describe("and 2-level markers factors", () => {

      it("should map factors to markers with default start/end", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalMarkerMapper({markers, factors})

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=0, end=2", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
        const cm = new CategoricalMarkerMapper({markers, factors, start: 0, end: 2})

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      for (const [i, j] of [[0, 1], [1, 2]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const markers: Markers = ["hex", "circle", "dash", "square"]
          const factors: F2[] = [["a", "1"], ["d", "2"], ["b", "3"], ["c", "4"]]
          const cm = new CategoricalMarkerMapper({markers, factors, start: i, end: j})

          const vals = cm.v_compute([["a", "1"]])
          expect(vals).to.be.equal(["circle"])
        })
      }
    })
  })

  describe("with 3-level data factors", () => {

    describe("and 1-level markers factors", () => {

      it("should map factors to markers with start=0, end=1", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["d", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(0, 1)[0]),
          end: 1,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=1, end=2", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "3", "baz"], ["c", "4", "bar"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(1, 2)[0]),
          start: 1,
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=2, end=3", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "quux"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(2, 3)[0]),
          start: 2,
          end: 3,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      for (const [i, j] of [[0, 2], [0, 3], [1, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const markers: Markers = ["hex", "circle", "dash", "square"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(0, 1)[0]),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals0).to.be.equal(["circle"])

          const vals1 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals1).to.be.equal(["circle"])

          const cm1 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(1, 2)[0]),
            start: i,
            end: j,
          })

          const vals2 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["circle"])

          const vals3 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["circle"])

          const cm2 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(2, 3)[0]),
            start: i,
            end: j,
          })

          const vals4 = cm2.v_compute([["a", "1", "foo"]])
          expect(vals4).to.be.equal(["circle"])

          const vals5 = cm2.v_compute([["a", "1", "baz"]])
          expect(vals5).to.be.equal(["circle"])
        })
      }
    })

    describe("and 2-level markers factors", () => {

      it("should map factors to markers with start=0, end=2", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(0, 2) as F2),
          end: 2,
        })
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=1, end=3", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({
          markers,
          factors: factors.map((x) => x.slice(1, 3) as F2),
          start: 1,
          end: 3,
        })

        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      for (const [i, j] of [[0, 1], [0, 3], [1, 2], [2, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const markers: Markers = ["hex", "circle", "dash", "square"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "baz"], ["c", "1", "bar"]]

          const cm0 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(0, 2) as F2),
            start: i,
            end: j,
          })

          const vals0 = cm0.v_compute(["a"])
          expect(vals0).to.be.equal(["circle"])

          const vals1 = cm0.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(i == 0 && j == 3 ? ["hex"] : ["circle"])

          const vals2 = cm0.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["circle"])

          const vals3 = cm0.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["circle"])

          const cm1 = new CategoricalMarkerMapper({
            markers,
            factors: factors.map((x) => x.slice(1, 3) as F2),
            start: i,
            end: j,
          })

          const vals4 = cm1.v_compute(["a"])
          expect(vals4).to.be.equal(["circle"])

          const vals5 = cm1.v_compute([["a", "1"]])
          expect(vals5).to.be.equal(["circle"])

          const vals6 = cm1.v_compute([["a", "1", "foo"]])
          expect(vals6).to.be.equal(["circle"])

          const vals7 = cm1.v_compute([["a", "1", "baz"]])
          expect(vals7).to.be.equal(["circle"])
        })
      }
    })

    describe("and 3-level markers factors", () => {

      it("should map factors to markers with default start/end", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({markers, factors})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      it("should map factors to markers with start=0, end=3", () => {
        const markers: Markers = ["hex", "circle", "dash", "square"]
        const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
        const cm = new CategoricalMarkerMapper({markers, factors, start: 0, end: 3})
        const vals = cm.v_compute(factors)
        expect(vals).to.be.equal(markers)
      })

      for (const [i, j] of [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]]) {
        it(`should map everything to default_value with start=${i}, end=${j}`, () => {
          const markers: Markers = ["hex", "circle", "dash", "square"]
          const factors: F3[] = [["a", "1", "foo"], ["a", "2", "foo"], ["b", "2", "foo"], ["c", "1", "bar"]]
          const cm = new CategoricalMarkerMapper({markers, factors, start: i, end: j})

          const vals0 = cm.v_compute(["a"])
          expect(vals0).to.be.equal(["circle"])

          const vals1 = cm.v_compute([["a", "1"]])
          expect(vals1).to.be.equal(["circle"])

          const vals2 = cm.v_compute([["a", "1", "foo"]])
          expect(vals2).to.be.equal(["circle"])

          const vals3 = cm.v_compute([["a", "1", "baz"]])
          expect(vals3).to.be.equal(["circle"])
        })
      }
    })
  })
})
