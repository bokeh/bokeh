import {display, fig, row} from "../_util"
import {tap} from "../../interactive"
import {expect} from "../../unit/assertions"

import {Legend, LegendItem, LinearAxis} from "@bokehjs/models"
import {Random} from "@bokehjs/core/util/random"
import {range} from "@bokehjs/core/util/array"
import type {CircleArgs, LineArgs} from "@bokehjs/api/glyph_api"
import type {Orientation} from "@bokehjs/core/enums"
import {Location} from "@bokehjs/core/enums"
import {linspace} from "@bokehjs/core/util/array"
import {LegendItemClick} from "@bokehjs/core/bokeh_events"
import type {Scatter} from "@bokehjs/models/glyphs"
import {HTML} from "@bokehjs/models/dom"
import {Pane} from "@bokehjs/models"
import {type Plot} from "@bokehjs/models"
import {canvas} from "@bokehjs/core/dom"

async function show_with_exported(plot: Plot) {
  const width = plot.width!
  const height = plot.height!

  const canvas_el = canvas({width, height})
  const ctx = canvas_el.getContext("2d")!

  const html = new HTML({html: canvas_el, style: {width: `${width}`, height: `${height}px`}}) // remove ~5px; where is this coming from?
  const layout = row([plot, new Pane({elements: [html]})])
  const result = await display(layout, [2*width + 50, height + 50])

  const plot_view = result.view.views.get_one(plot)
  ctx.drawImage(plot_view.export().canvas, 0, 0)

  return result
}

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
    const y3 = random.floats(10)

    const cr0 = p.scatter(x, y0, {fill_color: "red"})

    const cr1 = p.scatter(x, y1, {fill_color: "blue"})
    const lr1 = p.line(x, y1, {line_color: "orange"})

    const cr2 = p.scatter(x, y2, {fill_color: "green"})

    const cr3 = p.scatter(x, y3, {marker: "square", fill_color: "yellow", line_color: "blue"})

    const items = [
      new LegendItem({label: "#0", renderers: [cr0]}),
      new LegendItem({label: "#1", renderers: [cr1, lr1]}),
      new LegendItem({label: "#2", renderers: [cr2]}),
      new LegendItem({label: "#3", renderers: [cr3]}),
    ]

    const legend = (attrs: Partial<Legend.Attrs>) => {
      return new Legend({items, background_fill_alpha: 0.7, ...attrs})
    }

    p.add_layout(legend({location: "center_left", orientation: "vertical", item_background_policy: "even", title: "even"}))
    p.add_layout(legend({location: "center", orientation: "vertical", item_background_policy: "odd", title: "odd"}))
    p.add_layout(legend({location: "top_center", orientation: "horizontal", item_background_policy: "even", title: "even"}))
    p.add_layout(legend({location: "top_right", orientation: "horizontal", item_background_policy: "odd", title: "odd"}))
    p.add_layout(legend({location: "bottom_right", orientation: "horizontal", item_background_policy: "even", title: "even"}))
    p.add_layout(legend({location: [0, 0], orientation: "vertical", item_background_policy: "odd", title: "odd"}))

    p.add_layout(legend({location: "center", orientation: "horizontal", item_background_policy: "even", title: "even"}), "above")
    p.add_layout(legend({location: "center", orientation: "horizontal", item_background_policy: "odd", title: "odd"}), "below")
    p.add_layout(legend({location: "center", orientation: "vertical", item_background_policy: "even", title: "even"}), "left")
    p.add_layout(legend({location: "center", orientation: "vertical", item_background_policy: "odd", title: "odd"}), "right")

    await show_with_exported(p)
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
      const [width, height] = figure_dimensions ?? (orientation == "horizontal" ? [300, 200] : [200, 300])
      const p = fig([width, height])

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
        if (type == "line") {
          return p.line(x, y, options as Partial<LineArgs>)
        } else {
          return p.scatter(x, y, options)
        }
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

      await show_with_exported(p)
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
        {label: "A label with\nthree lines\n(third line)", renderers: [3]},
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

      const cr1 = p.scatter(x, y1, {fill_color: null, line_color: "green"})

      const sr2 = p.scatter(x, y2, {marker: "square", fill_color: null, line_color: "orange"})
      const lr2 = p.line(x, y2, {line_color: "orange"})

      const cr3 = p.scatter(x, y3, {fill_color: null, line_color: "blue"})

      const sr4 = p.scatter(x, y4, {marker: "square", fill_color: null, line_color: "tomato"})
      const lr4 = p.line(x, y4, {line_color: "tomato"})

      const cr5 = p.scatter(x, y5, {fill_color: null, line_color: "purple"})

      const sr6 = p.scatter(x, y6, {marker: "square", fill_color: null, line_color: "pink"})
      const lr6 = p.line(x, y6, {line_color: "pink"})

      const items = [
        new LegendItem({label: "1*sin(x)", renderers: [cr1]}),
        new LegendItem({label: "2*sin(x)", renderers: [sr2, lr2]}),
        new LegendItem({label: "3*sin(x)", renderers: [cr3]}),
        new LegendItem({label: "4*sin(x)", renderers: [sr4, lr4]}),
        new LegendItem({label: "5*sin(x)", renderers: [cr5]}),
        new LegendItem({label: "6*sin(x)", renderers: [sr6, lr6]}),
      ]

      function legend(policy: "even" | "odd") {
        return new Legend({
          location: policy == "even" ? "top_right" : "bottom_right",
          items,
          orientation,
          nrows,
          ncols,
          title: `Markers (${nrows} x ${ncols}) (fill=${policy})`,
          item_background_policy: policy,
        })
      }

      p.add_layout(legend("even"), "center")
      p.add_layout(legend("odd"), "center")
      return p
    }

    describe("should support grid layout", () => {
      it("with nrows=2 and ncols=auto", async () => {
        const p = plot({nrows: 2, ncols: "auto"})
        await show_with_exported(p)
      })

      it("with nrows=3 and ncols=auto", async () => {
        const p = plot({nrows: 3, ncols: "auto"})
        await show_with_exported(p)
      })

      it("with nrows=auto and ncols=2", async () => {
        const p = plot({nrows: "auto", ncols: 2})
        await show_with_exported(p)
      })

      it("with nrows=auto and ncols=3", async () => {
        const p = plot({nrows: "auto", ncols: 3})
        await show_with_exported(p)
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

  it("should support LegendItemClick events", async () => {
    const p = fig([200, 200], {y_axis_location: "right", min_border: 0})

    const r0 = p.scatter({x: [1, 2, 3], y: [3, 4, 5], size: 10, marker: "circle", color: "red"})
    const r1 = p.scatter({x: [1, 2, 3], y: [2, 3, 4], size: 15, marker: "circle", color: "blue"})
    const r2 = p.scatter({x: [1, 2, 3], y: [1, 2, 3], size: 20, marker: "circle", color: "green"})

    const items = [
      new LegendItem({label: "Item #0", renderers: [r0]}),
      new LegendItem({label: "Item #1", renderers: [r1]}),
      new LegendItem({label: "Item #2", renderers: [r2]}),
    ]

    const legend = new Legend({items, location: "top_left", margin: 0})
    p.add_layout(legend)

    const clicked: LegendItem[] = []
    legend.on_event(LegendItemClick, ({item}) => {
      clicked.push(item)
      item.renderers.forEach((r) => (r.glyph as Scatter).marker = {value: "triangle"})
    })

    const {view: pv} = await display(p)

    const lv = pv.views.get_one(legend)
    for (const item_el of lv.shadow_el.querySelectorAll(".bk-item")) {
      await tap(item_el)
      await pv.ready
    }

    expect(clicked).to.be.equal(items)
  })
})
