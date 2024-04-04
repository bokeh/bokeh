import {display} from "../_util"

import {ScaleBar, Plot, Range1d, Metric} from "@bokehjs/models"
import type {Location, Align} from "@bokehjs/core/enums"

describe("ScaleBar annotation", () => {
  describe("should support horizontal orientation", () => {
    const orientation = "horizontal"

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

    async function scale_bar_with_label_location(label_location: Location, label_align?: Align, label_standoff?: number) {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location,
        label_align,
        label_standoff,
      })
      await display(plot(scale_bar))
    }

    describe("with label above", () => {
      const label_location = "above"
      it("with label align start", async () => await scale_bar_with_label_location(label_location, "start"))
      it("with label align center", async () => await scale_bar_with_label_location(label_location, "center"))
      it("with label align end", async () => await scale_bar_with_label_location(label_location, "end"))
    })

    describe("with label below", () => {
      const label_location = "below"
      it("with label align start", async () => await scale_bar_with_label_location(label_location, "start"))
      it("with label align center", async () => await scale_bar_with_label_location(label_location, "center"))
      it("with label align end", async () => await scale_bar_with_label_location(label_location, "end"))
    })

    it("with label left", async () => await scale_bar_with_label_location("left"))
    it("with label right", async () => await scale_bar_with_label_location("right"))

    const standoff = 20
    it(`with label above and ${standoff}px standoff`, async () => await scale_bar_with_label_location("above", "center", standoff))
    it(`with label below and ${standoff}px standoff`, async () => await scale_bar_with_label_location("below", "center", standoff))
    it(`with label left and ${standoff}px standoff`, async () => await scale_bar_with_label_location("left", "center", standoff))
    it(`with label right and ${standoff}px standoff`, async () => await scale_bar_with_label_location("right", "center", standoff))

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
    const orientation = "vertical"

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

    async function scale_bar_with_label_location(label_location: Location, label_align?: Align, label_standoff?: number) {
      const scale_bar = new ScaleBar({
        range: new Range1d({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location,
        label_align,
        label_standoff,
      })
      await display(plot(scale_bar))
    }

    it("with label above", async () => await scale_bar_with_label_location("above"))
    it("with label below", async () => await scale_bar_with_label_location("below"))

    describe("with label left", () => {
      const label_location = "left"
      it("with label align start", async () => await scale_bar_with_label_location(label_location, "start"))
      it("with label align center", async () => await scale_bar_with_label_location(label_location, "center"))
      it("with label align end", async () => await scale_bar_with_label_location(label_location, "end"))
    })

    describe("with label right", () => {
      const label_location = "right"
      it("with label align start", async () => await scale_bar_with_label_location(label_location, "start"))
      it("with label align center", async () => await scale_bar_with_label_location(label_location, "center"))
      it("with label align end", async () => await scale_bar_with_label_location(label_location, "end"))
    })

    const standoff = 20
    it(`with label above and ${standoff}px standoff`, async () => await scale_bar_with_label_location("above", "center", standoff))
    it(`with label below and ${standoff}px standoff`, async () => await scale_bar_with_label_location("below", "center", standoff))
    it(`with label left and ${standoff}px standoff`, async () => await scale_bar_with_label_location("left", "center", standoff))
    it(`with label right and ${standoff}px standoff`, async () => await scale_bar_with_label_location("right", "center", standoff))

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

  it("should support custom units of measurement", async () => {
    const scale_bar = new ScaleBar({
      range: new Range1d({start: 0, end: 1}),
      unit: "MeV",
      dimensional: new Metric({base_unit: "eV"}),
      bar_length: 0.2,
      orientation: "horizontal",
      location: "center",
    })

    const plot = new Plot({
      width: 100,
      height: 100,
      min_border: 0,
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
      center: [scale_bar],
      toolbar_location: null,
    })

    await display(plot)
  })
})
