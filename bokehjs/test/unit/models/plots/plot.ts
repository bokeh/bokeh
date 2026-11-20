import * as sinon from "sinon"

import {expect, expect_not_null} from "#framework/assertions"
import {display, fig, row} from "#framework/layouts"

import {Plot} from "@bokehjs/models/plots/plot"
import {XYPlot} from "@bokehjs/models/plots/xy_plot"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {CartesianMapping} from "@bokehjs/models/coordinates/cartesian_mapping"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {poll} from "@bokehjs/core/util/defer"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {Serializer} from "@bokehjs/core/serialization"
import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import {default_resolver} from "@bokehjs/base"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {Row} from "@bokehjs/models/layouts/row"
import {Label, LabelView} from "@bokehjs/models/annotations/label"
import {Div} from "@bokehjs/models/widgets/div"
import {Place} from "@bokehjs/core/enums"
import {GraphRenderer, GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import type {GlyphRendererWithSource} from "@bokehjs/models/renderers/glyph_renderer"
import {ResetTool, PanTool, Toolbar} from "@bokehjs/models"
import {Rect, Scatter, MultiLine} from "@bokehjs/models/glyphs"
import {ColumnDataSource} from "@bokehjs/models/sources"
import {StaticLayoutProvider} from "@bokehjs/models/graphs"

async function new_plot_view(attrs: Partial<XYPlot.Attrs> = {}): Promise<PlotView> {
  const plot = XYPlot.create({
    x_range: Range1d.create({start: 0, end: 10}),
    y_range: Range1d.create({start: 0, end: 10}),
    ...attrs,
  })
  const {view} = await display(plot)
  return view
}

interface PlotWithTools {
  plot: Plot
  reset: ResetTool
  pan: PanTool
}

function new_plot_with_tools(): PlotWithTools {
  const reset = ResetTool.create()
  const pan = PanTool.create()
  const plot = XYPlot.create({toolbar: Toolbar.create({tools: [reset, pan]})})
  return {plot, reset, pan}
}

describe("Plot module", () => {
  it("updates a shared DataRange1d when a plot is removed and re-added", async () => {
    const x_range = DataRange1d.create({range_padding: 0})
    const left = fig([200, 200], {x_range})
    const right = fig([200, 200], {x_range})
    left.scatter([1, 2], [1, 2])
    right.scatter([10, 20], [1, 2])

    const layout = row([left, right])
    const {view} = await display(layout)
    expect(x_range.start).to.be.equal(1)
    expect(x_range.end).to.be.equal(20)

    layout.children = [left]
    await view.ready
    expect(x_range.start).to.be.equal(1)
    expect(x_range.end).to.be.equal(2)

    x_range.start = -5
    await view.ready
    expect(x_range.start).to.be.equal(-5)
    layout.children = [left, right]
    await view.ready
    await view.owner.get_one(right).ready
    expect(x_range.start).to.be.equal(-5)

    view.owner.get_one(left).reset()
    await view.ready
    expect(x_range.start).to.be.equal(1)
    expect(x_range.end).to.be.equal(20)

    layout.children = [left]
    await view.ready
    expect(x_range.start).to.be.equal(1)
    expect(x_range.end).to.be.equal(2)
  })

  describe("Plot", () => {
    it("should add single tool using add_tools method", () => {
      const plot = XYPlot.create()
      const reset = ResetTool.create()

      plot.add_tools(reset)

      const {tools} = plot.toolbar
      expect(tools.length).to.be.equal(1)
      expect(tools[0]).to.be.identical(reset)
    })

    it("should add tools by their registered aliases", () => {
      const plot = XYPlot.create()

      plot.add_tools("xpan", "reset")

      const {tools} = plot.toolbar
      expect(tools.length).to.be.equal(2)
      expect(tools[0]).to.be.instanceof(PanTool)
      expect((tools[0] as PanTool).dimensions).to.be.equal("width")
      expect(tools[1]).to.be.instanceof(ResetTool)
    })

    it("should remove a single tool using remove_tools method", () => {
      const {plot, reset, pan} = new_plot_with_tools()

      plot.remove_tools(pan)

      const {tools} = plot.toolbar
      expect(tools.length).to.be.equal(1)
      expect(tools[0]).to.be.identical(reset)
    })

    it("should remove all tools using remove_tools method", () => {
      const {plot, reset, pan} = new_plot_with_tools()

      plot.remove_tools(pan, reset)

      const {tools} = plot.toolbar
      expect(tools.length).to.be.equal(0)
    })
  })

  describe("PlotView", () => {
    it("should allow to resolve child renderers of its composite renderers", async () => {
      const graph = GraphRenderer.create({
        layout_provider: StaticLayoutProvider.create(),
        node_renderer: GlyphRenderer.create<GlyphRendererWithSource<Scatter, ColumnDataSource>>({
          data_source: ColumnDataSource.create({data: {start: [], end: []}}),
          glyph: Scatter.create(),
        }),
        edge_renderer: GlyphRenderer.create<GlyphRendererWithSource<MultiLine, ColumnDataSource>>({
          data_source: ColumnDataSource.create({data: {index: []}}),
          glyph: MultiLine.create(),
        }),
      })
      const glyph = GlyphRenderer.create({data_source: ColumnDataSource.create(), glyph: Rect.create()})
      const plot = XYPlot.create({renderers: [graph, glyph]})
      const {view: plot_view} = await display(plot)
      expect(plot_view.views.find_one(graph.node_renderer)).to.be.instanceof(GlyphRendererView)
      expect(plot_view.views.find_one(graph.edge_renderer)).to.be.instanceof(GlyphRendererView)
      expect(plot_view.views.find_one(graph)).to.be.instanceof(GraphRendererView)
      expect(plot_view.views.find_one(glyph)).to.be.instanceof(GlyphRendererView)
    })

    it("should refresh cached renderer views when renderers change", async () => {
      const renderer0 = Label.create({x: 0, y: 0, text: "first"})
      const view = await new_plot_view({renderers: [renderer0]})

      const cached0 = view.computed_renderer_views
      const renderer_view0 = view.renderer_views.get(renderer0)!
      expect(view.computed_renderer_views).to.be.identical(cached0)
      expect(cached0.some((renderer_view) => renderer_view.model == renderer0)).to.be.true

      const renderer1 = Label.create({x: 1, y: 1, text: "second"})
      view.model.renderers = [renderer1]
      await view.ready

      const cached1 = view.computed_renderer_views
      expect(cached1).to.not.be.identical(cached0)
      expect(cached1.some((renderer_view) => renderer_view.model == renderer0)).to.be.false
      expect(cached1.some((renderer_view) => renderer_view.model == renderer1)).to.be.true
      expect(renderer_view0.is_destroyed).to.be.true
    })

    it("should refresh cached composite renderer and element views", async () => {
      const renderer0 = GlyphRenderer.create({data_source: ColumnDataSource.create(), glyph: Rect.create()})
      const element0 = Div.create({text: "first"})
      const annotation = Label.create({
        x: 0,
        y: 0,
        text: "annotation",
        renderers: [renderer0],
        elements: [element0],
      })
      const plot_view = await new_plot_view({renderers: [annotation]})
      const annotation_view = plot_view.renderer_views.get(annotation)! as LabelView

      const renderer_cache0 = annotation_view.computed_renderer_views
      const element_cache0 = annotation_view.computed_element_views
      const [renderer_view0] = renderer_cache0
      const [element_view0] = element_cache0
      expect(annotation_view.computed_renderer_views).to.be.identical(renderer_cache0)
      expect(annotation_view.computed_element_views).to.be.identical(element_cache0)
      expect(renderer_cache0.map((view) => view.model)).to.be.equal([renderer0])
      expect(element_cache0.map((view) => view.model)).to.be.equal([element0])

      const renderer1 = GlyphRenderer.create({data_source: ColumnDataSource.create(), glyph: Rect.create()})
      const element1 = Div.create({text: "second"})
      annotation.renderers = [renderer1]
      annotation.elements = [element1]
      await plot_view.ready

      const renderer_cache1 = annotation_view.computed_renderer_views
      const element_cache1 = annotation_view.computed_element_views
      expect(renderer_cache1).to.not.be.identical(renderer_cache0)
      expect(element_cache1).to.not.be.identical(element_cache0)
      expect(renderer_cache1.map((view) => view.model)).to.be.equal([renderer1])
      expect(element_cache1.map((view) => view.model)).to.be.equal([element1])
      expect(renderer_view0.is_destroyed).to.be.true
      expect(element_view0.is_destroyed).to.be.true
    })

    it("should stop responding to visual viewport resizes after being removed", async () => {
      expect_not_null(visualViewport)
      const view = await new_plot_view()
      const spy_resize = sinon.spy(view.canvas, "resize")

      try {
        visualViewport.dispatchEvent(new Event("resize"))
        expect(spy_resize.callCount).to.be.equal(1)
      } finally {
        view.remove()
      }

      visualViewport.dispatchEvent(new Event("resize"))
      expect(spy_resize.callCount).to.be.equal(1)
    })

    it("should perform standard reset actions by default", async () => {
      const view = await new_plot_view()
      const spy_state = sinon.spy(view.state, "clear")
      const spy_range = sinon.spy(view, "reset_range")
      const spy_selection = sinon.spy(view, "reset_selection")
      const spy_event = sinon.spy(view.model, "trigger_event")
      view.reset()
      expect(spy_state.called).to.be.true
      expect(spy_range.called).to.be.true
      expect(spy_selection.called).to.be.true
      expect(spy_event.called).to.be.true
    })

    it("should skip standard reset actions for event_only policy", async () => {
      const view = await new_plot_view({reset_policy: "event_only"})
      const spy_state = sinon.spy(view.state, "clear")
      const spy_range = sinon.spy(view, "reset_range")
      const spy_selection = sinon.spy(view, "reset_selection")
      const spy_event = sinon.spy(view.model, "trigger_event")
      view.reset()
      expect(spy_state.called).to.be.false
      expect(spy_range.called).to.be.false
      expect(spy_selection.called).to.be.false
      expect(spy_event.called).to.be.true
    })

    it("layout should set element style correctly", async () => {
      const view = await new_plot_view({width: 425, height: 658})
      const {width, height} = getComputedStyle(view.el)
      expect(width).to.be.equal("425px")
      expect(height).to.be.equal("658px")
    })

    it("should set min_border_x to value of min_border if min_border_x is not specified", async () => {
      const view = await new_plot_view({min_border: 33.33})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(33.33)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to value of min_border", async () => {
      const view = await new_plot_view({min_border: 33.33, min_border_left: 66.66})
      expect(view.layout.min_border.top).to.be.equal(33.33)
      expect(view.layout.min_border.bottom).to.be.equal(33.33)
      expect(view.layout.min_border.left).to.be.equal(66.66)
      expect(view.layout.min_border.right).to.be.equal(33.33)
    })

    it("should set min_border_x to value of specified, and others to default min_border", async () => {
      const view = await new_plot_view({min_border_left: 4})
      expect(view.layout.min_border.top).to.be.equal(5)
      expect(view.layout.min_border.bottom).to.be.equal(5)
      expect(view.layout.min_border.left).to.be.equal(4)
      expect(view.layout.min_border.right).to.be.equal(5)
    })

    it("should rebuild renderer views after add_layout", async () => {
      const view = await new_plot_view()
      for (const side of Place) {
        const label = Label.create({x: 0, y: 0, text: side})
        view.model.add_layout(label, side)
        // We need to do this for each side separately because otherwise
        // even if only e.g. `center.change` is connected, all other changes
        // will be taken into account by `build_renderer_views`.
        await view.ready
        expect(view.renderer_views.get(label)).to.be.instanceof(LabelView)
      }
    })

    it("should constrain current range when max_interval changes", async () => {
      const x_range = Range1d.create({start: 0, end: 10})
      const view = await new_plot_view({x_range})

      x_range.max_interval = 4
      await view.ready

      expect(x_range.start).to.be.equal(3)
      expect(x_range.end).to.be.equal(7)
    })

    it("should constrain DataRange1d when max_interval changes after initial render", async () => {
      const y_range = DataRange1d.create()
      const source = ColumnDataSource.create({data: {x: [0, 1, 2, 3], y: [0, 1, 4, 9]}})
      const glyph = Scatter.create({x: {field: "x"}, y: {field: "y"}})
      const renderer = GlyphRenderer.create({data_source: source, glyph})
      const view = await new_plot_view({y_range, renderers: [renderer]})

      expect(y_range.end - y_range.start).to.be.above(1)

      y_range.max_interval = 1e-12
      await view.ready

      expect(y_range.end - y_range.start).to.be.similar(1e-12, 1e-15)
    })

    it("should constrain current range when min_interval changes", async () => {
      const y_range = Range1d.create({start: 0, end: 2})
      const view = await new_plot_view({y_range})

      y_range.min_interval = 6
      await view.ready

      expect(y_range.start).to.be.equal(-2)
      expect(y_range.end).to.be.equal(4)
    })

    it("should keep current range within bounds when min_interval changes", async () => {
      const x_range = Range1d.create({start: 8, end: 10, bounds: [0, 10]})
      const view = await new_plot_view({x_range})

      x_range.min_interval = 6
      await view.ready

      expect(x_range.start).to.be.equal(4)
      expect(x_range.end).to.be.equal(10)
    })

    it("should prioritize bounds over an incompatible min_interval", async () => {
      const x_range = Range1d.create({start: 8, end: 10, bounds: [0, 10]})
      const view = await new_plot_view({x_range})

      x_range.min_interval = 12
      await view.ready

      expect(x_range.start).to.be.equal(0)
      expect(x_range.end).to.be.equal(10)
    })

    describe("PlotView.pause()", () => {

      it("should start unpaused", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
      })

      it("should toggle on/off in pairs", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
        view.pause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.false
      })

      it("should toggle off only on last unpause with nested pairs", async () => {
        const view = await new_plot_view()
        expect(view.is_paused).to.be.false
        view.pause()
        expect(view.is_paused).to.be.true
        view.pause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.true
        view.unpause()
        expect(view.is_paused).to.be.false
      })
    })

    it("should configure data ranges", async () => {
      const x_range = DataRange1d.create()
      const y_range = DataRange1d.create()

      const p0 = XYPlot.create({x_range, y_range})
      const p1 = XYPlot.create({x_range, y_range})
      const row = Row.create({children: [p0, p1]})

      const {view} = await display(row, null)

      const pv0 = view.owner.get_one(p0)
      const pv1 = view.owner.get_one(p1)

      expect(x_range.linked_plots.has(pv0)).to.be.true
      expect(y_range.linked_plots.has(pv0)).to.be.true
      expect(x_range.linked_plots.has(pv1)).to.be.true
      expect(y_range.linked_plots.has(pv1)).to.be.true

      row.children = [p1]
      await view.ready

      expect(x_range.linked_plots.has(pv0)).to.be.false
      expect(y_range.linked_plots.has(pv0)).to.be.false
      expect(x_range.linked_plots.has(pv1)).to.be.true
      expect(y_range.linked_plots.has(pv1)).to.be.true

      row.children = []
      await view.ready

      expect(x_range.linked_plots.has(pv0)).to.be.false
      expect(y_range.linked_plots.has(pv0)).to.be.false
      expect(x_range.linked_plots.has(pv1)).to.be.false
      expect(y_range.linked_plots.has(pv1)).to.be.false
    })
  })
})

describe("XYPlot coordinate mapping", () => {
  it("requires a fresh, range-free mapping and freezes it at construction", () => {
    const mapping = CartesianMapping.create()
    const p = XYPlot.create({coordinate_system: mapping})
    const q = XYPlot.create()
    expect(p.coordinate_system).to.be.identical(mapping)
    expect(q.coordinate_system).to.not.be.identical(XYPlot.create().coordinate_system)
    expect("x_range" in Plot.prototype._props).to.be.false
    expect("x_source" in mapping.properties).to.be.false
    expect(() => p.coordinate_system = CartesianMapping.create()).to.throw(Error, /readonly/)
    expect(() => p.setv({coordinate_system: mapping})).to.throw(Error, /readonly/)
    expect(() => p.setv({coordinate_system: null} as any)).to.throw(Error, /readonly/)
    expect(() => XYPlot.create({coordinate_system: null} as any)).to.throw(Error)
  })

  it("rebinds renderer transforms to replacement ranges and scales", async () => {
    const p = XYPlot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const renderer = p.add_glyph(Scatter.create({x: {field: "x"}, y: {field: "y"}}),
      ColumnDataSource.create({data: {x: [2], y: [3]}}))
    const {view} = await display(p)
    const rv = view.renderer_views.get(renderer)!
    const before = rv.coordinates
    const changes: Range1d[] = []
    p.on_change(p.properties.x_range, () => changes.push(p.x_range as Range1d))
    const replacement = Range1d.create({start: 1, end: 100})
    p.x_range = replacement
    p.x_scale = LogScale.create()
    const after = rv.coordinates
    expect(after).to.not.be.identical(before)
    expect(after.x_source).to.be.identical(replacement)
    expect(after.y_source).to.be.identical(p.y_range)
    expect(after.x_scale).to.be.instanceof(LogScale)
    expect(p.x_scale.properties.source_range.is_unset).to.be.true
    expect(changes).to.be.equal([replacement])
    const [sx] = after.map_to_screen([10], [3])
    expect(sx[0]).to.be.similar(view.frame.bbox.hcenter, 0.01)
    replacement.end = 1000
    const [updated] = after.map_to_screen([10], [3])
    expect(updated[0]).to.be.similar(view.frame.bbox.left + view.frame.bbox.width/3, 0.01)
  })

  it("runs property callbacks and links for range replacement", async () => {
    const target = XYPlot.create()
    const link = CustomJS.create({args: {target}, code: "target.x_range = cb_obj.x_range"})
    const source = XYPlot.create({_js_property_callbacks: {"change:x_range": [link]}})
    const range = Range1d.create({start: 2, end: 8})
    source.x_range = range
    await poll(() => target.x_range == range, 10, 1000)
    expect(target.x_range).to.be.identical(range)
  })

  it("repaints when a replacement range changes and disconnects the previous range", async () => {
    const original = Range1d.create({start: 0, end: 10})
    const p = XYPlot.create({x_range: original})
    const {view} = await display(p)
    const repaint = sinon.spy(view, "request_repaint")
    try {
      const replacement = Range1d.create({start: 0, end: 20})
      p.x_range = replacement
      repaint.resetHistory()
      replacement.end = 30
      expect(repaint.called).to.be.true
      repaint.resetHistory()
      original.end = 40
      expect(repaint.called).to.be.false
    } finally {
      repaint.restore()
    }
  })

  it("retains listeners for a range still shared by another dimension", async () => {
    const shared = Range1d.create({start: 0, end: 10})
    const p = XYPlot.create({x_range: shared, y_range: shared})
    const {view} = await display(p)
    const repaint = sinon.spy(view, "request_repaint")
    try {
      p.x_range = Range1d.create({start: 0, end: 20})
      repaint.resetHistory()
      shared.end = 30
      expect(repaint.called).to.be.true
      p.y_range = Range1d.create({start: 0, end: 40})
      repaint.resetHistory()
      shared.end = 50
      expect(repaint.called).to.be.false
    } finally {
      repaint.restore()
    }
  })

  it("observes interval constraints on replacement named ranges", async () => {
    const original = Range1d.create({start: 0, end: 10})
    const p = XYPlot.create({extra_x_ranges: {other: original}})
    const {view} = await display(p)
    const repaint = sinon.spy(view, "request_repaint")
    try {
      const replacement = Range1d.create({start: 0, end: 20})
      p.extra_x_ranges = {other: replacement}
      repaint.resetHistory()
      replacement.end = 30
      expect(repaint.called).to.be.true
      replacement.min_interval = 40
      expect(replacement.span).to.be.equal(40)
      replacement.min_interval = null
      replacement.max_interval = 25
      expect(replacement.span).to.be.equal(25)
      repaint.resetHistory()
      original.end = 50
      expect(repaint.called).to.be.false
    } finally {
      repaint.restore()
    }
  })

  it("starts a new range history when a range is replaced", async () => {
    const original = Range1d.create({start: 0, end: 10})
    const p = XYPlot.create({x_range: original, y_range: Range1d.create({start: 0, end: 10})})
    const {view} = await display(p)
    const pan = {xrs: new Map([[original, {start: 2, end: 8}]]), yrs: new Map()}
    view.state.push("pan", {range: pan})
    view.update_range(pan)
    const replacement = Range1d.create({start: 100, end: 110})
    p.x_range = replacement
    await view.ready
    expect(view.state.can_undo).to.be.false
    expect(view.state.undo()).to.be.null
    expect(original.start).to.be.equal(2)
    expect(original.end).to.be.equal(8)
    const next = {xrs: new Map([[replacement, {start: 102, end: 108}]]), yrs: new Map()}
    view.state.push("pan", {range: next})
    view.update_range(next)
    view.state.undo()
    expect(replacement.start).to.be.equal(100)
    expect(replacement.end).to.be.equal(110)
  })

  it("selects named ranges from the plot and rebinds after dictionary replacement", async () => {
    const first = Range1d.create({start: 0, end: 10})
    const p = XYPlot.create({extra_x_ranges: {other: first}})
    const renderer = p.add_glyph(Scatter.create(), ColumnDataSource.create(), {x_range_name: "other"})
    const {view} = await display(p)
    const rv = view.renderer_views.get(renderer)!
    expect(rv.coordinates.x_source).to.be.identical(first)
    const next = Range1d.create({start: 20, end: 30})
    p.extra_x_ranges = {other: next}
    expect(rv.coordinates.x_source).to.be.identical(next)
    expect(view.frame.ranges.has(first)).to.be.false
    expect(view.frame.ranges.has(next)).to.be.true
  })

  it("autoranges a replacement data range", async () => {
    const p = XYPlot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    p.add_glyph(Scatter.create({x: {field: "x"}, y: {field: "y"}}),
      ColumnDataSource.create({data: {x: [2, 8], y: [3, 7]}}))
    const {view} = await display(p)
    const replacement = DataRange1d.create()
    p.x_range = replacement
    await view.ready
    expect(isFinite(replacement.start)).to.be.true
    expect(isFinite(replacement.end)).to.be.true
    expect(replacement.start).to.be.below(2)
    expect(replacement.end).to.be.above(8)
  })

  it("recomputes categorical coordinates after range replacement and factor changes", async () => {
    const p = XYPlot.create({
      x_range: FactorRange.create({factors: ["a", "b"]}),
      x_scale: CategoricalScale.create(),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const renderer = p.add_glyph(Scatter.create({x: {field: "x"}, y: {field: "y"}}),
      ColumnDataSource.create({data: {x: ["a"], y: [3]}}))
    const {view} = await display(p)
    const rv = view.renderer_views.get(renderer)! as GlyphRendererView
    expect(rv.glyph.index.bbox.x0).to.be.equal(0.5)
    const replacement = FactorRange.create({factors: ["b", "a"]})
    p.x_range = replacement
    await view.ready
    expect(rv.glyph.index.bbox.x0).to.be.equal(1.5)
    replacement.factors = ["a", "b"]
    await view.ready
    expect(rv.glyph.index.bbox.x0).to.be.equal(0.5)
  })

  it("round trips construction-fixed mappings and shared ranges", () => {
    const x_range = Range1d.create({start: 1, end: 10})
    const p = XYPlot.create({x_range, coordinate_system: CartesianMapping.create()})
    const q = XYPlot.create({x_range})
    const serializer = new Serializer()
    const rep = serializer.encode([p, q])
    const deserializer = new Deserializer(default_resolver)
    const [cp, cq] = deserializer.decode(rep) as XYPlot[]
    expect(cp).to.be.instanceof(XYPlot)
    expect(cp.coordinate_system).to.be.instanceof(CartesianMapping)
    expect(cp.coordinate_system).to.not.be.identical(cq.coordinate_system)
    expect(cp.x_range).to.be.identical(cq.x_range)
    expect(() => cp.coordinate_system = CartesianMapping.create()).to.throw(Error, /readonly/)
  })
})
