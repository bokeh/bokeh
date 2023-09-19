import {display} from "../_util"

import {ScaleBar, Plot, Range1d} from "@bokehjs/models"
import type {Location} from "@bokehjs/core/enums"

describe("ScaleBar annotation", () => {
  describe("should support horizontal orientation", () => {
    const orientation = "horizontal" as const

    function plot(scale_bar: ScaleBar) {
      return new Plot({
        width: 300,
        height: 150,
        min_border: 0,
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new Range1d({start: 0, end: 1}),
        center: [scale_bar],
      })
    }

    async function scale_bar_with_label_location(label_location: Location, label_standoff?: number) {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location,
        label_standoff,
      })
      await display(plot(scale_bar))
    }

    it("with label above", async () => await scale_bar_with_label_location("above"))
    it("with label below", async () => await scale_bar_with_label_location("below"))
    it("with label left", async () => await scale_bar_with_label_location("left"))
    it("with label right", async () => await scale_bar_with_label_location("right"))

    const standoff = 20
    it(`with label above and ${standoff}px standoff`, async () => await scale_bar_with_label_location("above", standoff))
    it(`with label below and ${standoff}px standoff`, async () => await scale_bar_with_label_location("below", standoff))
    it(`with label left and ${standoff}px standoff`, async () => await scale_bar_with_label_location("left", standoff))
    it(`with label right and ${standoff}px standoff`, async () => await scale_bar_with_label_location("right", standoff))

    it("with 0px padding", async () => {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location: "above",
        padding: 0,
      })
      await display(plot(scale_bar))
    })

    it("with 20px padding", async () => {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location: "above",
        padding: 20,
      })
      await display(plot(scale_bar))
    })

    it("with 0px padding and no border", async () => {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location: "above",
        padding: 0,
        border_line_color: null,
      })
      await display(plot(scale_bar))
    })

    for (const length_sizing of ["adaptive", "exact"] as const) {
      describe(`with ${length_sizing} sizing`, () => {
        it("and with 50% percentage length", async () => {
          const scale_bar = new ScaleBar({
            range: new Range1d({start: 0, end: 1}),
            bar_length: 0.5,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })

        it("and with 200px pixel length", async () => {
          const scale_bar = new ScaleBar({
            range: new Range1d({start: 0, end: 1}),
            bar_length: 200,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })
      })
    }
  })

  describe("should support vertical orientation", () => {
    const orientation = "vertical" as const

    function plot(scale_bar: ScaleBar) {
      return new Plot({
        width: 150,
        height: 300,
        min_border: 0,
        x_range: new Range1d({start: 0, end: 1}),
        y_range: new Range1d({start: 0, end: 1}),
        center: [scale_bar],
      })
    }

    async function scale_bar_with_label_location(label_location: Location) {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location,
      })
      await display(plot(scale_bar))
    }

    it("with label above", async () => await scale_bar_with_label_location("above"))
    it("with label below", async () => await scale_bar_with_label_location("below"))
    it("with label left", async () => await scale_bar_with_label_location("left"))
    it("with label right", async () => await scale_bar_with_label_location("right"))

    for (const length_sizing of ["adaptive", "exact"] as const) {
      describe(`with ${length_sizing} sizing`, () => {
        it("and with 50% percentage length", async () => {
          const scale_bar = new ScaleBar({
            range: new Range1d({start: 0, end: 1}),
            bar_length: 0.5,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })

        it("and with 200px pixel length", async () => {
          const scale_bar = new ScaleBar({
            range: new Range1d({start: 0, end: 1}),
            bar_length: 200,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })
      })
    }
  })
})
