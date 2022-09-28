import sinon from "sinon"

import {expect} from "../unit/assertions"
import {display, fig, row, column, grid, DelayedInternalProvider} from "./_util"
import {PlotActions, xy} from "./_interactive"

import {
  Arrow, ArrowHead, NormalHead, OpenHead,
  BoxAnnotation, LabelSet, ColorBar, Slope, Whisker,
  Range1d, DataRange1d, FactorRange,
  ColumnDataSource, CDSView, BooleanFilter, IndexFilter, Selection,
  LinearAxis, CategoricalAxis,
  GlyphRenderer, GraphRenderer, GridBox,
  Circle, Quad, MultiLine,
  StaticLayoutProvider,
  LinearColorMapper,
  Plot,
  TeX,
  PanTool, LassoSelectTool, HoverTool, ZoomInTool,
  TileRenderer, WMTSTileSource,
  Renderer,
  ImageURLTexture,
  Row, Column,
  Pane,
  Tabs, TabPanel,
  FixedTicker,
  Jitter,
  ParkMillerLCG,
} from "@bokehjs/models"

import {Button, Toggle, Select, MultiSelect, MultiChoice, RadioGroup, RadioButtonGroup, Div, TextInput} from "@bokehjs/models/widgets"
import {DataTable, TableColumn} from "@bokehjs/models/widgets/tables"

import {Factor} from "@bokehjs/models/ranges/factor_range"

import {Document} from "@bokehjs/document"
import {Color, Arrayable} from "@bokehjs/core/types"
import {Anchor, Location, OutputBackend, MarkerType} from "@bokehjs/core/enums"
import {subsets, tail} from "@bokehjs/core/util/iterator"
import {assert} from "@bokehjs/core/util/assert"
import {range, linspace} from "@bokehjs/core/util/array"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {Random} from "@bokehjs/core/util/random"
import {Matrix} from "@bokehjs/core/util/matrix"
import {delay, paint} from "@bokehjs/core/util/defer"
import {encode_rgba} from "@bokehjs/core/util/color"
import {Figure, figure, show} from "@bokehjs/api/plotting"
import {MarkerArgs} from "@bokehjs/api/glyph_api"
import {Spectral11, turbo, plasma} from "@bokehjs/api/palettes"
import {div, offset_bbox} from "@bokehjs/core/dom"

import {MathTextView} from "@bokehjs/models/text/math_text"
import {PlotView} from "@bokehjs/models/plots/plot"
import {ToolbarPanelView} from "@bokehjs/models/annotations/toolbar_panel"

import {gridplot} from "@bokehjs/api/gridplot"
import {f} from "@bokehjs/api/expr"
import {np} from "@bokehjs/api/linalg"

const n_marker_types = [...MarkerType].length

function svg_data_url(svg: string): string {
  return `data:image/svg+xml;utf-8,${svg}`
}

function scalar_image(N: number = 100) {
  const x = linspace(0, 10, N)
  const y = linspace(0, 10, N)
  const d = new Float64Array(N*N)
  const {sin, cos} = Math
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      d[i*N + j] = sin(x[i])*cos(y[j])
    }
  }
  return ndarray(d, {shape: [N, N]})
}

function rgba_image() {
  const N = 20
  const d = new Uint32Array(N*N) // TODO: doesn't allow Uint8Array[N, N, 4]
  const dv = new DataView(d.buffer)

  const {trunc} = Math
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const r = trunc(i/N*255)
      const g = 158
      const b = trunc(j/N*255)
      const a = 255
      dv.setUint32(4*(i*N + j), encode_rgba([r, g, b, a]))
    }
  }
  return ndarray(d, {shape: [N, N]})
}

function svg_image() {
  return svg_data_url(`\
<svg version="1.1" viewBox="0 0 2 2" xmlns="http://www.w3.org/2000/svg">
<circle cx="1" cy="1" r="1" fill="blue" />
</svg>
`)
}

describe("Bug", () => {
  describe("in issue #9879", () => {
    it("disallows to change FactorRange to a lower dimension with a different number of factors", async () => {
      const p = fig([200, 200], {
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

      const img = svg_data_url(`\
<svg version="1.1" viewBox="0 0 2 2" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0,0 2,0 1,2 Z" fill="green" />
</svg>
`)

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
      const view = new CDSView({filter: new BooleanFilter({booleans: [false, true, true, true]})})
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
      glyph.hatch_color = "black"
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

    it("disallows to render multi-lines with NaNs using SVG backend", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([300, 200], {output_backend})
        const y = [NaN, 0, 1, 4, NaN, NaN, NaN, 3, 4, NaN, NaN, 5, 6, 9, 10]
        p.multi_line({xs: [range(y.length)], ys: [y]})
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
        const image = scalar_image(500)
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
      p.xaxis.axis_label = "X-Axis Label"
      await view.ready
    })
  })

  describe("in issue #10369", () => {
    it("disallows ImageURL glyph to compute correct bounds with different anchors", async () => {
      const img = svg_image()
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
        p.diamond({x: 1, y: 1, color: "red", size: 30, legend_label: "diamond"})
        p.square({x: 2, y: 1, size: 30, legend_label: "square"})
        p.legend.location = "top_center"
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
      const r = p.line(x, y, {legend_label: "foo"})

      const {view} = await display(p)

      p.circle(x, y, {legend_label: "foo"})
      r.glyph.line_dash = "dotted"
      r.glyph.line_color = "black"
      p.line([1, 4, 8], [2, 12, 6], {line_color: "red", legend_label: "bar"})
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
        graph_layout: new Map([
          [4, [2, 1]],
          [5, [2, 2]],
          [6, [3, 1]],
          [7, [3, 2]],
        ]),
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

  describe("in issue #9764", () => {
    it("prevents display of MultiChoice placeholder", async () => {
      const widget = new MultiChoice({placeholder: "Choose ...", options: ["1", "2", "3"], width: 200})
      await display(widget, [250, 100])
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
    it.allowing(22)("prevents changing MultiSelect.disabled property", async () => {
      const widget = new MultiSelect({value: ["2", "3"], options: ["1", "2", "3"], width: 200})
      const {view} = await display(widget, [250, 100])
      widget.disabled = true
      await view.ready
    })
  })

  describe("in issue #10695", () => {
    it.allowing(16)("prevents showing MultiChoice's dropdown menu", async () => {
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
      choices_view.choice_el.showDropdown()
      await paint()
    })
  })

  describe("in issue #11365", () => {
    it.allowing(16)("prevents showing MultiChoice's dropdown menu over subsequent roots", async () => {
      const columns = ["Apple", "Pear", "Banana"]

      const choices = new MultiChoice({options: columns})
      const button = new Button({label: "A button"})

      const layout = column([choices, button])
      const {view, el} = await display(layout, [350, 200])

      // XXX: note that this plot is not going to show up in the baseline (blf) nor will
      // be considered a part of the test by any means by the testing framework (e.g. no
      // cleanup will be made). This needs proper support for multi-root display, which
      // will be increasing more useful in future testing.
      const plot = fig([300, 100])
      plot.circle([1, 2, 3], [1, 2, 3])
      await show(plot, el)

      const choices_view = view.child_views[0] as MultiChoice["__view_type__"]
      choices_view.choice_el.showDropdown()
      await paint()
    })
  })

  describe("in issue #12115", () => {
    it.allowing(16)("prevents showing MultiChoice's dropdown items correctly", async () => {
      const columns = ["Apple", "Pear", "Banana"]
      const choices = new MultiChoice({options: columns, width: 75, width_policy: "fixed"})

      const {view} = await display(choices, [100, 200])
      view.choice_el.showDropdown()
      await paint()
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
        cols: ["300px", "300px"],
        sizing_mode: "fixed",
      })
      const {view} = await display(box, [600, 300])
      box.cols = ["100px", "500px"]
      await view.ready
    })
  })

  describe("in issue #10541", () => {
    it("prevents Slope with gradient=0", async () => {
      const p = fig([200, 200], {x_range: [-5, 5], y_range: [-5, 5]})

      for (const gradient of [1, -1, 0, 2, -0.5]) {
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
      const view = new CDSView({filter})

      const p = fig([200, 200])
      p.multi_line({field: "xs"}, {field: "ys"}, {view, source})

      await display(p)
    })
  })

  describe("in issue #11006", () => {
    it("prevents scaling of superscripts when using non-px font size units", async () => {
      const p = fig([300, 50], {
        x_range: new Range1d({start: 10**-2, end: 10**11}),
        y_range: new Range1d({start: 0, end: 1}),
        x_axis_type: "log",
        y_axis_type: null,
        min_border_top: 0,
        min_border_bottom: 0,
        min_border_left: 20,
        min_border_right: 20,
      })
      p.xaxis.major_label_text_font_size = "14pt"
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

  describe("in issue #11045", () => {
    it("prevents correct paint of glyphs using hatch patters in SVG backend after pan", async () => {
      const p = fig([200, 200], {x_range: [-1, 1], y_range: [-1, 1], output_backend: "svg"})
      p.circle({x: 0, y: 0, radius: 1, fill_color: "orange", alpha: 0.6, hatch_pattern: "@"})
      const {view} = await display(p)

      const {start: x_start, end: x_end} = p.x_range
      const {start: y_start, end: y_end} = p.y_range
      const pan = 0.5

      const xrs = new Map([["default", {start: x_start + pan, end: x_end + pan}]])
      const yrs = new Map([["default", {start: y_start + pan, end: y_end + pan}]])
      view.update_range({xrs, yrs}, {panning: true})

      // TODO: p.pan(0.5, 0.5)

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
      return row([p0, p1], {sizing_mode: "scale_width", styles: {background_color: "orange"}})
    }

    it("results in incorrect layout when viewport is smaller than optimal size", async () => {
      await display(layout(), [500, 300], box(350, 175))
    })

    it("results in incorrect layout when viewport is larger than optimal size", async () => {
      await display(layout(), [500, 300], box(450, 225))
    })
  })

  describe("in issue #11154", () => {
    it("does not allow the plotting API to consider hatch visuals", async () => {
      const p = fig([200, 200])
      const r = p.rect({
        x: [0, 1, 2], y: 3, width: 0.7, height: 0.7, angle: [0.0, 0.3, 0.6],
        hatch_pattern: "x", fill_color: "orange",
      })
      r.data_source.selected.indices = [1]
      await display(p)
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

  describe("in issue #11203", () => {
    it("doesn't allow to set RadioGroup.active = null", async () => {
      const widget = new RadioGroup({labels: ["1", "2", "3"], active: 1, inline: true, width: 200})
      const {view} = await display(widget, [250, 50])
      widget.active = null
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

      const view = new CDSView() // shared view between renderers

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

  describe("in issue #11149", () => {
    it("makes hatch patterns rotate with glyph's rotation", async () => {
      const p = fig([300, 300])

      const x = [0, 1, 2]
      const angle = [0.0, 0.3, 0.6]
      const common = {x, angle, hatch_pattern: "|", fill_color: "orange"}

      p.rect({y: 3, width: 0.7, height: 0.7, ...common})
      p.square({y: 2, size: 50, ...common})
      p.ellipse({y: 1, width: 0.8, height: 0.5, ...common})
      p.hex({y: 0, size: 50, ...common})

      await display(p)
    })
  })

  describe("in issue #11162", () => {
    it("makes axis allocate space for invisible tick labels", async () => {
      const p = fig([200, 200])
      p.line([0, 1], [0, 1])

      p.add_layout(new LinearAxis({major_label_text_color: null}), "right")
      p.add_layout(new LinearAxis({major_label_text_color: null}), "above")

      p.axis.major_tick_in = 10
      p.axis.major_tick_out = 0
      p.axis.minor_tick_in = 5
      p.axis.minor_tick_out = 0

      await display(p)
    })
  })

  describe("in issue #11231", () => {
    it("doesn't allow to reposition inner axes after layout", async () => {
      const random = new Random(1)
      const p = fig([200, 200])

      const color_mapper = new LinearColorMapper({palette: turbo(50), low: 0, high: 1})
      const color_bar = new ColorBar({color_mapper, label_standoff: 12})
      p.add_layout(color_bar, "right")

      const dw = 10
      const dh = 10
      const img = ndarray(random.floats(dw*dh), {dtype: "float64", shape: [dw, dw]})
      p.image({image: [img], x: 0, y: 0, dw, dh, color_mapper})

      const {view} = await display(p, [350, 350])

      p.width = 300
      p.height = 300

      await view.ready
    })
  })

  describe("in issue #11367", () => {
    it("doesn't allow to render legend for ellipse glyph", async () => {
      const p = fig([200, 100], {x_axis_type: null, y_axis_type: null})
      p.circle({x: [0, 1], y: [0, 1], radius: 0.1, legend_label: "circles"})
      p.ellipse({x: [0, 1], y: [1, 0], width: 0.2, height: 0.1, legend_label: "ellipses"})
      p.legend.location = "center"
      await display(p)
    })
  })

  describe("in issue #11378", () => {
    it("doesn't allow to correctly compute bounds when using MultiLine Glyph with a log axis", async () => {
      const xs = [[0, 1], [0, 1], [0, 1]]
      const ys = [[2, 1], [100, 200], [10, 20]]

      const p = fig([200, 200], {y_axis_type: "log"})
      p.multi_line({xs, ys})
      await display(p)
    })
  })

  describe("in issue #11110", () => {
    function plot(axis: "linear" | "log") {
      const x = [1, 2, 3, 4, 5]
      const y = [6e-2, 7e-4, 6e-6, 4e-8, 5e-10]

      const p = fig([200, 200], {y_axis_type: axis})
      p.yaxis.major_label_text_font_size = "1.5em"
      p.line({x, y})

      return p
    }

    it("doesn't correctly measure fonts if font size is provided in relative units", async () => {
      await display(row([plot("linear"), plot("log")]))
    })
  })

  describe("in issue #11479", () => {
    it("doesn't allow to render math text in multiple plots", async () => {
      const stub = sinon.stub(MathTextView.prototype, "provider")
      stub.value(new DelayedInternalProvider())
      try {
        const p0 = fig([200, 150], {
          x_axis_label: new TeX({text: "\\theta\\cdot\\left(\\frac{\\sin(x) + 1}{\\Gamma}\\right)"}),
        })
        p0.circle([1, 2, 3], [1, 2, 3])
        const p1 = fig([200, 150], {
          x_axis_label: new TeX({text: "\\theta\\cdot\\left(\\frac{\\cos(x) + 1}{\\Omega}\\right)"}),
        })
        p1.circle([1, 2, 3], [1, 2, 3])
        await display(row([p0, p1]))
      } finally {
        stub.restore()
      }
    })
  })

  describe("in issue #11508", () => {
    it("doesn't allow to correctly compute log bounds for data ranging", async () => {
      const y = [
        0.000000000000000000e+00,
        8.164452529434230836e+22,
        0.000000000000000000e+00,
        0.000000000000000000e+00,
        7.314143412752266717e+22,
        0.000000000000000000e+00,
        6.232344689415452361e+22,
        0.000000000000000000e+00,
        0.000000000000000000e+00,
        0.000000000000000000e+00,
        0.000000000000000000e+00,
        1.661581512390552584e+21,
        1.005171116507131360e+17,
        8.466177779596089600e+16,
        7.311184945273668800e+16,
        6.434035489362382400e+16,
        5.745531645071752000e+16,
        0.000000000000000000e+00,
        4.731234037419803200e+16,
      ]
      const x = range(y.length)

      const p = fig([200, 200], {y_axis_type: "log"})
      p.line(x, y, {line_width: 2})
      await display(p)
    })
  })

  describe("in issue #11446", () => {
    it("doesn't allow to correctly compute inspection indices in vline or hline mode", async () => {
      const p = fig([200, 200])
      const cr = p.circle([1, 2, 3, 4], [1, 2, 3, 4], {
        size: 20, fill_color: "steelblue", hover_fill_color: "red", hover_alpha: 0.1,
      })
      p.add_tools(new HoverTool({tooltips: null, renderers: [cr], mode: "vline"}))
      const {view} = await display(p)

      const crv = view.renderer_views.get(cr)!
      const [[sx], [sy]] = crv.coordinates.map_to_screen([2], [1.5])

      const ui = view.canvas_view.ui_event_bus
      const {left, top} = offset_bbox(ui.hit_area)

      const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
      ui.hit_area.dispatchEvent(ev)

      await view.ready
    })
  })

  describe("in issue #11437", () => {
    it("doesn't allow to use correct subset indices with image glyph during inspection", async () => {
      function plot(indices: number[]) {
        const p = fig([200, 200])
        const source = new ColumnDataSource({
          data: {
            x: [0, 10],
            image: [
              ndarray([0, 0, 1, 1], {shape: [2, 2]}),
              ndarray([5, 5, 6, 6], {shape: [2, 2]}),
            ],
          },
        })
        const color_mapper = new LinearColorMapper({low: 0, high: 6, palette: Spectral11})
        const cds_view = new CDSView({filter: new IndexFilter({indices})})
        const ir = p.image({
          image: {field: "image"},
          x: {field: "x"},
          y: 0,
          dw: 10,
          dh: 20,
          color_mapper,
          source,
          view: cds_view,
        })
        p.add_tools(new HoverTool({
          renderers: [ir],
          tooltips: [
            ["index", "$index"],
            ["value", "@image"],
          ],
        }))
        return [p, ir] as const
      }

      const [p0, r0] = plot([0])
      const [p1, r1] = plot([1])
      const [p2, r2] = plot([0, 1])

      const {view} = await display(row([p0, p1, p2]))

      function hover_at(plot_view: PlotView, r: Renderer, x: number, y: number) {
        const crv = plot_view.renderer_views.get(r)!
        const [[sx], [sy]] = crv.coordinates.map_to_screen([x], [y])

        const ui = plot_view.canvas_view.ui_event_bus
        const {left, top} = offset_bbox(ui.hit_area)

        const ev = new MouseEvent("mousemove", {clientX: left + sx, clientY: top + sy})
        ui.hit_area.dispatchEvent(ev)
      }

      const [pv0, pv1, pv2] = view.child_views as PlotView[]

      hover_at(pv0, r0,  2, 5)
      hover_at(pv1, r1, 12, 5)
      hover_at(pv2, r2,  2, 5)

      await view.ready
    })
  })

  describe("in issue #11413", () => {
    const osm_source = new WMTSTileSource({
      // url: "https://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png",
      url: "/assets/tiles/osm/{Z}_{X}_{Y}.png",
      attribution: "&copy; (0) OSM source attribution",
    })

    const esri_source = new WMTSTileSource({
      // url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}.jpg",
      url: "/assets/tiles/esri/{Z}_{Y}_{X}.jpg",
      attribution: "&copy; (1) Esri source attribution",
    })

    it("doesn't allow to remove an annotation element associated with a tile renderer", async () => {
      const osm = new TileRenderer({tile_source: osm_source})
      const esri = new TileRenderer({tile_source: esri_source})

      const p0 = fig([300, 200], {
        x_range: [-2000000, 6000000],
        y_range: [-1000000, 7000000],
        x_axis_type: "mercator",
        y_axis_type: "mercator",
        renderers: [osm],
      })

      const p1 = fig([300, 200], {
        x_range: [-2000000, 6000000],
        y_range: [-1000000, 7000000],
        x_axis_type: "mercator",
        y_axis_type: "mercator",
        renderers: [esri],
      })

      const {view} = await display(row([p0, p1]))

      p0.renderers = [esri]
      p1.renderers = [osm]

      await view.ready
    })
  })

  describe("in issue #11548", () => {
    const global_alpha = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]

    const x = [0, 11, 22, 0, 11, 22, 0, 11, 22]
    const y = [0, 0, 0, 11, 11, 11, 22, 22, 22]

    it("doesn't allow vectorized global alpha in Image glyph", async () => {
      function make_plot(output_backend: OutputBackend) {
        const color_mapper = new LinearColorMapper({palette: Spectral11})

        const p = fig([200, 200], {output_backend, title: output_backend})
        p.image({image: {value: scalar_image()}, x, y, dw: 10, dh: 10, global_alpha, color_mapper})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })

    it("doesn't allow vectorized global alpha in ImageRGBA glyph", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {output_backend, title: output_backend})
        p.image_rgba({image: {value: rgba_image()}, x, y, dw: 10, dh: 10, global_alpha})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })

    it("doesn't allow vectorized global alpha in ImageURL glyph", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {output_backend, title: output_backend})
        p.image_url({url: {value: svg_image()}, x, y, w: 10, h: 10, global_alpha, anchor: "bottom_left"})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #11551", () => {
    it("doesn't allow SVG backend to respect clip paths when painting images", async () => {
      const color_mapper = new LinearColorMapper({palette: Spectral11})

      const x_range: [number, number] = [0, 10]
      const y_range: [number, number] = [0, 10]

      const p0 = fig([100, 100], {output_backend: "svg", x_range, y_range})
      p0.image({image: {value: scalar_image()}, x: -2, y: -2, dw: 10, dh: 10, color_mapper})
      const p1 = fig([100, 100], {output_backend: "svg", x_range, y_range})
      p1.image_rgba({image: {value: rgba_image()}, x: -2, y: -2, dw: 10, dh: 10})
      const p2 = fig([100, 100], {output_backend: "svg", x_range, y_range})
      p2.image_url({url: {value: svg_image()}, x: -2, y: -2, w: 10, h: 10, anchor: "bottom_left"})

      await display(row([p0, p1, p2]))
    })
  })

  describe("in issue #11587", () => {
    it("doesn't allow SVG backend to respect clip paths when painting text", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([300, 200], {output_backend, title: output_backend, x_range: [0.5, 2.5], y_range: [0.5, 2.5]})
        p.text({x: [0, 1, 2], y: [0, 1, 2], text: ["Some 0", "Some 1", "Some 2"], text_font_size: "60px"})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("svg")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #11547", () => {
    it("doesn't render changes of graph layout provider", async () => {
      const p = fig([200, 200], {
        x_range: new DataRange1d({range_padding: 0.2}),
        y_range: new DataRange1d({range_padding: 0.2}),
      })

      const layout_provider = new StaticLayoutProvider({
        graph_layout: new Map([
          [4, [2, 1]],
          [5, [2, 2]],
          [6, [3, 1]],
          [7, [3, 2]],
        ]),
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
      const {view} = await display(p)

      graph.layout_provider = new StaticLayoutProvider({
        graph_layout: new Map([
          [4, [1, 1]],
          [5, [1, 2]],
          [6, [2, 2]],
          [7, [2, 1]],
        ]),
      })
      await view.ready
    })
  })

  describe("in issue #11646", () => {
    const url = "/assets/images/pattern.png"

    it("disallows using image texture as grid line's band fill", async () => {
      const p = fig([400, 200])

      p.vbar({x: [0], top: [1], alpha: 0.2, hatch_pattern: "."})

      p.xgrid.band_hatch_extra = {mycustom: new ImageURLTexture({url})}
      p.xgrid.band_hatch_pattern = "mycustom"

      await display(p)
    })
  })

  describe("in issue #11661", () => {
    it("makes line render incorrectly when painting with a subset of indices", async () => {
      const random = new Random(1)

      const x = range(0, 10)
      const y = random.floats(x.length)

      function plot(indices: number[]) {
        const p = fig([300, 100], {
          title: `Selected: ${indices.length == 0 ? "\u2205" : indices.join(", ")}`,
          x_axis_type: null, y_axis_type: null,
        })

        const selected = new Selection({indices})
        const source = new ColumnDataSource({data: {x, y}, selected})

        p.line({x: {field: "x"}, y: {field: "y"}, source, line_width: 3, line_color: "#addd8e"})
        p.circle({x: {field: "x"}, y: {field: "y"}, source, size: 3, color: "#31a354"})

        return p
      }

      const plots = [
        plot([]),
        plot([3]),
        plot([3, 4]),
        plot([3, 5]),
        plot([3, 6]),
        plot([0, 3, 4, 9]),
      ]

      await display(column(plots))
    })
  })

  describe("in issue #5046", () => {
    it("prevents webgl rendering of streaming markers", async () => {
      const radius = 0.8
      const angles = np.linspace(0, 2*np.pi, 13)
      const x = f`${radius}*np.cos(${angles})`
      const y = f`${radius}*np.sin(${angles})`
      const source = new ColumnDataSource({data: {x: x.slice(0, 6), y: y.slice(0, 6)}})

      function plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {
          output_backend, title: output_backend,
          x_range: [-1, 1], y_range: [-1, 1],
        })
        p.circle({x: {field: "x"}, y: {field: "y"}, size: 20, source})
        return p
      }

      const p0 = plot("canvas")
      const p1 = plot("svg")
      const p2 = plot("webgl")

      const {view} = await display(row([p0, p1, p2]))

      source.stream({x: x.slice(6), y: y.slice(6)}, 8)
      await view.ready
    })
  })

  describe("in issue #11462", () => {
    it("doesn't update ColorBar after mapper/axis/title property updates", async () => {
      const random = new Random(1)
      const p = fig([200, 200])

      const color_mapper = new LinearColorMapper({palette: turbo(50), low: 0, high: 1})
      const color_bar = new ColorBar({color_mapper, title: "original title", label_standoff: 12})
      p.add_layout(color_bar, "right")

      const dw = 10
      const dh = 10
      const img = ndarray(random.floats(dw*dh), {dtype: "float64", shape: [dw, dw]})
      p.image({image: [img], x: 0, y: 0, dw, dh, color_mapper})

      const {view} = await display(p, [350, 350])

      color_bar.color_mapper.palette = plasma(50)
      color_bar.major_label_text_font_style = "bold italic"
      color_bar.title = "new title"

      await view.ready
    })
  })

  describe("in issue #11770", () => {
    it("prevents correct computation of linked data ranges and a subset of plots not visible", async () => {
      function vis(visible: boolean) {
        const source = new ColumnDataSource({data: {x: [0.1], y: [0.1]}})

        const fig0 = fig([200, 200], {visible})
        const fig1 = fig([200, 200], {x_axis_type: "log", y_axis_type: "log"})
        const fig2 = fig([200, 200], {x_axis_type: "log", x_range: fig1.x_range, y_range: fig1.y_range, visible})
        fig0.line({x: {field: "x"}, y: {field: "y"}, source})
        fig1.line({x: {field: "x"}, y: {field: "y"}, source})
        fig2.line({x: {field: "x"}, y: {field: "y"}, source})

        const layout = column([fig0, fig1, fig2])
        return {source, layout}
      }

      const vis0 = vis(true)
      const vis1 = vis(false)

      const {view} = await display(row([vis0.layout, vis1.layout]))

      vis0.source.data = {x: [10, 11], y: [10, 11]}
      vis1.source.data = {x: [10, 11], y: [10, 11]}

      await view.ready
    })
  })

  describe("in issue #11801", () => {
    it("prevents computation of data ranges if a plot was initially not visible", async () => {
      const p = fig([200, 200], {visible: false})
      p.line([1, 2, 3], [1, 2, 3])

      const {view} = await display(p)

      p.visible = true
      await view.ready
    })
  })

  describe("in issue #11832", () => {
    it("should x-zoom the x-axis when the y-axis is bounded", async () => {
      const zoom_in_tool = new ZoomInTool({dimensions: "width"})

      const p = fig([200, 200], {x_range: [-1, 1], y_range: [-1, 1]})
      p.y_range.bounds = [-1, 1]

      p.add_tools(zoom_in_tool)
      p.line([-1, 0, 1], [-1, 1, 0])

      const {view} = await display(p)

      const zoom_in_tool_view = view.tool_views.get(zoom_in_tool)! as ZoomInTool["__view_type__"]
      zoom_in_tool_view.doit()

      await view.ready
    })
  })

  describe("in issue #8346", () => {
    it("should support updating line", async () => {
      const p0 = fig([200, 200], {output_backend: "webgl"})
      const p1 = fig([200, 200], {output_backend: "webgl"})

      const source = new ColumnDataSource({data: {x0: [0, 1], y0: [0, 1], x1: [5, 6], y1: [5, 6]}})
      p0.line({x: {field: "x0"}, y: {field: "y0"}, source})
      p1.line({x: {field: "x1"}, y: {field: "y1"}, source})
      const {view} = await display(row([p0, p1]))

      source.data = {x0: [0, 1], y0: [1, 0], x1: [5, 6], y1: [6, 5]}
      await view.ready
    })
  })

  describe("in issue #9448", () => {
    const url = "/assets/fonts/vujahday/VujahdayScript-Regular.ttf"
    const font = new FontFace("VujahdayScript", `url(${url})`)

    before_each(() => {
      document.fonts.add(font)
    })

    function assert_fonts(status: boolean) {
      expect(document.fonts.check("normal 12px VujahdayScript")).to.be.equal(status)
      expect(document.fonts.check("normal 22px VujahdayScript")).to.be.equal(status)
      expect(document.fonts.check("normal 26px VujahdayScript")).to.be.equal(status)
      expect(document.fonts.check("normal 30px VujahdayScript")).to.be.equal(status)
    }

    it("prevents correct text rendering with lazily loaded fonts", async () => {
      assert_fonts(false)

      const p = fig([200, 200], {x_range: [0, 10], y_range: [0, 3]})

      p.xaxis.axis_label = "X-Axis"
      p.xaxis.axis_label_text_font = "VujahdayScript"
      p.xaxis.axis_label_text_font_size = "22px"
      p.xaxis.major_label_text_font = "VujahdayScript"
      p.xaxis.major_label_text_font_size = "12px"

      p.yaxis.axis_label = "Y-Axis"
      p.yaxis.axis_label_text_font = "VujahdayScript"
      p.yaxis.axis_label_text_font_size = "26px"
      p.yaxis.major_label_text_font = "VujahdayScript"
      p.yaxis.major_label_text_font_size = "12px"

      p.text({
        x: [0, 1, 2], y: [0, 1, 2],
        text: ["Śome 0", "Sómę 1", "Šome 2"],
        text_font: "VujahdayScript", text_font_size: "30px",
      })

      const {view} = await display(p)

      await document.fonts.ready
      assert_fonts(true)

      await view.ready
    })

    after_each(() => {
      const deleted = document.fonts.delete(font)
      assert(deleted, "font cleanup failed")
    })
  })

  describe("in issue #11035", () => {
    it("doesn't allow to use non-Plot models in gridplot()", async () => {
      const plot = fig([200, 200])
      plot.circle([1, 2, 3], [1, 2, 3])

      const div = new Div({text: "some text"})
      const button = new Button({label: "Click!"})

      const gp = gridplot([[plot, div], [null, button]], {merge_tools: true, toolbar_location: "above"})

      gp.rows = "max-content"
      gp.cols = "max-content"

      await display(gp)
    })
  })

  describe("in issue #11623", () => {
    function make_plot(toolbar_location: Location | null) {
      const p = fig([200, 200], {toolbar_location})
      p.circle([1, 2, 3], [1, 2, 3], {color: "red"})
      return p
    }

    it("doesn't allow changing location of a Plot toolbar from null to 'above'", async () => {
      const p = make_plot(null)
      const {view} = await display(p)

      p.toolbar_location = "above"
      await view.ready
    })

    it("doesn't allow changing location of a Plot toolbar from 'above' to null", async () => {
      const p = make_plot("above")
      const {view} = await display(p)

      p.toolbar_location = null
      await view.ready
    })

    it("doesn't allow changing location of a Plot toolbar from 'above' to 'left'", async () => {
      const p = make_plot("above")
      const {view} = await display(p)

      p.toolbar_location = "left"
      await view.ready
    })

    it("doesn't allow changing location of a Plot toolbar from 'above' to 'right'", async () => {
      const p = make_plot("above")
      const {view} = await display(p)

      p.toolbar_location = "right"
      await view.ready
    })

    it("doesn't allow changing location of a Plot toolbar from 'above' to 'below'", async () => {
      const p = make_plot("above")
      const {view} = await display(p)

      p.toolbar_location = "below"
      await view.ready
    })

    function make_gridplot(toolbar_location: Location | null) {
      const p0 = fig([100, 100])
      p0.circle([1, 2, 3], [1, 2, 3], {color: "red"})
      const p1 = fig([100, 100])
      p1.circle([1, 2, 3], [1, 2, 3], {color: "blue"})
      const p2 = fig([100, 100])
      p2.circle([1, 2, 3], [1, 2, 3], {color: "green"})
      const p3 = fig([100, 100])
      p3.circle([1, 2, 3], [1, 2, 3], {color: "yellow"})

      return gridplot([[p0, p1], [p2, p3]], {toolbar_location})
    }

    it("doesn't allow changing location of a GridPlot toolbar from null to 'above'", async () => {
      const gp = make_gridplot(null)
      const {view} = await display(gp)

      gp.toolbar_location = "above"
      await view.ready
    })

    it("doesn't allow changing location of a GridPlot toolbar from 'above' to null", async () => {
      const gp = make_gridplot("above")
      const {view} = await display(gp)

      gp.toolbar_location = null
      await view.ready
    })

    it("doesn't allow changing location of a GridPlot toolbar from 'above' to 'left'", async () => {
      const gp = make_gridplot("above")
      const {view} = await display(gp)

      gp.toolbar_location = "left"
      await view.ready
    })

    it("doesn't allow changing location of a GridPlot toolbar from 'above' to 'right'", async () => {
      const gp = make_gridplot("above")
      const {view} = await display(gp)

      gp.toolbar_location = "right"
      await view.ready
    })

    it("doesn't allow changing location of a GridPlot toolbar from 'above' to 'below'", async () => {
      const gp = make_gridplot("above")
      const {view} = await display(gp)

      gp.toolbar_location = "below"
      await view.ready
    })
  })

  describe("in issue #12001", () => {
    async function plot(fn: (color_bar: ColorBar) => void) {
      const random = new Random(1)
      const p = fig([200, 200])

      const color_mapper = new LinearColorMapper({palette: turbo(50), low: 0, high: 1})
      const color_bar = new ColorBar({color_mapper, label_standoff: 12})
      p.add_layout(color_bar, "right")

      const dw = 10
      const dh = 10
      const img = ndarray(random.floats(dw*dh), {dtype: "float64", shape: [dw, dw]})
      p.image({image: [img], x: 0, y: 0, dw, dh, color_mapper})

      const {view} = await display(p, [250, 250])

      fn(color_bar)
      await view.ready
    }

    it("doesn't allow updating palette of a color mapper of a color bar", async () => {
      await plot((color_bar) => {
        color_bar.color_mapper.palette = plasma(50)
      })
    })

    it("doesn't allow updating color mapper of a color bar", async () => {
      await plot((color_bar) => {
        color_bar.color_mapper = new LinearColorMapper({palette: plasma(50), low: 0, high: 1})
      })
    })
  })

  describe("in issue #11930", () => {
    it("doesn't allow overriding int major axis labels with floats", async () => {
      const response = await fetch("/assets/json/issue11930.json")
      const json = await response.json()

      const doc = Document.from_json(json)
      await display(doc)
    })
  })

  describe("in issue #9763", () => {
    it("incorrectly merges dissimilar tools of the same type", async () => {
      const tools = "xpan,ypan,xwheel_zoom,ywheel_zoom"

      const f0 = fig([100, 100], {tools})
      f0.circle([0, 1, 2], [0, 1, 2])
      const f1 = fig([100, 100], {tools})
      f1.circle([3, 4, 5], [3, 4, 5])
      const f2 = fig([100, 100], {tools})
      f2.circle([6, 7, 8], [6, 7, 8])
      const f3 = fig([100, 100], {tools})
      f3.circle([9, 10, 11], [9, 10, 11])

      const gp = gridplot([[f0, f1], [f2, f3]], {toolbar_location: "right", merge_tools: true})
      await display(gp)
    })
  })

  describe("in issue #11839", () => {
    it("doesn't allow to use active_ properties with tool proxies", async () => {
      const tools = "xpan,ypan,xwheel_zoom,ywheel_zoom"

      const f0 = fig([100, 100], {tools})
      f0.circle([0, 1, 2], [0, 1, 2])
      const f1 = fig([100, 100], {tools})
      f1.circle([3, 4, 5], [3, 4, 5])
      const f2 = fig([100, 100], {tools})
      f2.circle([6, 7, 8], [6, 7, 8])
      const f3 = fig([100, 100], {tools})
      f3.circle([9, 10, 11], [9, 10, 11])

      const gp = gridplot([[f0, f1], [f2, f3]], {toolbar_location: "right", merge_tools: true})
      gp.toolbar.active_drag = null

      await display(gp)
    })
  })

  describe("in issue #12058", () => {
    it("renders gaps in straight bevel-joined webgl lines", async () => {
      const p = fig([150, 150], {output_backend: "webgl", x_range: [0, 2.4], y_range: [0, 2.4]})
      p.grid.visible = false
      p.line([0, 1, 2, 2, 2], [2, 2, 2, 1, 0], {line_width: 30, line_join: "bevel"})
      await display(p)
    })
  })

  describe("in issue #11946", () => {
    it("doesn't allow to persist menus after a re-render", async () => {
      const p = fig([200, 100], {toolbar_location: "right", tools: [new PanTool()]})
      p.circle([1, 2, 3], [1, 2, 3])
      const {view} = await display(p)

      view.invalidate_render()

      const tbpv = [...view.renderer_views.values()].find((view): view is ToolbarPanelView => view instanceof ToolbarPanelView)
      assert(tbpv != null)

      const [pan_button_view] = tbpv.toolbar_view.tool_button_views.values()
      const pan_el = pan_button_view.el

      const ev0 = new MouseEvent("mousedown", {clientX: 5, clientY: 5, bubbles: true})
      const ev1 = new MouseEvent("mouseup", {clientX: 5, clientY: 5, bubbles: true})

      // tool button press
      pan_el.dispatchEvent(ev0)
      await delay(300)
      pan_el.dispatchEvent(ev1)
    })
  })

  describe("in issue #11704", () => {
    it("doesn't allow inclusion of circle radius in bounds computations", async () => {
      const x = [0.4595279480396895, -0.6065711356206639, -0.0687886392916304, -0.07637863162673651, -0.5244521855365748, 0.46832138015416175]
      const y = [0.604836077992458, 0.5442297884573969, -0.6203208740702811, 0.624789852804971, -0.08487633209696635, -0.08487633209696635]
      const r = [0.16571899322942416, 0.16571899322942416, 0.23436204776786676, 0.37055893402381984, 0.4687240955357335, 0.5240494701550029]

      const p = fig([300, 300], {match_aspect: true})
      p.circle({x, y, radius: r, line_color: "black", fill_alpha: 0.7})
      p.circle({x, y, size: 4, color: "black"})

      await display(p)
    })

    it("doesn't allow computation of tight bounds for circles", async () => {
      const x = [-5, 0, 10, 15]
      const y = [15, 0, 0, 15]
      const r = [1, 8, 1, 2]

      const p = fig([300, 300], {match_aspect: true})
      p.circle({x, y, radius: r, line_color: "black", fill_alpha: 0.7})
      p.circle({x, y, size: 4, color: "black"})

      await display(p)
    })
  })

  describe("in issue #11033", () => {
    it("prevents an update of plot layout after adding an axis", async () => {
      const p = fig([350, 200])
      p.circle({x: [1, 2, 3], y: [1, 2, 3], size: 20})
      const {view} = await display(p)

      for (const i of [1, 2, 3, 4, 5, 6]) {
        const name = `y${i}`
        p.extra_y_ranges = {...p.extra_y_ranges, [name]: new Range1d({start: 0, end: 10*i})}
        p.add_layout(new LinearAxis({y_range_name: name}), "right")
        await view.ready
      }
    })
  })

  describe("in issue #12127", () => {
    it("prevents displaying non-text labels in LabelSet", async () => {
      const p = fig([200, 200], {
        x_range: new Range1d({start: -1, end: 2}),
        y_range: new Range1d({start: -1, end: 2}),
      })

      const source = new ColumnDataSource({data: {
        a: [0, 0, 1, 1],
        b: [0, 1, 0, 1],
        c: [6, 7, 8, 9],
      }})

      const labels = new LabelSet({
        x: {field: "a"},
        y: {field: "b"},
        text: {field: "c"},
        source,
      })

      p.add_layout(labels)

      await display(p)
    })
  })

  describe("in issue #12357", () => {
    it("should not render size 0 webgl markers", async () => {
      const x = [0, 1, 2, 3]
      const size = [5, 0, 0, 5]
      const fill_color = "orange"
      const line_color = "black"

      function make_plot(output_backend: OutputBackend) {
        const p = fig([150, 150], {output_backend, title: output_backend})
        p.xgrid.visible = false
        p.ygrid.visible = false
        p.circle(x, 0, {size, fill_color, line_color})
        p.scatter(x, 1, {marker: "circle", size, fill_color, line_color})
        p.scatter(x, 2, {marker: "square", size, fill_color, line_color})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("webgl")

      await display(row([p0, p1]))
    })

    it("prevents selection of webgl line segments using indices", async () => {
      const angles = np.linspace(0, 2*np.pi, 13)
      const x = np.cos(angles)
      const y = np.sin(angles)
      y[10] = NaN
      const selected = new Selection({indices: [0, 1, 2, 4, 6, 7, 9, 10]})
      const source = new ColumnDataSource({data: {x, y}, selected})

      function make_plot(output_backend: OutputBackend) {
        const p = fig([150, 150], {output_backend, title: output_backend})
        p.line({x: {field: "x"}, y: {field: "y"}, source, line_width: 4})
        p.circle({x: {field: "x"}, y: {field: "y"}, source, fill_color: "red", size: 8})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("webgl")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #12361", () => {
    it("prevents correct rendering with vectorized line_width == 0", async () => {
      function plot(output_backend: OutputBackend) {
        const p = fig([150, 200], {title: output_backend, output_backend})
        p.circle({x: 0, y: [0, 1, 2, 3], fill_color: "orange", size: 12, line_width: [0, 5, 0, 5]})
        return p
      }

      const p0 = plot("canvas")
      const p1 = plot("svg")
      const p2 = plot("webgl")

      await display(row([p0, p1, p2]))
    })
  })

  describe("in issue #12155", () => {
    it("prevents computing correct layout for inline radio group", async () => {
      const radio_group = new RadioGroup({
        labels: ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
        inline: true,
        active: 0,
        styles: {
          background_color: "red",
        },
      })
      await display(radio_group, [400, 50])
    })
  })

  describe("in issue #12205", () => {
    it("prevents expansion of Div when using sizing_mode='stretch_width'", async () => {
      const div = new Div({
        text: "Some text",
        sizing_mode: "stretch_width",
        styles: {border: "1px solid red"},
      })

      const plot = fig([300, 300], {sizing_mode: "stretch_width"})
      plot.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5])

      const col = new Column({children: [div, plot], sizing_mode: "stretch_width"})
      await display(col, [300, 350])
    })
  })

  describe("in issue #9113", () => {
    it.allowing(8)("prevents layout update when adding new toggle group buttons", async () => {
      const group = new RadioButtonGroup({labels: []})
      const {view} = await display(group, [300, 100])

      group.labels = [...group.labels, "Button 0"]
      await view.ready
      await paint()

      group.labels = [...group.labels, "Button 1"]
      await view.ready
      await paint()

      group.labels = [...group.labels, "Button 2"]
      await view.ready
      await paint()
    })
  })

  describe("in issue #9208", () => {
    it("makes a 'stretch_width' and large height child overflow x when y scrollbar is present", async () => {
      const plot = fig([200, 600], {
        width_policy: "max",
        height_policy: "fixed",
        toolbar_location: "right",
      })
      plot.circle([1, 2, 3], [1, 2, 3], {size: 10})

      const pane = new Pane({
        styles: {width: "300px", height: "300px", overflow_y: "scroll"},
        children: [plot],
      })

      await display(pane, [350, 350])
    })
  })

  describe("in issue #11339", () => {
    it.allowing(2*8)("collapses layout after toggling visiblity", async () => {
      const toggle = new Toggle({label: "Click", active: true})
      const select1 = new Select({title: "Select 1:", options: ["1", "2"]})
      const select2 = new Select({title: "Select 2:", options: ["1", "2"]})
      const div = new Div({text: "Some text"})

      const selects = new Column({children: [select1, select2]})
      const layout = new Column({children: [new Column({children: [toggle, selects]}), div]})

      // Defer to make sure CSS layout is done after each step. The last one isn't
      // strictly necessary, because test framework defers anyway after a test and
      // before collecting results and capturing screenshots.
      const {view} = await display(layout, [100, 200])
      await paint()

      // We aren't clicking on the button, because it doesn't affect the outcome.
      selects.visible = false
      await view.ready
      await paint()

      selects.visible = true
      await view.ready
      await paint()
    })
  })

  describe("in issue #4817", () => {
    it("doesn't correctly align widgets after adding text to a widget", async () => {
      const button = new Button({label: "Say"})
      const input = new TextInput({value: "Bokeh"})
      const output = new Div()

      button.on_click(() => {
        output.text = `Hello, ${input.value}!`
      })

      const layout = new Column({
        children: [
          new Row({children: [button, input]}),
          output,
        ],
      })

      const {view} = await display(layout, [300, 100])

      const button_view = view.owner.find_one(button)
      assert(button_view != null)

      const ev = new MouseEvent("click", {bubbles: true})
      button_view.button_el.dispatchEvent(ev)

      await view.ready
      await paint()
    })
  })

  describe("in issue #4403", () => {
    it("doesn't allow layout resize when parent element's size changed", async () => {
      const plot = figure({sizing_mode: "stretch_both"})
      plot.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5})

      const pane = new Pane({styles: {width: "200px", height: "200px"}, children: [plot]})
      const {view} = await display(pane, [350, 350])
      await paint()

      pane.styles = {width: "300px", height: "300px"}
      await view.ready
    })
  })

  describe("in issue #8469", () => {
    it("makes child layout update invalidate and re-render entire layout", async () => {
      const p0 = figure({width: 300, height: 300})
      p0.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5})
      const button = new Button({label: "click"})
      const column = new Column({children: [new Column({children: [button, p0]})]})
      const tab0 = new TabPanel({child: column, title: "circle"})

      const p1 = figure({width: 300, height: 300})
      p1.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {line_width: 3, color: "navy", alpha: 0.5})
      const tab1 = new TabPanel({child: p1, title: "line"})

      const tabs = new Tabs({tabs: [tab0, tab1]})
      button.on_click(() => {
        column.children = [...column.children, new Button({label: "new button"})]
      })

      const {view} = await display(tabs, [350, 650])

      const button_view = view.owner.find_one(button)
      assert(button_view != null)

      for (const _ of range(0, 5)) {
        const ev = new MouseEvent("click", {bubbles: true})
        button_view.button_el.dispatchEvent(ev)
        await view.ready
        await paint()
      }
    })
  })

  describe("in issue #9133", () => {
    it("doesn't allow to set fixed size of Tabs layout", async () => {
      const p1 = figure({width: 300, height: 300})
      p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {size: 20, color: "navy", alpha: 0.5})

      const p2 = figure({width: 300, height: 300})
      p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], {line_width: 3, color: "navy", alpha: 0.5})

      const tab1 = new TabPanel({child: p1, title: "circle"})
      const tab2 = new TabPanel({child: p2, title: "line"})
      const tabs = new Tabs({tabs: [tab1, tab2], width: 500})

      await display(tabs, [550, 350])
    })
  })

  describe("in issue #9992", () => {
    it("doesn't correctly display layout when visiblity changes", async () => {
      function create_figure(x: Arrayable<number>, y: Arrayable<number>, log_scale: boolean = false) {
        const plot = figure({width: 300, height: 300, y_axis_type: log_scale ? "log" : "linear"})
        plot.line(x, y, {line_width: 3, line_alpha: 0.6})
        return plot
      }

      function create_tabs(plot0: Plot, plot1: Plot, name: string) {
        const tab0 = new TabPanel({child: plot0, title: "Linear"})
        const tab1 = new TabPanel({child: plot1, title: "Logarithmic"})
        return new Tabs({tabs: [tab0, tab1], name})
      }

      function create_selector(figs: Tabs[]) {
        const names = figs.map((fig) => fig.name) as string[]
        const selector = new Select({title: "Select Curve", value: names[0], options: names, width: 200})

        for (const fig of tail(figs)) {
          fig.visible = false
        }

        selector.on_change(selector.properties.value, () => {
          const selected = selector.value
          for (const fig of figs) {
            fig.visible = fig.name == selected
          }
        })

        return selector
      }

      const x = np.linspace(0, 10)

      const fig_lin_lin = create_figure(x, x)
      const fig_lin_log = create_figure(x, x, true)
      const fig_lin = create_tabs(fig_lin_lin, fig_lin_log, "Linear")

      const fig_quad_lin = create_figure(x, np.pow(x, 2))
      const fig_quad_log = create_figure(x, np.pow(x, 2), true)
      const fig_quad = create_tabs(fig_quad_lin, fig_quad_log, "Quadratic")

      const fig_exp_lin = create_figure(x, np.exp(x))
      const fig_exp_log = create_figure(x, np.exp(x), true)
      const fig_exp = create_tabs(fig_exp_lin, fig_exp_log, "Exponential")

      const figs = [fig_lin, fig_quad, fig_exp]

      const selector = create_selector(figs)
      const layout = column([selector, ...figs])

      const {view} = await display(layout, [450, 450])

      selector.value = "Exponential"
      await view.ready

      fig_exp.active = 1
      await view.ready
    })
  })

  describe("in issue #10125", () => {
    function make() {
      const button = new Button({label: "Click me!"})

      const radios = new RadioGroup({
        labels: ["hello", "there"],
        active: 0,
        inline: true,
      })

      const text_input1 = new TextInput({value: "0.0", title: "text-input1"})
      const text_input2 = new TextInput({value: "1.0", title: "text-input2"})
      const text_input3 = new TextInput({value: "2.0", title: "text-input3"})

      const plot = figure({width: 300, height: 300, title: "test plot"})
      plot.line({x: [1, 2, 3], y: [2, 4, 6]})

      const hidden_widgets = new Row({
        children: [
          new Column({children: [radios, text_input1, text_input2, text_input3]}),
          plot,
        ],
        visible: false,
      })
      button.on_click(() => hidden_widgets.visible = true)

      const layout = new Column({children: [button, hidden_widgets]})
      return {layout, button}
    }

    it("doesn't allow signal idle with invisible UI components", async () => {
      const {layout} = make()
      await display(layout, [100, 50])
    })

    it("doesn't correctly display layout when visiblity changes", async () => {
      const {layout, button} = make()
      const {view} = await display(layout, [550, 350])

      const button_view = view.owner.find_one(button)
      assert(button_view != null)

      const ev = new MouseEvent("click", {bubbles: true})
      button_view.button_el.dispatchEvent(ev)

      await view.ready
    })
  })

  describe("in issue #12412", () => {
    it("displays canvas step glyph with incorrect alpha", async () => {
      function make_plot(output_backend: OutputBackend) {
        const p = fig([200, 200], {output_backend, title: output_backend})
        p.step({mode: "before", x: [0, 1], y: [0.1, 1.1], line_width: 10, alpha: 0.5})
        p.step({mode: "center", x: [0.1, 1.1], y: [0, 1], line_width: 10, alpha: 0.5})
        p.step({mode: "after", x: [0.2, 1.2], y: [-0.1, 0.9], line_width: 10, alpha: 0.5})
        return p
      }

      const p0 = make_plot("canvas")
      const p1 = make_plot("webgl")

      await display(row([p0, p1]))
    })
  })

  describe("in issue #12418", () => {
    function plot(color: Color) {
      const lasso = new LassoSelectTool({persistent: true})
      lasso.overlay.line_dash = "solid"
      const p = fig([200, 200], {tools: [lasso]})
      p.circle([-2, -1, 0, 1, 2], [-2, -1, 0, 1, 2], {size: 10, color})
      return p
    }

    const path = {
      type: "poly" as const,
      xys: [xy(0, -1), xy(2, -1), xy(2, 1), xy(1, 2), xy(-1, 0), xy(0, -1)],
    }

    it("doesn't allow to correctly display lasso select overlay in single plots", async () => {
      const p = plot("red")
      const {view} = await display(p)

      const actions = new PlotActions(view)
      await actions.pan_along(path)
    })

    it("doesn't allow to correctly display lasso select overlay in layouts", async () => {
      const p0 = plot("red")
      const p1 = plot("green")
      const {view} = await display(new Row({children: [p0, p1]}))

      const pv0 = view.owner.get_one(p0)
      const pv1 = view.owner.get_one(p1)

      const actions0 = new PlotActions(pv0)
      await actions0.pan_along(path)

      const actions1 = new PlotActions(pv1)
      await actions1.pan_along(path)

      await paint()
    })
  })

  describe("in issue #12404", () => {
    it("doesn't allow to correctly apply jitter transform with Int32Array inputs", async () => {
      const mpg81 = [27, 26, 25, 23, 30, 39, 39, 35, 32, 37, 37, 34, 34, 34, 29, 33, 33, 32, 32, 31, 28, 30, 25, 24, 22, 26, 20, 17]
      const mpg82 = [28, 27, 34, 31, 29, 27, 24, 36, 37, 31, 38, 36, 36, 36, 34, 38, 32, 38, 25, 38, 26, 22, 32, 36, 27, 27, 44, 32]

      const yr81 = Int32Array.from({length: mpg81.length}, () => 81)
      const yr82 = Int32Array.from({length: mpg82.length}, () => 82)

      const source = new ColumnDataSource({
        data: {
          yr: new Int32Array([...yr81, ...yr82]),
          mpg: new Float64Array([...mpg81, ...mpg82]),
        },
      })

      function plot(title: string, transform?: Jitter) {
        const p = fig([200, 300], {title})
        p.xgrid.grid_line_color = null
        p.xaxis.ticker = new FixedTicker({ticks: [81, 82]})
        p.scatter({x: {field: "yr", transform}, y: {field: "mpg"}, size: 9, alpha: 0.4, source})
        return p
      }

      const p0 = plot("no jitter")
      const p1 = plot("jitter", new Jitter({width: 0.4, random_generator: new ParkMillerLCG({seed: 54235})}))

      await display(new Row({children: [p0, p1]}))
    })
  })
})
