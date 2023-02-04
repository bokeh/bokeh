import * as sinon from "sinon"

import {expect} from "assertions"
import {display} from "../../_util"

import {Plot} from "@bokehjs/models/plots/plot"
import {PlotView} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"
import {Row} from "@bokehjs/models/layouts/row"
import {Label, LabelView} from "@bokehjs/models/annotations/label"
import {Place} from "@bokehjs/core/enums"
import {GraphRenderer, GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {ResetTool, PanTool, Toolbar} from "@bokehjs/models"
import {Rect, Circle, MultiLine} from "@bokehjs/models/glyphs"
import {ColumnDataSource} from "@bokehjs/models/sources"
import {StaticLayoutProvider} from "@bokehjs/models/graphs"

async function new_plot_view(attrs: Partial<Plot.Attrs> = {}): Promise<PlotView> {
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 10}),
    y_range: new Range1d({start: 0, end: 10}),
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
  const reset = new ResetTool()
  const pan = new PanTool()
  const plot = new Plot({toolbar: new Toolbar({tools: [reset, pan]})})
  return {plot, reset, pan}
}

describe("Plot module", () => {

  describe("Plot", () => {
    it("should add single tool using add_tools method", () => {
      const plot = new Plot()
      const reset = new ResetTool()

      plot.add_tools(reset)

      const {tools} = plot.toolbar
      expect(tools.length).to.be.equal(1)
      expect(tools[0]).to.be.identical(reset)
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
      const graph = new GraphRenderer({
        layout_provider: new StaticLayoutProvider(),
        node_renderer: new GlyphRenderer({
          data_source: new ColumnDataSource({data: {start: [], end: []}}),
          glyph: new Circle(),
        }),
        edge_renderer: new GlyphRenderer({
          data_source: new ColumnDataSource({data: {index: []}}),
          glyph: new MultiLine(),
        }),
      })
      const glyph = new GlyphRenderer({data_source: new ColumnDataSource(), glyph: new Rect()})
      const plot = new Plot({renderers: [graph, glyph]})
      const {view: plot_view} = await display(plot)
      expect(plot_view.renderer_view(graph.node_renderer)).to.be.instanceof(GlyphRendererView)
      expect(plot_view.renderer_view(graph.edge_renderer)).to.be.instanceof(GlyphRendererView)
      expect(plot_view.renderer_view(graph)).to.be.instanceof(GraphRendererView)
      expect(plot_view.renderer_view(glyph)).to.be.instanceof(GlyphRendererView)
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
        const label = new Label({x: 0, y: 0, text: side})
        view.model.add_layout(label, side)
        // We need to do this for each side separately because otherwise
        // even if only e.g. `center.change` is connected, all other changes
        // will be taken into account by `build_renderer_views`.
        await view.ready
        expect(view.renderer_views.get(label)).to.be.instanceof(LabelView)
      }
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
      const x_range = new DataRange1d()
      const y_range = new DataRange1d()

      const p0 = new Plot({x_range, y_range})
      const p1 = new Plot({x_range, y_range})
      const row = new Row({children: [p0, p1]})

      const {view} = await display(row, null)

      const pv0 = view.owner.get_one(p0)
      const pv1 = view.owner.get_one(p1)

      expect(x_range.plots.has(pv0)).to.be.true
      expect(y_range.plots.has(pv0)).to.be.true
      expect(x_range.plots.has(pv1)).to.be.true
      expect(y_range.plots.has(pv1)).to.be.true

      row.children = [p1]
      await view.ready

      expect(x_range.plots.has(pv0)).to.be.false
      expect(y_range.plots.has(pv0)).to.be.false
      expect(x_range.plots.has(pv1)).to.be.true
      expect(y_range.plots.has(pv1)).to.be.true

      row.children = []
      await view.ready

      expect(x_range.plots.has(pv0)).to.be.false
      expect(y_range.plots.has(pv0)).to.be.false
      expect(x_range.plots.has(pv1)).to.be.false
      expect(y_range.plots.has(pv1)).to.be.false
    })
  })
})
