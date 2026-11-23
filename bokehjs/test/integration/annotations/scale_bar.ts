import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {ScaleBar, Plot, Range1d, FactorRange, Metric, LinearScale, CategoricalScale} from "@bokehjs/models"
import type {Location, Align} from "@bokehjs/core/enums"
import {bounding_box} from "@bokehjs/core/dom"
import {delay} from "@bokehjs/core/util/defer"

describe("ScaleBar annotation", () => {
  describe("should support horizontal orientation", () => {
    const orientation = "horizontal"

    function plot(scale_bar: ScaleBar) {
      return Plot.create({
        width: 300,
        height: 150,
        min_border: 0,
        x_range: Range1d.create({start: 0, end: 1}),
        y_range: Range1d.create({start: 0, end: 1}),
        center: [scale_bar],
        toolbar_location: null,
      })
    }

    async function scale_bar_with_label_location(label_location: Location, label_align?: Align, label_standoff?: number) {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
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

    it("after changing orientation from vertical", async () => {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
        bar_length: 0.2,
        orientation: "vertical",
        location: "top_right",
        label_location: "below",
      })
      const {view} = await display(plot(scale_bar))
      scale_bar.orientation = orientation
      await view.ready
    })

    it("with 0px padding", async () => {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location: "above",
        padding: 0,
      })
      await display(plot(scale_bar))
    })

    it("with 20px padding", async () => {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
        bar_length: 0.2,
        orientation,
        location: "top_right",
        label_location: "above",
        padding: 20,
      })
      await display(plot(scale_bar))
    })

    it("with 0px padding and no border", async () => {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
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
          const scale_bar = ScaleBar.create({
            range: Range1d.create({start: 0, end: 1}),
            bar_length: 0.5,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })

        it("and with 200px pixel length", async () => {
          const scale_bar = ScaleBar.create({
            range: Range1d.create({start: 0, end: 1}),
            bar_length: 200,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })
      })
    }

    describe("with bar_length_units", () => {
      const location = "top_center"
      const length_sizing = "exact"

      it("screen and bar_length 0..1 range", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.5,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("screen and an integer bar_length", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 200,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("data", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.3,
          bar_length_units: "data",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("percent", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.5,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })
    })
  })

  describe("should support vertical orientation", () => {
    const orientation = "vertical"

    function plot(scale_bar: ScaleBar) {
      return Plot.create({
        width: 150,
        height: 300,
        min_border: 0,
        x_range: Range1d.create({start: 0, end: 1}),
        y_range: Range1d.create({start: 0, end: 1}),
        center: [scale_bar],
        toolbar_location: null,
      })
    }

    async function scale_bar_with_label_location(label_location: Location, label_align?: Align, label_standoff?: number) {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
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

    it("after changing orientation from horizontal", async () => {
      const scale_bar = ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
        bar_length: 0.2,
        orientation: "horizontal",
        location: "top_right",
        label_location: "below",
      })
      const {view} = await display(plot(scale_bar))
      scale_bar.orientation = orientation
      await view.ready
    })

    for (const length_sizing of ["adaptive", "exact"] as const) {
      describe(`with ${length_sizing} sizing`, () => {
        it("and with 50% percentage length", async () => {
          const scale_bar = ScaleBar.create({
            range: Range1d.create({start: 0, end: 1}),
            bar_length: 0.5,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })

        it("and with 200px pixel length", async () => {
          const scale_bar = ScaleBar.create({
            range: Range1d.create({start: 0, end: 1}),
            bar_length: 200,
            length_sizing,
            orientation,
            location: "top_right",
          })
          await display(plot(scale_bar))
        })
      })
    }

    describe("with bar_length_units", () => {
      const location = "top_center"
      const length_sizing = "exact"

      it("screen and bar_length 0..1 range", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.5,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("screen and an integer bar_length", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 200,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("data", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.3,
          bar_length_units: "data",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })

      it("percent", async () => {
        const scale_bar = ScaleBar.create({
          range: Range1d.create({start: 0, end: 1}),
          bar_length: 0.5,
          bar_length_units: "screen",
          length_sizing,
          orientation,
          location,
        })
        await display(plot(scale_bar))
      })
    })
  })

  it("should support custom units of measurement", async () => {
    const scale_bar = ScaleBar.create({
      range: Range1d.create({start: 0, end: 1}),
      unit: "MeV",
      dimensional: Metric.create({base_unit: "eV"}),
      bar_length: 0.2,
      orientation: "horizontal",
      location: "center",
    })

    const plot = Plot.create({
      width: 100,
      height: 100,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
      center: [scale_bar],
      toolbar_location: null,
    })

    await display(plot)
  })

  describe("should support positioning", () => {
    function plot(scale_bar: ScaleBar, attrs: Partial<Plot.Attrs> = {}) {
      return Plot.create({
        width: 300,
        height: 300,
        min_border: 0,
        x_range: Range1d.create({start: 0, end: 1}),
        y_range: FactorRange.create({factors: ["a", "b", "c", "d"]}),
        x_scale: LinearScale.create(),
        y_scale: CategoricalScale.create(),
        center: [scale_bar],
        toolbar_location: null,
        ...attrs,
      })
    }
    function scale_bar(attrs: Partial<ScaleBar.Attrs>) {
      return ScaleBar.create({
        range: Range1d.create({start: 0, end: 1}),
        bar_length: 0.2,
        bar_length_units: "percent",
        length_sizing: "exact",
        orientation: "horizontal",
        ...attrs,
      })
    }

    describe("with tuple location", () => {
      it("using alignment", async () => {
        const bar = scale_bar({
          location: ["left", "top"],
        })
        await display(plot(bar))
      })
      it("with 'data' units", async () => {
        const bar = scale_bar({
          location: [0.3, "c"],
          x_units: "data",
          y_units: "data",
          anchor: "center",
        })
        await display(plot(bar))
      })

      it("with 'percent' units", async () => {
        const bar = scale_bar({
          location: [0.3, 0.7],
          x_units: "percent",
          y_units: "percent",
          anchor: "center",
        })
        await display(plot(bar))
      })

      it("with 'screen' units", async () => {
        const bar = scale_bar({
          location: [100, 200],
          x_units: "screen",
          y_units: "screen",
          anchor: "center",
        })
        await display(plot(bar))
      })

      it("with 'view' units", async () => {
        const bar = scale_bar({
          location: [100, 200],
          x_units: "view",
          y_units: "view",
          anchor: "center",
        })
        await display(plot(bar))
      })
    })
  })

  it("should reserve enough room in a side panel", async () => {
    const plot = Plot.create({
      width: 300,
      height: 120,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
      toolbar_location: null,
    })
    const scale_bar = ScaleBar.create({
      range: Range1d.create({start: 0, end: 10}),
      unit: "m",
      dimensional: Metric.create({base_unit: "m"}),
      orientation: "vertical",
    })
    plot.add_layout(scale_bar, "right")

    const {view} = await display(plot)
    await view.ready
    await delay(100)
    const panel_bbox = bounding_box(view.right_panel.el)
    const scale_bar_bbox = bounding_box(view.owner.get_one(scale_bar).el)

    expect(scale_bar_bbox.right).to.be.below(panel_bbox.right + 0.01)
  })

  it("should settle when its length affects a side-panel size", async () => {
    const plot = Plot.create({
      width: 300,
      height: 120,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
      toolbar_location: null,
    })
    const scale_bar = ScaleBar.create({
      range: Range1d.create({start: 0, end: 10}),
      unit: "m",
      dimensional: Metric.create({base_unit: "m"}),
      bar_length: 0.5,
      orientation: "horizontal",
    })
    plot.add_layout(scale_bar, "right")

    const {view} = await display(plot)
    const expect_stable_layout = async () => {
      await view.ready
      // Cross-axis reservation may require several layout passes.
      await delay(400)
      const render_count = (view as any)._render_count
      const frame_width = view.frame.bbox.width
      await delay(150)
      expect((view as any)._render_count).to.be.equal(render_count)
      expect(view.frame.bbox.width).to.be.equal(frame_width)
      expect(frame_width).to.be.above(100)
      expect(view.owner.get_one(scale_bar).bbox.right).to.be.below(view.bbox.right + 0.01)
    }

    await expect_stable_layout()

    plot.width = 301
    scale_bar.bar_length = 0.2
    await expect_stable_layout()
  })

  it.no_image("should settle a cross-axis side panel with an explicit frame size", async () => {
    const scale_bar = ScaleBar.create({
      range: "auto",
      unit: "m",
      dimensional: Metric.create({base_unit: "m"}),
      bar_length: 0.5,
      orientation: "horizontal",
    })
    const plot = Plot.create({
      frame_width: 300,
      height: 120,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 1}),
      toolbar_location: null,
      right: [scale_bar],
    })

    const {view} = await display(plot, [700, 170])
    await view.ready
    await delay(400)
    const width = view.bbox.width
    const render_count = (view as any)._render_count
    await delay(300)
    expect(view.bbox.width).to.be.equal(width)
    expect(view.frame.bbox.width).to.be.equal(300)
    expect((view as any)._render_count).to.be.equal(render_count)
    expect(view.owner.get_one(scale_bar).bbox.right).to.be.below(view.bbox.right + 0.01)
  })

  it.no_image("should settle and keep a cross-axis side panel calibrated to the frame", async () => {
    const scale_bar = ScaleBar.create({
      range: "auto",
      unit: "m",
      dimensional: Metric.create({base_unit: "m"}),
      bar_length: 5,
      bar_length_units: "data",
      orientation: "horizontal",
      length_sizing: "exact",
    })
    const plot = Plot.create({
      width: 301,
      height: 120,
      min_border: 0,
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 1}),
      toolbar_location: null,
      right: [scale_bar],
    })

    const {view} = await display(plot, [700, 170])
    const bar = view.owner.get_one(scale_bar)
    const expect_stable_layout = async () => {
      await view.ready
      await delay(400)
      const render_count = (view as any)._render_count
      const frame_width = view.frame.bbox.width
      await delay(400)
      expect((view as any)._render_count).to.be.equal(render_count)
      expect(view.frame.bbox.width).to.be.equal(frame_width)
      expect(bar.bbox.right).to.be.below(view.bbox.right + 0.01)
    }

    await expect_stable_layout()
    {
      const {axis_scale, label_layout} = bar as any
      expect(axis_scale.target_range.span).to.be.equal(Math.round(view.frame.bbox.width/2))
      expect(label_layout.text.text).to.be.equal("5.00 m")
    }

    plot.width = 600
    scale_bar.setv({bar_length: 60, bar_length_units: "screen"})
    await expect_stable_layout()
    {
      const {axis_scale, label_layout} = bar as any
      expect(axis_scale.target_range.span).to.be.equal(60)
      const value = (600/view.frame.bbox.width).toFixed(2)
      expect(label_layout.text.text).to.be.equal(`${value} m`)
    }
  })

})
