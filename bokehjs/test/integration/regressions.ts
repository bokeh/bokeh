import {display, fig, row, column, grid} from "./_util"

import {
  Arrow, ArrowHead, NormalHead, OpenHead,
  BoxAnnotation, LabelSet, Legend, LegendItem, Slope, Whisker,
  Range1d, DataRange1d, FactorRange,
  ColumnDataSource, CDSView, BooleanFilter, IndexFilter, Selection,
  LinearAxis, CategoricalAxis,
  GlyphRenderer, GraphRenderer, GridBox,
  Circle, Quad, MultiLine,
  StaticLayoutProvider,
  LinearColorMapper,
  Plot,
} from "@bokehjs/models"

import {Button, Select, MultiSelect, MultiChoice} from "@bokehjs/models/widgets"
import {DataTable, TableColumn} from "@bokehjs/models/widgets/tables"

import {Factor} from "@bokehjs/models/ranges/factor_range"

import {Color} from "@bokehjs/core/types"
import {Anchor, Location, OutputBackend, MarkerType} from "@bokehjs/core/enums"
import {subsets} from "@bokehjs/core/util/iterator"
import {assert} from "@bokehjs/core/util/assert"
import {range, linspace} from "@bokehjs/core/util/array"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {Random} from "@bokehjs/core/util/random"
import {Matrix} from "@bokehjs/core/util/matrix"
import {defer} from "@bokehjs/core/util/defer"
import {Figure, MarkerArgs} from "@bokehjs/api/plotting"
import {Spectral11} from "@bokehjs/api/palettes"
import {div} from "@bokehjs/core/dom"

const n_marker_types = [...MarkerType].length

function svg_image(svg: string): string {
  return `data:image/svg+xml;utf-8,${svg}`
}

describe("Bug", () => {
  describe("in issue #9879", () => {
    it("disallows to change FactorRange to a lower dimension with a different number of factors", async () => {
      const p = fig([200, 200], {
        title: null,
        toolbar_location: null,
        x_range: new FactorRange({factors: [["a", "b"], ["b", "c"]]}),
        y_range: new DataRange1d(),
      })
      const source = new ColumnDataSource({data: {x: [["a", "b"], ["b", "c"]], y: [1, 2]}})
      p.vbar({x: {field: "x"}, top: {field: "y"}, width: 0.1, source})
      const {view} = await display(p)

      source.data = {x: ["a"], y: [1]}
      ;(p.x_range as FactorRange).factors = ["a"]
      await view.ready
    })
  })

  describe("in issue #9522", () => {
    it("disallows arrow to be positioned correctly in stacked layouts", async () => {
      const horz = (end?: ArrowHead) => new Arrow({x_start: 1, x_end: 5, y_start: 0, y_end:  0, end})
      const vert = (end?: ArrowHead) => new Arrow({x_start: 2, x_end: 2, y_start: 1, y_end: -2, end})

      const p1 = fig([200, 200], {x_range: [0, 6], y_range: [-3, 2]})
      p1.add_layout(horz(new NormalHead({fill_color: "blue"})))
      p1.add_layout(vert())

      const p2 = fig([200, 200], {x_range: [0, 6], y_range: [-3, 2]})
      p2.add_layout(horz())
      p2.add_layout(vert(new NormalHead({fill_color: "green"})))

      await display(row([p1, p2]))
    })
  })

  describe("in issue #9703", () => {
    it.allowing(8)("disallows ImageURL glyph to set anchor and angle at the same time", async () => {
      const p = fig([300, 300], {x_range: [-1, 10], y_range: [-1, 10]})

      const svg = `\
<svg version="1.1" viewBox="0 0 2 2" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0,0 2,0 1,2 Z" fill="green" />
</svg>
`
      const img = svg_image(svg)

      let y = 0
      const w = 1, h = 1

      for (const anchor of [...Anchor].slice(0, 9)) {
        p.image_url({url: [img], x: 0, y, w, h, anchor, angle: 0})
        p.image_url({url: [img], x: 1, y, w, h, anchor, angle: Math.PI/6})
        p.image_url({url: [img], x: 2, y, w, h, anchor, angle: Math.PI/4})
        p.image_url({url: [img], x: 3, y, w, h, anchor, angle: Math.PI/3})
        p.image_url({url: [img], x: 4, y, w, h, anchor, angle: Math.PI/2})
        p.image_url({url: [img], x: 5, y, w, h, anchor, angle: Math.PI/1})
        y += 1
      }

      await display(p)
    })
  })

  describe("in issue #9724", () => {
    it("makes automatic padding in data ranges inconsistent", async () => {
      const x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]

      const padding = {
        range_padding: 1,
        range_padding_units: "absolute" as const,
      }

      const p0 = (() => {
        const x_range = new DataRange1d()
        const y_range = new DataRange1d(padding)
        const p = fig([150, 150], {x_range, y_range})
        p.line({x, y: 10, line_width: 2, color: "red"})
        return p
      })()

      const p1 = (() => {
        const x_range = new DataRange1d()
        const y_range = new DataRange1d(padding)
        const p = fig([150, 150], {x_range, y_range})
        p.line({x, y: 10, line_width: 2, color: "red"})
        p.line({x, y: 15, line_width: 2, color: "blue"})
        return p
      })()

      const p2 = (() => {
        const x_range = new DataRange1d()
        const y_range = new DataRange1d({start: 0, ...padding})
        const p = fig([150, 150], {x_range, y_range})
        p.line({x, y: 10, line_width: 2, color: "red"})
        return p
      })()

      const p3 = (() => {
        const x_range = new DataRange1d()
        const y_range = new DataRange1d({start: 0, ...padding})
        const p = fig([150, 150], {x_range, y_range})
        p.line({x, y: 10, line_width: 2, color: "red"})
        p.line({x, y: 15, line_width: 2, color: "blue"})
        return p
      })()

      await display(row([p0, p1, p2, p3]))
    })
  })

  describe("in issue #9877", () => {
    function plot(fill: Color | null, line: Color | null) {
      const p = fig([200, 200], {x_range: [0, 3], y_range: [0, 3]})
      p.circle({x: [1, 1, 2, 2], y: [1, 2, 1, 2], radius: 0.5, line_color: null, fill_color: "red"})

      const box = new BoxAnnotation({
        bottom: 1, top: 2, left: 1, right: 2,
        fill_color: fill, fill_alpha: 0.5,
        line_color: line, line_alpha: 1.0, line_width: 4,
      })
      p.add_layout(box)
      return p
    }

    it("disallows BoxAnnotation to respect fill_color == null", async () => {
      const p0 = plot("blue", "green")
      const p1 = plot(null, "green")
      await display(row([p0, p1]))
    })

    it("disallows BoxAnnotation to respect line_color == null", async () => {
      const p0 = plot("blue", "green")
      const p1 = plot("blue", null)
      await display(row([p0, p1]))
    })
  })

  describe("in issue #9230", () => {
    function plot(output_backend: OutputBackend, selected?: Selection) {
      const p = fig([200, 200], {tools: "box_select", output_backend})
      const x = [0, 1, 2, 3]
      const y = [0, 1, 2, 3]
      const c = ["black", "red", "green", "blue"]
      const source = new ColumnDataSource({data: {x, y, c}, selected})
      const view = new CDSView({source, filters: [new BooleanFilter({booleans: [false, true, true, true]})]})
      p.circle({field: "x"}, {field: "y"}, {source, view, color: {field: "c"}, size: 20})
      return p
    }

    it("makes GlyphRenderer use incorrect subset indices", async () => {
      const p0 = plot("canvas")
      const p1 = plot("webgl")
      await display(row([p0, p1]))
    })

    it("makes GlyphRenderer use incorrect subset indices after selection", async () => {
      const items = []
      for (const indices of subsets([1, 2, 3])) {
        const selection = new Selection({indices})
        const p0 = plot("canvas", selection)
        const p1 = plot("webgl", selection)
        items.push(column([p0, p1]))
      }
      await display(row(items))
    })
  })

  describe("in issue #10856", () => {
    it("makes GlyphRenderer ignore changes to secondary glyphs", async () => {
      const p = fig([200, 200])

      const x = [0, 1, 2, 3, 4]
      const y = [0, 1, 2, 3, 4]
      const c = ["red", "orange", "green", "blue", "purple"]

      const selected = new Selection({indices: [1, 3, 4]})
      const source = new ColumnDataSource({data: {x, y, c}, selected})
      const r = p.circle({field: "x"}, {field: "y"}, {
        source,
        color: {field: "c"},
        selection_line_color: "white",
        size: 20,
      })

      const {view} = await display(p)

      const glyph = r.selection_glyph as Circle
      glyph.line_color = "black"
      glyph.hatch_pattern = "/"

      await view.ready
    })
  })

  describe("in issue #10042", () => {
    it("disallows to set subgroup_label_orientation = 0", async () => {
      const random = new Random(1)

      const factors: Factor[] = [
        ["A", "01", "AA"], ["A", "01", "AB"], ["A", "01", "AC"], ["A", "01", "AD"], ["A", "01", "AE"],
        ["B", "02", "AA"], ["B", "02", "AB"], ["B", "02", "AC"], ["B", "02", "AD"], ["B", "02", "AE"],
      ]
      const y_range = new FactorRange({factors})

      const p = fig([200, 300], {y_range})
      p.hbar({
        y: factors,
        left: 0,
        right: random.floats(factors.length),
        height: 0.8,
      })

      for (const axis of p.yaxis) {
        if (axis instanceof CategoricalAxis)
          axis.subgroup_label_orientation = 0
      }

      await display(p)
    })
  })

  describe("in issue #10575", () => {
    const factors: Factor[] = [
      ["A", "01", "AA"], ["A", "01", "AB"], ["A", "01", "AC"], ["A", "01", "AD"], ["A", "01", "AE"],
      ["B", "02", "AA"], ["B", "02", "AB"], ["B", "02", "AC"], ["B", "02", "AD"], ["B", "02", "AE"],
    ]

    it("disallows rendering Whisker annotation with a categorical x-range", async () => {
      const random = new Random(1)

      const x = factors
      const y = random.floats(factors.length)
      const upper = y.map((yi) => yi + random.float())
      const lower = y.map((yi) => yi - random.float())

      const source = new ColumnDataSource({data: {x, y, lower, upper}})
      const whisker = new Whisker({source, dimension: "height", base: {field: "x"}})

      const x_range = new FactorRange({factors})
      const p = fig([400, 200], {x_range})
      p.circle({source})
      p.add_layout(whisker)

      await display(p)
    })

    it("disallows rendering Whisker annotation with a categorical y-range", async () => {
      const random = new Random(1)

      const x = random.floats(factors.length)
      const y = factors
      const upper = x.map((xi) => xi + random.float())
      const lower = x.map((xi) => xi - random.float())

      const source = new ColumnDataSource({data: {x, y, lower, upper}})
      const whisker = new Whisker({source, dimension: "width", base: {field: "y"}})

      const y_range = new FactorRange({factors})
      const p = fig([200, 400], {y_range})
      p.circle({source})
      p.add_layout(whisker)

      await display(p)
    })
  })

  describe("in issue #10219", () => {
    it("disallows correct placement of Rect glyph with partial categorical ranges", async () => {
      const source = new ColumnDataSource({data: {
        x: ["A", "A", "A", "B", "B", "B", "C", "C", "C"],
        y: ["A", "B", "C", "A", "B", "C", "A", "B", "C"],
      }})

      const p = fig([300, 300], {x_range: ["B", "C"], y_range: ["C", "B"]})

      p.rect({x: {field: "x"}, y: {field: "y"}, width: 0.9, height: 0.9, source})
      p.circle({x: {field: "x"}, y: {field: "y"}, radius: 0.2, color: "red", source})

      await display(p)
    })
  })

  describe("in issue #10246", () => {
    function make_layout(output_backend: OutputBackend) {
      const x = range(0, 11)
      const y0 = x
      const y1 = x.map((xi) => 10 - xi)
      const y2 = x.map((xi) => Math.abs(xi - 5))

      const s0 = fig([200, 200], {output_backend})
      s0.circle(x, y0, {size: 12, alpha: 0.8, color: "#53777a"})

      const s1 = fig([200, 200], {output_backend})
      s1.triangle(x, y1, {size: 12, alpha: 0.8, color: "#c02942"})

      const s2 = fig([200, 200], {output_backend, visible: false})
      s2.square(x, y2, {size: 12, alpha: 0.8, color: "#d95b43"})

      return row([s0, s1, s2])
    }

    it("makes a plot with visible == false throw an exception", async () => {
      const l0 = make_layout("canvas")
      const l1 = make_layout("webgl")
      await display(column([l0, l1]))
    })
  })

  describe("in issue #10195", () => {
    it("makes extra axes render with invalid data ranges", async () => {
      function make_plot(axis_location: Location) {
        const p = fig([200, 200])
        p.extra_y_ranges = {yrangename: new Range1d({start: 0, end: 1})}
        p.add_layout(new LinearAxis({y_range_name: "yrangename"}), axis_location)
        return p
      }

      const p0 = make_plot("above")
      const p1 = make_plot("below")
      const p2 = make_plot("left")
      const p3 = make_plot("right")

      await display(row([p0, p1, p2, p3]))
    })
  })

  describe("in issue #10305", () => {
    it("disallows to render lines with NaNs using SVG backend", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([300, 200], {output_backend})
        const y = [NaN, 0, 1, 4, NaN, NaN, NaN, 3, 4, NaN, NaN, 5, 6, 9, 10]
        p.line({x: range(y.length), y})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #10725", () => {
    it("renders image glyphs in wrong orientation using SVG backend", async () => {
      function make_plot(output_backend: OutputBackend) {
        const N = 500
        const x = linspace(0, 10, N)
        const y = linspace(0, 10, N)
        const d = new Float64Array(N*N)
        const {sin, cos} = Math
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            d[i*N + j] = sin(x[i])*cos(y[j])
          }
        }

        const image = ndarray(d, {shape: [N, N]})
        const color_mapper = new LinearColorMapper({palette: Spectral11})

        const p = fig([200, 200], {output_backend})
        p.image({image: {value: image}, x: 0, y: 0, dw: 10, dh: 10, color_mapper})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #10362", () => {
    it("disallows updating layout when changing axis label", async () => {
      const p = fig([200, 100])
      p.circle([0, 1, 2], [0, 1, 2], {radius: 0.25})
      const {view} = await display(p)
      p.xaxis.map((axis) => axis.axis_label = "X-Axis Label")
      await view.ready
    })
  })

  describe("in issue #10369", () => {
    it("disallows ImageURL glyph to compute correct bounds with different anchors", async () => {
      const svg = `\
<svg version="1.1" viewBox="0 0 2 2" xmlns="http://www.w3.org/2000/svg">
  <circle cx="1" cy="1" r="1" fill="blue" />
</svg>
`
      const img = svg_image(svg)

      const plots = []
      for (const anchor of [...Anchor].slice(0, 9)) {
        const x_range = new DataRange1d()
        const y_range = new DataRange1d()
        const p = fig([200, 200], {x_range, y_range, title: anchor, match_aspect: true})
        p.image_url({url: [img], x: 0, y: 0, w: 1, h: 1, anchor})
        plots.push(p)
      }
      const r = grid(Matrix.from(plots, 3))
      await display(r)
    })
  })

  describe("in issue #8446", () => {
    it("disallows correct rendering circle scatter plots with SVG backend", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {output_backend, title: output_backend})
        p.scatter([-1, -2, -3, -4, -5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5, marker: "circle"})
        p.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "red", alpha: 0.5})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #6775", () => {
    it("disallows correct rendering of legends with SVG backend", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {output_backend, title: output_backend})
        const cross = p.diamond({x: 1, y: 1, color: "red", size: 30})
        const square = p.square({x: 2, y: 1, size: 30})
        const items = [
          new LegendItem({label: "circle", renderers: [cross]}),
          new LegendItem({label: "square", renderers: [square]}),
        ]
        const legend = new Legend({items, location: "top_center"})
        p.add_layout(legend)
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #589", () => {
    it("disallows updating legend when glyphs change", async () => {
      const x = [1, 2, 3, 4, 5, 10]
      const y = [5, 6, 2, 3, 4, 10]

      const p = fig([300, 300])
      const r = p.line(x, y, {legend: "foo"}) // TODO: legend_item

      const {view} = await display(p)

      p.circle(x, y, {legend: "foo"}) // TODO: legend_item
      r.glyph.line_dash = "dotted"
      r.glyph.line_color = "black"
      p.line([1, 4, 8], [2, 12, 6], {line_color: "red", legend: "bar"}) // TODO: legend_item
      p.legend.background_fill_color = "blue"
      p.legend.background_fill_alpha = 0.2

      await view.ready
    })
  })

  describe("in issue #10454", () => {
    it("disallows using categorical coordinates with LabelSet annotation", async () => {
      const p = fig([300, 300], {x_range: ["X1", "X2", "X3"], y_range: ["Y1", "Y2", "Y3"]})
      p.rect({x: ["X1", "X2", "X3"], y: ["Y1", "Y2", "Y3"], width: 1, height: 1, fill_alpha: 0.3})

      const labels0 = new LabelSet({x: {value: "X1"}, y: {value: "Y3"}, text: {value: "L0"}, text_color: "red"})
      p.add_layout(labels0)

      const labels1 = new LabelSet({x: {value: "X3"}, y: {value: "Y1"}, text: {value: "L1"}, text_color: "green"})
      p.add_layout(labels1)

      const source = new ColumnDataSource({data: {
        x: ["X1", "X2", "X3"],
        y: ["Y1", "Y2", "Y3"],
        text: ["L20", "L21", "L22"],
      }})
      const labels2 = new LabelSet({x: {field: "x"}, y: {field: "y"}, text: {field: "text"}, source, text_color: "blue"})
      p.add_layout(labels2)

      await display(p)
    })

    it("disallows using categorical coordinates with Arrow annotation", async () => {
      const p = fig([300, 300], {x_range: ["X1", "X2", "X3"], y_range: ["Y1", "Y2", "Y3"]})
      p.rect({x: ["X1", "X2", "X3"], y: ["Y1", "Y2", "Y3"], width: 1, height: 1, fill_alpha: 0.3})

      const arrow0 = new Arrow({
        x_start: {value: "X1"}, y_start: {value: "Y1"},
        x_end: {value: "X3"}, y_end: {value: "Y3"},
        line_color: "red",
      })
      p.add_layout(arrow0)
      const arrow1 = new Arrow({
        x_start: {value: "X3"}, y_start: {value: "Y1"},
        x_end: {value: "X1"}, y_end: {value: "Y3"},
        line_color: "green",
      })
      p.add_layout(arrow1)

      const source = new ColumnDataSource({data: {
        x_start: ["X2", "X2", "X2", "X2"],
        y_start: ["Y2", "Y2", "Y2", "Y2"],
        x_end: ["X3", "X2", "X1", "X2"],
        y_end: ["Y2", "Y3", "Y2", "Y1"],
      }})
      const labels2 = new Arrow({
        x_start: {field: "x_start"},
        y_start: {field: "y_start"},
        x_end: {field: "x_end"},
        y_end: {field: "y_end"},
        source,
        line_color: "blue",
      })
      p.add_layout(labels2)

      await display(p)
    })
  })

  describe("in issue #10136", () => {
    it("prevents correct rendering of overlapping arrows", async () => {
      const p = fig([200, 100], {x_range: [0, 3], y_range: [0, 2]})

      const source = new ColumnDataSource({data: {
        x_end: [1, 2, 3],
      }})
      const head = new OpenHead({size: 30, line_width: 3})
      const arrow = new Arrow({
        end: head,
        x_start: {value: 0},
        y_start: {value: 1},
        x_end: {field: "x_end"},
        y_end: {value: 1},
        line_width: 3,
        source,
      })
      p.add_layout(arrow)

      await display(p)
    })
  })

  describe("in issue #10457", () => {
    it("prevents rendering circle glyph with reversed ranges and radius in data units", async () => {
      function plot(x_range: [number, number], y_range: [number, number]) {
        const title = `[${x_range}] × [${y_range}]`
        const p = fig([150, 150], {x_range, y_range, title})
        p.circle({
          x: [0, 50, 100], y: [0, 50, 100], radius: {value: 20},
          fill_color: ["red", "green", "blue"],
          line_color: "black",
          alpha: 0.5,
        })
        return p
      }

      const p1 = plot([0, 100], [0, 100])
      const p2 = plot([100, 0], [0, 100])
      const p3 = plot([0, 100], [100, 0])
      const p4 = plot([100, 0], [100, 0])

      const layout = row([p1, p2, p3, p4])
      await display(layout)
    })

    it("prevents rendering marker glyphs with reversed ranges", async () => {
      type MarkerFn = (p: Figure) => (args: Partial<MarkerArgs>) => void

      function plot(fn: MarkerFn, x_range: [number, number], y_range: [number, number]) {
        const p = fig([100, 50], {x_range, y_range, x_axis_type: null, y_axis_type: null})
        fn(p)({
          x: [0, 50, 100], y: [0, 50, 100], size: {value: 30},
          fill_color: ["red", "green", "blue"],
          line_color: "black",
          alpha: 0.5,
        })
        return p
      }

      function plots(fn: MarkerFn) {
        const p1 = plot(fn, [0, 100], [0, 100])
        const p2 = plot(fn, [100, 0], [0, 100])
        const p3 = plot(fn, [0, 100], [100, 0])
        const p4 = plot(fn, [100, 0], [100, 0])
        return [p1, p2, p3, p4]
      }

      const fns: MarkerFn[] = [
        (p) => p.asterisk.bind(p),
        (p) => p.circle.bind(p),
        (p) => p.circle_cross.bind(p),
        (p) => p.circle_dot.bind(p),
        (p) => p.circle_x.bind(p),
        (p) => p.circle_y.bind(p),
        (p) => p.cross.bind(p),
        (p) => p.dash.bind(p),
        (p) => p.diamond.bind(p),
        (p) => p.diamond_cross.bind(p),
        (p) => p.diamond_dot.bind(p),
        (p) => p.dot.bind(p),
        (p) => p.hex.bind(p),
        (p) => p.hex_dot.bind(p),
        (p) => p.inverted_triangle.bind(p),
        (p) => p.plus.bind(p),
        (p) => p.square.bind(p),
        (p) => p.square_cross.bind(p),
        (p) => p.square_dot.bind(p),
        (p) => p.square_pin.bind(p),
        (p) => p.square_x.bind(p),
        (p) => p.star.bind(p),
        (p) => p.star_dot.bind(p),
        (p) => p.triangle.bind(p),
        (p) => p.triangle_dot.bind(p),
        (p) => p.triangle_pin.bind(p),
        (p) => p.x.bind(p),
        (p) => p.y.bind(p),
      ]

      assert(fns.length == n_marker_types)

      const layout = column(fns.map((fn) => row(plots(fn))))
      await display(layout)
    })
  })

  describe("in issue #10472", () => {
    it("prevents GraphRenderer to participate in auto-ranging", async () => {
      const p = fig([200, 200], {
        x_range: new DataRange1d({range_padding: 0.2}),
        y_range: new DataRange1d({range_padding: 0.2}),
      })

      const layout_provider = new StaticLayoutProvider({
        graph_layout: {
          4: [2, 1],
          5: [2, 2],
          6: [3, 1],
          7: [3, 2],
        },
      })

      const node_renderer = new GlyphRenderer({
        glyph: new Circle({size: 10, fill_color: "red"}),
        data_source: new ColumnDataSource({data: {index: [4, 5, 6, 7]}}),
      })
      const edge_renderer = new GlyphRenderer({
        glyph: new MultiLine({line_width: 2, line_color: "gray"}),
        data_source: new ColumnDataSource({data: {start: [4, 4, 5, 6], end: [5, 6, 6, 7]}}),
      })

      const graph = new GraphRenderer({layout_provider, node_renderer, edge_renderer})
      p.add_renderers(graph)

      await display(p)
    })
  })

  describe("in issue #10452", () => {
    it("prevents changing MultiChoice.disabled property", async () => {
      const widget = new MultiChoice({value: ["2", "3"], options: ["1", "2", "3"], width: 200})
      const {view} = await display(widget, [250, 100])
      widget.disabled = true
      await view.ready
    })
  })

  describe("in issue #10507", () => {
    it("prevents changing MultiSelect.disabled property", async () => {
      const widget = new MultiSelect({value: ["2", "3"], options: ["1", "2", "3"], width: 200})
      const {view} = await display(widget, [250, 100])
      widget.disabled = true
      await view.ready
    })
  })

  describe("in issue #10695", () => {
    it("prevents showing MultiChoice's dropdown menu", async () => {
      const random = new Random(1)

      const N = 10
      const columns = ["Apple", "Pear", "Banana"]

      const source = new ColumnDataSource({data: {
        Apple: random.floats(N),
        Pear: random.floats(N),
        Banana: random.floats(N),
      }})

      const choices = new MultiChoice({options: columns})
      const button = new Button({label: "A button"})
      const table = new DataTable({
        width: 300,
        height: 100,
        source,
        columns: columns.map((field) => new TableColumn({title: field, field})),
      })

      const layout = column([choices, button, table])
      const {view} = await display(layout, [350, 250])

      const choices_view = view.child_views[0] as MultiChoice["__view_type__"]
      (choices_view as any /*protected*/).choice_el.showDropdown()
      await defer()
    })
  })

  describe("in issue #10488", () => {
    it("disallows correct placement of Rect glyph with datetime values", async () => {
      const t0 = 1600755745624.793
      const source = new ColumnDataSource({data: {
        x: linspace(t0, t0 + 2*3600*1000, 50),
      }})
      const p = fig([800, 300])
      p.rect({x: {field: "x"}, y: 0, width: 100000, height: 1, line_color: "red", fill_alpha: 0.5, line_alpha: 0.5, source})
      await display(p)
    })
  })

  describe("in issue #10498", () => {
    it("prevents GridBox from rebuilding when rows or cols properties are modified", async () => {
      const p1 = fig([300, 300])
      const p2 = fig([300, 300])
      p1.circle({x: [0, 1], y: [0, 1], color: "red"})
      p2.circle({x: [1, 0], y: [0, 1], color: "green"})
      const box = new GridBox({
        children: [[p1, 0, 0], [p2, 0, 1]],
        cols: {0: 300, 1: 300},
        sizing_mode: "fixed",
      })
      const {view} = await display(box, [600, 300])
      box.cols = {0: 100, 1: 500}
      await view.ready
    })
  })

  describe("in issue #10541", () => {
    it("prevents Slope with gradient=0", async () => {
      const p = fig([200, 200], {x_range: [-5, 5], y_range: [-5, 5]})

      for (const gradient of [1, -1, 0, 2, -0.5]){
        const s = new Slope({gradient, y_intercept: -1})
        p.add_layout(s)
      }

      await display(p)
    })
  })

  describe("in issue #10589", () => {
    it("prevents correctly filtering out indices when using MultiLine glyph", async () => {
      const source = new ColumnDataSource({data: {
        xs: [[0, 0], [1, 1], [2, 2]],
        ys: [[0, 1], [0, 1], [0, 1]],
      }})
      const filter = new IndexFilter({indices: [0, 2]})
      const view = new CDSView({source, filters: [filter]})

      const p = fig([200, 200])
      p.multi_line({field: "xs"}, {field: "ys"}, {view, source})

      await display(p)
    })
  })

  describe("in issue #10809", () => {
    it("prevents repaint of resized layoutable renderers", async () => {
      const p = fig([100, 100])
      const {view} = await display(p)

      p.circle(0, 0, {radius: 1})
      await view.ready
    })
  })

  describe("in issue #10851", () => {
    function box(width: number, height: number): HTMLElement {
      return div({style: {width: `${width}px`, height: `${height}px`, backgroundColor: "red"}})
    }

    function layout() {
      const p0 = fig([200, 200], {sizing_mode: "scale_width", background_fill_alpha: 0.5, border_fill_alpha: 0.5})
      const p1 = fig([200, 200], {sizing_mode: "scale_width", background_fill_alpha: 0.5, border_fill_alpha: 0.5})
      p0.circle([0, 1, 2], [3, 4, 5])
      p1.circle([1, 2, 3], [4, 5, 6])
      return row([p0, p1], {sizing_mode: "scale_width", background: "orange"})
    }

    it("results in incorrect layout when viewport is smaller than optimal size", async () => {
      await display(layout(), [500, 300], box(350, 175))
    })

    it("results in incorrect layout when viewport is larger than optimal size", async () => {
      await display(layout(), [500, 300], box(450, 225))
    })
  })

  describe("in issue #10407", () => {
    it.allowing(2)("displays incorrect value in Select widget when options change", async () => {
      const widget = new Select({options: ["1", "2", "3"], value: "2", width: 200})
      const {view} = await display(widget, [250, 100])
      widget.options = ["1", "2"]
      await view.ready
    })

    it.allowing(2)("displays out-of-range value in Select widget when options change", async () => {
      const widget = new Select({options: ["1", "2", "3"], value: "3", width: 200})
      const {view} = await display(widget, [250, 100])
      widget.options = ["1", "2"]
      await view.ready
    })
  })

  describe("in issue holoviews#4589", () => {
    it("disallows rendering two glyphs sharing a source and view", async () => {
      const source = new ColumnDataSource({
        data: {
          x: [0],
          y: [0],
          left: [1],
          right: [2],
          bottom: [1],
          top: [2],
        },
      })

      const view = new CDSView({source})

      const circle_renderer = new GlyphRenderer({
        data_source: source,
        glyph: new Circle(),
        view,
      })

      const quad_renderer = new GlyphRenderer({
        data_source: source,
        glyph: new Quad(),
        view,
      })

      const x_range = new Range1d({start: -1, end: 3})
      const y_range = new Range1d({start: -1, end: 3})

      const p = new Plot({
        width: 200, height: 200,
        x_range, y_range,
        title: null, toolbar_location: null,
        renderers: [circle_renderer, quad_renderer],
      })

      await display(p)
    })
  })
})
