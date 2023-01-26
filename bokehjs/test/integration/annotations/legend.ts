import {display, fig} from "../_util"

import {Legend, LegendItem, LinearAxis} from "@bokehjs/models"
import {Random} from "@bokehjs/core/util/random"
import {range} from "@bokehjs/core/util/array"
import {CircleArgs, LineArgs} from "@bokehjs/api/glyph_api"
import {Orientation, Location} from "@bokehjs/core/enums"
import {linspace} from "@bokehjs/core/util/array"

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
      const p = fig(figure_dimensions ?? (orientation == "horizontal" ? [300, 200] : [200, 300]))

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

      const gls = glyphs.map(({x, y, type, options}) => {
        if (type == "line")
          return p.line(x, y, options as Partial<LineArgs>)
        else
          return p.circle(x, y, options)
      })

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
    for (const title_location of Location) {
      describe(`with title_location=${title_location}`, () => {
        it("should display title correctly", async () => {
          await plot({
            legends: [{
              title: "title",
              title_location,
            }],
          })
        })

        it("should display multi-line title correctly", async () => {
          await plot({
            legends: [{
              title: "This is a long title\nwith two lines",
              title_location,
            }]})
        })

        it("should display title with standoff correctly", async () => {
          await plot({legends: [{
            title: "title",
            title_location,
            title_standoff: 20,
          }]})
        })
      })
    }

    it("should display labels with standoff correctly", async () => {
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
        figure_dimensions: orientation == "horizontal" ? [350, 200] : undefined,
      })
    })

    it("should display label_height correctly", async () => {
      await plot({legends: [{
        title: "title",
        label_height: 50,
      }]})
    })

    it("should display label_width correctly", async () => {
      await plot({
        legends: [{
          title: "title",
          label_width: 100,
        }],
        figure_dimensions: orientation == "horizontal" ? [500, 300] : [300, 200],
      })
    })

    it("should display margin correctly", async () => {
      await plot({legends: [{
        title: "title",
        margin: 0,
      }]})
    })

    it("should display padding correctly", async () => {
      await plot({
        legends: [{
          title: "title",
          padding: 50,
        }],
        figure_dimensions: orientation == "horizontal" ? [400, 300] : [300, 400],
      })
    })

    it("should display spacing correctly", async () => {
      await plot({legends: [{
        title: "title",
        spacing: 20,
      }]})
    })

    it("should support multi-line labels", async () => {
      const legend_items = [
        {label: "A label with one line", renderers: [0]},
        {label: "A label with\ntwo lines", renderers: [1, 2]},
        {label: "A label with\nthree lines\n(thrid line)", renderers: [3]},
      ]
      await plot({
        legend_items,
        legends: [{title: "title"}],
        figure_dimensions: orientation == "horizontal" ? [500, 200] : [300, 300],
      })
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

  function test_grid(orientation: Orientation) {
    function plot({nrows, ncols}: {nrows: number | "auto", ncols: number | "auto"}) {
      const x = linspace(0, 4*Math.PI, 50)
      const y1 = x.map((xi) => Math.sin(xi))
      const y2 = y1.map((yi) => 2*yi)
      const y3 = y1.map((yi) => 3*yi)
      const y4 = y1.map((yi) => 4*yi)
      const y5 = y1.map((yi) => 5*yi)
      const y6 = y1.map((yi) => 6*yi)

      const p = fig([300, 300])

      const cr1 = p.circle(x, y1, {fill_color: null, line_color: "green"})

      const sr2 = p.square(x, y2, {fill_color: null, line_color: "orange"})
      const lr2 = p.line(x, y2, {line_color: "orange"})

      const cr3 = p.circle(x, y3, {fill_color: null, line_color: "blue"})

      const sr4 = p.square(x, y4, {fill_color: null, line_color: "tomato"})
      const lr4 = p.line(x, y4, {line_color: "tomato"})

      const cr5 = p.circle(x, y5, {fill_color: null, line_color: "purple"})

      const sr6 = p.square(x, y6, {fill_color: null, line_color: "pink"})
      const lr6 = p.line(x, y6, {line_color: "pink"})

      const items = [
        new LegendItem({label: "1*sin(x)", renderers: [cr1]}),
        new LegendItem({label: "2*sin(x)", renderers: [sr2, lr2]}),
        new LegendItem({label: "3*sin(x)", renderers: [cr3]}),
        new LegendItem({label: "4*sin(x)", renderers: [sr4, lr4]}),
        new LegendItem({label: "5*sin(x)", renderers: [cr5]}),
        new LegendItem({label: "6*sin(x)", renderers: [sr6, lr6]}),
      ]

      const legend = new Legend({
        items,
        orientation,
        nrows,
        ncols,
        title: `Markers (${nrows} x ${ncols})`,
        item_background_policy: "even",
      })

      p.add_layout(legend, "center")
      return p
    }

    describe("should support grid layout", () => {
      it("with nrows=2 and ncols=auto", async () => {
        const p = plot({nrows: 2, ncols: "auto"})
        await display(p)
      })

      it("with nrows=3 and ncols=auto", async () => {
        const p = plot({nrows: 3, ncols: "auto"})
        await display(p)
      })

      it("with nrows=auto and ncols=2", async () => {
        const p = plot({nrows: "auto", ncols: 2})
        await display(p)
      })

      it("with nrows=auto and ncols=3", async () => {
        const p = plot({nrows: "auto", ncols: 3})
        await display(p)
      })
    })
  }

  describe("in horizontal orientation", () => {
    test(plot({orientation: "horizontal"}), "horizontal")
    test_grid("horizontal")
  })

  describe("in vertical orientation", () => {
    test(plot({orientation: "vertical"}), "vertical")
    test_grid("vertical")
  })
})
