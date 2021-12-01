import {display, fig} from "../_util"

import {Legend, LegendItem, LinearAxis} from "@bokehjs/models"
import {Random} from "@bokehjs/core/util/random"
import {range} from "@bokehjs/core/util/array"
import {CircleArgs, LineArgs} from "@bokehjs/api/glyph_api"
import {Orientation} from "@bokehjs/core/enums"

describe("Legend annotation", () => {
  it("should support various combinations of locations and orientations", async () => {
    const random = new Random(1)

    const p = fig([600, 600])
    p.add_layout(new LinearAxis(), "above")
    p.add_layout(new LinearAxis(), "right")

    const x = range(0, 10)
    const y0 = random.floats(10)
    const y1 = random.floats(10)
    const y2 = random.floats(10)

    const cr0 = p.circle(x, y0, {fill_color: "red"})

    const cr1 = p.circle(x, y1, {fill_color: "blue"})
    const lr1 = p.line(x, y1, {line_color: "orange"})

    const cr2 = p.circle(x, y2, {fill_color: "green"})

    const items = [
      new LegendItem({label: "#0", renderers: [cr0]}),
      new LegendItem({label: "#1", renderers: [cr1, lr1]}),
      new LegendItem({label: "#2", renderers: [cr2]}),
    ]

    const legend = (attrs: Partial<Legend.Attrs>) => {
      return new Legend({items, background_fill_alpha: 0.7, ...attrs})
    }

    p.add_layout(legend({location: "center_left", orientation: "vertical"}))
    p.add_layout(legend({location: "center", orientation: "vertical"}))
    p.add_layout(legend({location: "top_center", orientation: "horizontal"}))
    p.add_layout(legend({location: "top_right", orientation: "horizontal"}))
    p.add_layout(legend({location: "bottom_right", orientation: "horizontal"}))
    p.add_layout(legend({location: [0, 0], orientation: "vertical"}))

    p.add_layout(legend({location: "center", orientation: "horizontal"}), "above")
    p.add_layout(legend({location: "center", orientation: "horizontal"}), "below")
    p.add_layout(legend({location: "center", orientation: "vertical"}), "left")
    p.add_layout(legend({location: "center", orientation: "vertical"}), "right")

    await display(p)
  })

  type PlotFn = ({
    glyphs,
    legend_items,
    legends,
    figure_dimensions,
  }: {
    figure_dimensions?: [width: number, height: number]
    glyphs?: {
      x: number | number[]
      y: number | number[]
      type: "circle" | "line"
      options: Partial<CircleArgs | LineArgs>
    }[]
    legend_items?: {label: string, renderers: number[], visible?: boolean}[]
    legends: Partial<Legend.Attrs>[]
  }) => Promise<void>

  function plot({orientation}: {orientation: Orientation}): PlotFn {
    return async ({
      glyphs,
      legend_items,
      figure_dimensions,
      legends,
    }) => {
      const p = fig(figure_dimensions ?? (orientation == "horizontal" ? [250, 150] : [150, 250]))

      p.add_layout(new LinearAxis(), "above")
      p.add_layout(new LinearAxis(), "right")

      const random = new Random(1)
      const x = range(0, 10)
      const y0 = random.floats(10)
      const y1 = random.floats(10)
      const y2 = random.floats(10)

      if (glyphs == null) {
        glyphs = [
          {type: "circle", x, y: y0, options: {fill_color: "red"}},
          {type: "circle", x, y: y1, options: {fill_color: "blue"}},
          {type: "line", x, y: y1, options: {line_color: "orange"}},
          {type: "circle", x, y: y2, options: {fill_color: "green"}},
        ]
      }

      const gls = glyphs.map(({x, y, type, options}) =>
        type == "line"
          ? p.line(x, y, options as Partial<LineArgs>)
          : p.circle(x, y, options)
      )

      if (legend_items == null) {
        legend_items = [
          {label: "#0", renderers: [0]},
          {label: "#1", renderers: [1, 2]},
          {label: "#2", renderers: [3]},
        ]
      }

      const items = legend_items.map(({label, renderers, visible}) => {
        return new LegendItem({label, renderers: renderers.map(r => gls[r]), visible})
      })

      if (legends.length == 0) {
        legends = [{}]
      }

      legends.map(attrs => {
        p.add_layout(new Legend({
          location: "center",
          orientation,
          items,
          background_fill_alpha: 0.7,
          ...attrs,
        }))
      })

      await display(p)
    }
  }

  function test(plot: PlotFn, orientation?: Orientation) {
    it("should display title correctly", async () => {
      await plot({legends: [{title: "title"}]})
    })

    it("should display title standoff correctly", async () => {
      await plot({legends: [{
        title: "title",
        title_standoff: 20,
      }]})
    })

    it("should display label standoff correctly", async () => {
      await plot({legends: [{
        title: "title",
        label_standoff: 20,
      }]})
    })

    it("should display glyph_height correctly", async () => {
      await plot({legends: [{
        title: "title",
        glyph_height: 50,
      }]})
    })

    it("should display glyph_width correctly", async () => {
      await plot({
        legends: [{
          title: "title",
          glyph_width: 30,
        }],
        figure_dimensions: orientation == "horizontal" ? [350, 150] : undefined,
      })
    })

    it("should display label_height correctly", async () => {
      await plot({legends: [{
        title: "title",
        label_height: 50,
      }]})
    })

    it("should display label_width correctly", async () => {
      await plot({legends: [{
        title: "title",
        label_width: 50,
      }]})
    })

    it("should display margin correctly", async () => {
      await plot({legends: [{
        title: "title",
        margin: 0,
      }]})
    })

    it("should display padding correctly", async () => {
      await plot({legends: [{
        title: "title",
        padding: 5,
      }]})
    })

    it("should display spacing correctly", async () => {
      await plot({legends: [{
        title: "title",
        spacing: 20,
      }]})
    })

    it("should hide one non-visible item correctly", async () => {
      const legend_items = [
        {label: "#0", renderers: [0]},
        {label: "#1", renderers: [1, 2], visible: false},
        {label: "#2", renderers: [3]},
      ]
      await plot({legend_items, legends: [{title: "title"}]})
    })

    it("should hide entire legend with no visible items", async () => {
      const legend_items = [
        {label: "#0", renderers: [0], visible: false},
        {label: "#1", renderers: [1, 2], visible: false},
        {label: "#2", renderers: [3], visible: false},
      ]
      await plot({legend_items, legends: [{title: "title"}]})
    })
  }

  describe("in horizontal orientation", () => test(plot({orientation: "horizontal"}), "horizontal"))
  describe("in vertical orientation", () => test(plot({orientation: "vertical"}), "vertical"))
})
