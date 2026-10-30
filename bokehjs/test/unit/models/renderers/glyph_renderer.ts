import {assert} from "@bokehjs/core/util/assert"
import {PathDecoration} from "@bokehjs/models/graphics/decoration"
import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"
import {PlotActions, xy} from "#framework/interactive"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {Arc, Circle, MultiLine, Rect, Scatter, Segment} from "@bokehjs/models/glyphs"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {build_view} from "@bokehjs/core/build_views"
import {Plot} from "@bokehjs/models/plots"
import {FactorRange, Range1d} from "@bokehjs/models/ranges"
import {CategoricalScale} from "@bokehjs/models/scales"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {CustomJSTransform} from "@bokehjs/models/transforms/customjs_transform"
import {Text, TextView} from "@bokehjs/models/glyphs/text"
import {defer, delay} from "@bokehjs/core/util/defer"
import type * as p from "@bokehjs/core/properties"
import type {TextBox} from "@bokehjs/core/graphics"
import {logger} from "@bokehjs/core/logging"
import {show} from "@bokehjs/api/plotting"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {PlotView} from "@bokehjs/models/plots/plot_canvas"

function mkrenderer(glyph: Scatter): GlyphRenderer {
  const data_source = ColumnDataSource.create({
    data: {
      x: [10, 20, 30, 40],
      y: [1, 2, 3, 4],
      color: ["red", "green", "red", "green"],
      label: ["foo", "bar", "foo", "bar"],
    },
  })
  return GlyphRenderer.create({glyph, data_source})
}

describe("GlyphRenderer", () => {
  it("should attach both named and fractional Arc decorations", () => {
    const renderer = GlyphRenderer.create({glyph: Arc.create()})
    const decoration = renderer.add_path_decoration(NormalHead.create(), {node: "middle"})
    const fractional = renderer.add_path_markings(NormalHead.create(), {positions: [0.5]})
    expect(renderer.glyph.decorations).to.be.equal([decoration, fractional])
  })

  it("should reject unsupported path decorations without partially changing glyphs", () => {
    for (const renderer of [
      GlyphRenderer.create({glyph: Rect.create()}),
      GlyphRenderer.create({glyph: Segment.create(), selection_glyph: Rect.create()}),
    ]) {
      expect(() => renderer.add_path_markings(NormalHead.create(), {positions: [0.25]})).to.throw(Error)
      expect(renderer.glyph.decorations).to.be.equal([])
    }
  })

  it("should reject invalid fractions before attaching decorations", () => {
    const renderer = GlyphRenderer.create({glyph: Segment.create()})
    for (const placement of [-0.1, 1.1, NaN, Infinity]) {
      expect(() => renderer.add_path_markings(NormalHead.create(), {positions: [placement]})).to.throw(Error)
      expect(renderer.glyph.decorations).to.be.equal([])
    }
  })

  it("should add vectorized decorations with state-specific markings", () => {
    const glyph = MultiLine.create()
    const selection_glyph = MultiLine.create()
    const nonselection_glyph = MultiLine.create()
    const renderer = GlyphRenderer.create({
      data_source: ColumnDataSource.create({data: {inset: [12]}}),
      glyph,
      selection_glyph,
      nonselection_glyph,
    })
    const marking = NormalHead.create({fill_color: "gray"})
    const selection_marking = NormalHead.create({fill_color: "orange"})

    const decoration = renderer.add_path_decoration(marking, {
      node: "end",
      inset: {field: "inset"},
      selection_marking,
      nonselection_marking: null,
    })

    expect(glyph.decorations).to.be.equal([decoration])
    expect(decoration.inset).to.be.equal({field: "inset"})
    expect(selection_glyph.decorations.length).to.be.equal(1)
    assert(selection_glyph.decorations[0] instanceof PathDecoration)
    expect(selection_glyph.decorations[0].marking).to.be.equal(selection_marking)
    expect(selection_glyph.decorations[0].inset).to.be.equal({field: "inset"})
    expect(nonselection_glyph.decorations).to.be.equal([])
  })
})

describe("GlyphRendererView", () => {
  it("settles ready and bounds painting when renderers share a CDSView with different masks", async () => {
    const source = ColumnDataSource.create({data: {x: [0, 10], x2: [10, 0], y: [-0.4, 0.4]}})
    const shared = CDSView.create()
    const renderers = ["x", "x2"].map((field) => GlyphRenderer.create({
      glyph: Scatter.create({
        x: {field}, y: {field: "y"}, size: 20, line_color: null,
        fill_color: field == "x" ? "red" : "blue",
      }),
      data_source: source, view: shared,
    }))
    const x_range = Range1d.create({start: -1, end: 1})
    const plot = Plot.create({
      width: 300, height: 300, renderers, x_range,
      y_range: Range1d.create({start: -1, end: 1}),
    })
    using paints = restorable(sinon.spy(PlotView.prototype, "paint"))
    const el = document.createElement("div")
    document.body.append(el)
    const mounted = show(plot, el)
    try {
      // Bound the wait so a paint feedback regression fails and can be disposed.
      const settled = await Promise.race([mounted.ready.then(() => true), delay(5000).then(() => false)])
      expect(settled).to.be.true
      const view = mounted.views[0]
      const glyphs = renderers.map((renderer) => view.owner.get_one(renderer).glyph as ScatterView)
      const {ctx, pixel_ratio} = view.canvas_view.primary
      const pixel = (glyph: ScatterView, index: number) => [...ctx.getImageData(
        Math.round(glyph.sx[index]*pixel_ratio), Math.round(glyph.sy[index]*pixel_ratio), 1, 1,
      ).data]
      expect([...glyphs[0].mask_data().ones()]).to.be.equal([0])
      expect([...glyphs[1].mask_data().ones()]).to.be.equal([1])

      const expect_settled = async () => {
        const settled = await Promise.race([view.ready.then(() => true), delay(5000).then(() => false)])
        expect(settled).to.be.true
        const count = paints.callCount
        await delay(100)
        expect(paints.callCount).to.be.equal(count)
      }
      await expect_settled()
      expect(pixel(glyphs[0], 0)).to.be.equal([255, 0, 0, 255])
      expect(pixel(glyphs[1], 1)).to.be.equal([0, 0, 255, 255])
      expect(paints.callCount > 0 && paints.callCount < 10).to.be.true
      x_range.setv({start: 9, end: 11})
      await expect_settled()
      expect([...glyphs[0].mask_data().ones()]).to.be.equal([1])
      expect([...glyphs[1].mask_data().ones()]).to.be.equal([0])
      expect(pixel(glyphs[0], 1)).to.be.equal([255, 0, 0, 255])
      expect(pixel(glyphs[1], 0)).to.be.equal([0, 0, 255, 255])
      const count = paints.callCount
      source.patch({x: [[1, 10.5]]})
      await expect_settled()
      expect(pixel(glyphs[0], 1)).to.be.equal([255, 0, 0, 255])
      expect(paints.callCount > count).to.be.true
      expect(paints.callCount < 20).to.be.true
    } finally {
      await mounted.dispose()
      el.remove()
    }
  })

  // Fill red when the CDSView's published mask is exactly the given index, otherwise blue.
  function masked_color(view: CDSView, index: number): CustomJSTransform {
    return CustomJSTransform.create({args: {view}, v_func: `
      const color = view.masked != null && view.masked.count == 1 && view.masked.get(${index}) ? "red" : "blue"
      return xs.map(() => color)
    `})
  }

  // Mount a plot and return helpers that read canvas pixels and wait, with bounds, for painting to stop.
  async function mount_bounded(plot: Plot) {
    const paints = sinon.spy(PlotView.prototype, "paint")
    const el = document.createElement("div")
    document.body.append(el)
    const mounted = show(plot, el)
    const dispose = async () => {
      paints.restore()
      await mounted.dispose()
      el.remove()
    }
    // Bound waits so a paint feedback regression fails and can be disposed.
    const bounded = async (ready: Promise<void>) => {
      const settled = await Promise.race([ready.then(() => true), delay(5000).then(() => false)])
      expect(settled).to.be.true
      const count = paints.callCount
      await delay(100)
      expect(paints.callCount).to.be.equal(count)
    }
    try {
      await bounded(mounted.ready)
    } catch (error) {
      await dispose()
      throw error
    }
    const view = mounted.views[0]
    const settle = async () => bounded(view.ready)
    const pixel = (glyph: ScatterView, index: number) => {
      const {ctx, pixel_ratio} = view.canvas_view.primary
      const x = Math.round(glyph.sx[index]*pixel_ratio)
      const y = Math.round(glyph.sy[index]*pixel_ratio)
      return [...ctx.getImageData(x, y, 1, 1).data]
    }
    return {view, paints, settle, pixel, dispose}
  }

  it("paints mask-dependent visuals, including selection states, before ready resolves", async () => {
    const source = ColumnDataSource.create({data: {x: [0, 10], y: [0, 0]}})
    const cds_view = CDSView.create()
    const renderer = GlyphRenderer.create({
      glyph: Scatter.create({size: 20, line_color: null, fill_color: {field: "x", transform: masked_color(cds_view, 0)}}),
      data_source: source, view: cds_view,
    })
    const x_range = Range1d.create({start: -1, end: 11})
    const plot = Plot.create({width: 300, height: 300, renderers: [renderer], x_range, y_range: Range1d.create({start: -1, end: 1})})
    const {view, paints, settle, pixel, dispose} = await mount_bounded(plot)
    try {
      const glyph = view.owner.get_one(renderer).glyph as ScatterView
      const red = [255, 0, 0, 255]
      const blue = [0, 0, 255, 255]
      expect(pixel(glyph, 0)).to.be.equal(blue)
      expect(pixel(glyph, 1)).to.be.equal(blue)

      x_range.setv({start: -1, end: 1})
      await settle()
      expect(pixel(glyph, 0)).to.be.equal(red)

      x_range.setv({start: -1, end: 11})
      await settle()
      expect(pixel(glyph, 0)).to.be.equal(blue)
      expect(pixel(glyph, 1)).to.be.equal(blue)

      source.selected.indices = [0]
      await settle()
      x_range.setv({start: -1, end: 1})
      await settle()
      expect(pixel(glyph, 0)).to.be.equal(red)

      x_range.setv({start: -1, end: 11})
      await settle()
      expect(pixel(glyph, 0)).to.be.equal(blue)
      // The nonselected point is translucent, so it is blended with the background.
      const [r, g, b] = pixel(glyph, 1)
      expect(r == g && r < 255 && b == 255).to.be.true
      expect(paints.callCount < 20).to.be.true
    } finally {
      await dispose()
    }
  })

  it("paints each renderer with its own mask when renderers share a CDSView", async () => {
    const source = ColumnDataSource.create({data: {x: [0, 10], x2: [10, 0], y: [-0.4, 0.4]}})
    const shared = CDSView.create()
    const renderers = ["x", "x2"].map((field) => GlyphRenderer.create({
      glyph: Scatter.create({
        x: {field}, y: {field: "y"}, size: 20, line_color: null,
        fill_color: {field, transform: masked_color(shared, 0)},
      }),
      data_source: source, view: shared,
    }))
    const x_range = Range1d.create({start: -1, end: 1})
    const plot = Plot.create({width: 300, height: 300, renderers, x_range, y_range: Range1d.create({start: -1, end: 1})})
    const {view, paints, settle, pixel, dispose} = await mount_bounded(plot)
    try {
      const glyphs = renderers.map((renderer) => view.owner.get_one(renderer).glyph as ScatterView)
      const red = [255, 0, 0, 255]
      const blue = [0, 0, 255, 255]
      // The first renderer shows index 0 and the second index 1.
      expect(pixel(glyphs[0], 0)).to.be.equal(red)
      expect(pixel(glyphs[1], 1)).to.be.equal(blue)

      x_range.setv({start: 9, end: 11})
      await settle()
      expect(pixel(glyphs[0], 1)).to.be.equal(blue)
      expect(pixel(glyphs[1], 0)).to.be.equal(red)

      x_range.setv({start: -1, end: 1})
      await settle()
      expect(pixel(glyphs[0], 0)).to.be.equal(red)
      expect(pixel(glyphs[1], 1)).to.be.equal(blue)
      expect(paints.callCount < 20).to.be.true
    } finally {
      await dispose()
    }
  })

  describe("serializes lazy visual hooks of immediate masked updates", () => {
    async function setup() {
      const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
      const {view} = await display(Plot.create({renderers: [renderer]}))
      const grv = view.owner.get_one(renderer)
      let release!: () => void
      let fail!: (error: Error) => void
      const gate = new Promise<void>((resolve, reject) => {
        release = resolve
        fail = reject
      })
      const hook = sinon.stub(grv.glyph, "after_lazy_visuals").resolves()
      hook.onFirstCall().returns(gate)
      const set_visuals = sinon.spy(grv.glyph, "set_visuals")
      const set_data = sinon.spy(grv, "_set_data")
      const restore = () => {
        release()
        hook.restore()
        set_visuals.restore()
        set_data.restore()
      }
      // Publish a mask while idle, which applies visuals immediately and queues the lazy hooks.
      renderer.view.properties.masked.change.emit()
      let settled = false
      const ready = view.ready.then(() => settled = true, (error: unknown) => {
        settled = true
        throw error
      })
      return {renderer, view, grv, hook, set_visuals, set_data, release, fail, restore, ready, is_settled: () => settled}
    }

    it("and makes queued data preparation and ready wait for them", async () => {
      const {renderer, view, grv, hook, set_visuals, set_data, release, restore, ready, is_settled} = await setup()
      try {
        expect(set_visuals.callCount).to.be.equal(1)
        await defer()
        expect(hook.callCount).to.be.equal(1)
        renderer.data_source.patch({x: [[0, 11]]})
        // A further mask publication must not start overlapping hooks.
        renderer.view.properties.masked.change.emit()
        await defer()
        expect(set_data.callCount).to.be.equal(0)
        expect(hook.callCount).to.be.equal(1)
        expect(is_settled()).to.be.false
        release()
        await ready
        await view.ready
        expect(set_data.callCount).to.be.equal(1)
        expect([...(grv.glyph as ScatterView).x]).to.be.equal([11, 20, 30, 40])
      } finally {
        restore()
      }
    })

    it("and reports their failure once without blocking queued data preparation", async () => {
      const {renderer, view, grv, set_data, fail, restore, ready} = await setup()
      using log = restorable(sinon.spy(logger, "error"))
      try {
        await defer()
        renderer.data_source.patch({x: [[0, 11]]})
        await defer()
        expect(set_data.callCount).to.be.equal(0)
        const error = new Error("lazy visuals failure")
        fail(error)
        expect(await ready.catch((failure: unknown) => failure) === error).to.be.true
        expect(log.callCount).to.be.equal(1)
        await view.ready
        expect(set_data.callCount).to.be.equal(1)
        expect([...(grv.glyph as ScatterView).x]).to.be.equal([11, 20, 30, 40])
      } finally {
        restore()
      }
    })

    it("and skips queued data preparation and painting after removal", async () => {
      const {renderer, view, grv, set_data, release, restore} = await setup()
      using paint = restorable(sinon.spy(grv, "request_paint"))
      try {
        await defer()
        renderer.data_source.patch({x: [[0, 11]]})
        await defer()
        const ready = view.ready
        grv.remove()
        await ready
        release()
        await defer()
        expect(set_data.callCount).to.be.equal(0)
        expect(paint.callCount).to.be.equal(0)
      } finally {
        restore()
      }
    })
  })

  it("defers a reentrant masked notification during immediate visual application", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const {masked} = renderer.view.properties
    const set_visuals = grv.glyph.set_visuals.bind(grv.glyph)
    using stub = restorable(sinon.stub(grv.glyph, "set_visuals").callsFake((source, indices) => {
      set_visuals(source, indices)
      if (stub.callCount == 1) {
        masked.change.emit()
      }
    }))
    using visuals = restorable(sinon.spy(grv, "_set_visuals"))
    masked.change.emit()
    expect(stub.callCount).to.be.equal(1)
    await view.ready
    expect(visuals.callCount).to.be.equal(1)
    expect(stub.callCount).to.be.equal(2)
  })

  it("reports a coalesced failure once and recovers on the next source update", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const error = new Error("coalesced failure")
    const set_data = grv._set_data.bind(grv)
    using stub = restorable(sinon.stub(grv, "_set_data").callsFake(set_data))
    stub.onFirstCall().rejects(error)
    using log = restorable(sinon.spy(logger, "error"))
    renderer.data_source.patch({x: [[0, 11]]})
    renderer.data_source.patch({x: [[1, 22]]})
    grv.update_data([1])
    const errors = await Promise.all([grv.ready, view.ready].map((ready) => ready.catch((error: unknown) => error)))
    expect(errors[0] === error).to.be.true
    expect(errors[1] === error).to.be.true
    expect(log.callCount).to.be.equal(1)
    renderer.data_source.patch({x: [[2, 33]]})
    await view.ready
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([11, 22, 33, 40])
  })

  it("serializes masked visual updates behind active data preparation without feedback", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv._set_data.bind(grv)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(grv, "_set_data").callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    }))
    using visuals = restorable(sinon.spy(grv, "_set_visuals"))
    renderer.data_source.patch({x: [[0, 11]]})
    await active
    renderer.view.properties.masked.change.emit()
    await defer()
    expect(visuals.callCount).to.be.equal(1)
    release()
    await view.ready
    expect(stub.callCount).to.be.equal(1)
    expect(visuals.callCount).to.be.equal(2)
  })

  it("promotes queued visuals to a data pass and deduplicates patch indices", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using stub = restorable(sinon.stub(grv, "_set_data").resolves())
    using visuals = restorable(sinon.spy(grv, "_set_visuals"))
    grv.update_visuals()
    grv.update_data([2, 2])
    grv.update_data([1, 2])
    grv.update_visuals()
    await grv.ready
    expect(stub.callCount).to.be.equal(1)
    expect(stub.firstCall.args[0]).to.be.equal([2, 1])
    expect(visuals.callCount).to.be.equal(0)
  })

  it("serializes asynchronous text preparation so older labels cannot overwrite newer data", async () => {
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    class DelayedTextView extends TextView {
      protected override async _build_labels(text: p.Uniform<string | null>) {
        const labels = await super._build_labels(text)
        if (text.get(0) == "old") {
          started()
          await gate
        }
        return labels
      }
    }
    class DelayedText extends Text {
      override default_view = DelayedTextView
    }
    const source = ColumnDataSource.create({data: {x: [0], y: [0], text: ["initial"]}})
    const renderer = GlyphRenderer.create({
      glyph: DelayedText.create({x: {field: "x"}, y: {field: "y"}, text: {field: "text"}}),
      data_source: source,
    })
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using spy = restorable(sinon.spy(grv, "_set_data"))
    source.patch({text: [[0, "old"]]})
    await active
    let ready = false
    const completion = view.ready.then(() => ready = true)
    source.data = {x: [10, 20], y: [1, 2], text: ["new", "newer"]}
    source.patch({text: [[1, "latest"]]})
    await defer()
    expect(spy.callCount).to.be.equal(1)
    expect(ready).to.be.false
    release()
    await completion
    expect(spy.callCount).to.be.equal(2)
    const glyph = grv.glyph as TextView
    expect([...glyph.x]).to.be.equal([10, 20])
    expect(glyph.labels.map((label) => (label as TextBox).text)).to.be.equal(["new", "latest"])
    expect(glyph.data_size).to.be.equal(2)
  })

  it("updates transformed coordinates after consecutive patches and data replacement", async () => {
    const transform = CustomJSTransform.create({v_func: "return xs.map((x) => 2*x)"})
    const renderer = mkrenderer(Scatter.create({x: {field: "x", transform}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using spy = restorable(sinon.spy(grv, "_set_data"))
    renderer.data_source.patch({x: [[0, 11]]})
    renderer.data_source.patch({x: [[2, 33]]})
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([20, 40, 60, 80])
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([22, 40, 66, 80])
    renderer.data_source.patch({x: [[0, 12]]})
    renderer.data_source.data = {x: [5], y: [6]}
    await view.ready
    expect(spy.callCount).to.be.equal(2)
    expect(spy.lastCall.args[0]).to.be.undefined
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([10])
  })

  it("coalesces consecutive source notifications and renders their final filtered state", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const filter = IndexFilter.create({indices: [0, 2]})
    renderer.view.filter = filter
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using spy = restorable(sinon.spy(grv, "_set_data"))
    const source = renderer.data_source
    source.patch({x: [[0, 11]]})
    source.patch({y: [[2, 33]]})
    source.stream({x: [50], y: [5], color: ["red"], label: ["foo"]})
    source.patch({x: [[4, 55]]})
    filter.indices = [0, 2, 4]
    await view.ready
    expect(spy.callCount).to.be.equal(1)
    expect(spy.firstCall.args[0]).to.be.undefined
    const glyph = grv.glyph as ScatterView
    expect([...glyph.x]).to.be.equal([11, 30, 55])
    expect([...glyph.y]).to.be.equal([1, 33, 5])
  })

  it("merges partial indices and gives full updates precedence", async () => {
    const {view} = await display(Plot.create({renderers: [mkrenderer(Scatter.create())]}))
    const grv = view.owner.get_one(view.model.renderers[0] as GlyphRenderer)
    using stub = restorable(sinon.stub(grv, "_set_data").resolves())
    grv.update_data([0])
    grv.update_data([2, 0, 2])
    expect(stub.callCount).to.be.equal(0)
    await grv.ready
    expect(stub.callCount).to.be.equal(1)
    expect(stub.firstCall.args[0]).to.be.equal([0, 2])
    grv.update_data([1])
    grv.update_data()
    grv.update_data([3])
    await grv.ready
    expect(stub.callCount).to.be.equal(2)
    expect(stub.lastCall.args[0]).to.be.undefined
  })

  it("completes a queued source update after its active predecessor fails", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv._set_data.bind(grv)
    const error = new Error("first failure")
    let fail!: () => void
    using stub = restorable(sinon.stub(grv, "_set_data"))
    stub.callsFake(set_data)
    stub.onFirstCall().returns(new Promise<void>((_resolve, reject) => fail = () => reject(error)))
    renderer.data_source.patch({x: [[0, 11]]})
    await Promise.resolve()
    renderer.data_source.patch({x: [[1, 22]]})
    const completion = view.ready.catch((error: unknown) => error)
    fail()
    expect(await completion === error).to.be.true
    expect(stub.callCount).to.be.equal(2)
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([11, 22, 30, 40])
    await view.ready
  })

  it("drops ready tracking and skips queued work when removed behind a failing active pass", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    let fail!: () => void
    using stub = restorable(sinon.stub(grv, "_set_data"))
    stub.onFirstCall().returns(new Promise<void>((_resolve, reject) => fail = () => reject(new Error("removed failure"))))
    renderer.data_source.patch({x: [[0, 11]]})
    await Promise.resolve()
    renderer.data_source.patch({x: [[1, 22]]})
    grv.update_data([2])
    const ready = view.ready
    grv.remove()
    await ready
    await grv.ready
    expect(stub.callCount).to.be.equal(1)
    fail()
    await defer()
    expect(stub.callCount).to.be.equal(1)
    await view.ready
  })

  it("skips queued data work after removal", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using spy = restorable(sinon.spy(grv, "_set_data"))
    grv.update_data()
    grv.remove()
    await defer()
    expect(spy.callCount).to.be.equal(0)
  })

  it("does not request paint when removed during an active data pass", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv._set_data.bind(grv)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(grv, "_set_data").callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    }))
    using paint = restorable(sinon.spy(grv, "request_paint"))
    renderer.data_source.patch({x: [[0, 99]]})
    await active
    grv.update_data([1])
    const ready = view.ready
    grv.remove()
    await ready
    release()
    await defer()
    expect(stub.callCount).to.be.equal(1)
    expect(paint.callCount).to.be.equal(0)
    await view.ready
  })

  it("tracks an active pass and a later failed source update through ready, then recovers", async () => {
    const transform = CustomJSTransform.create({v_func: `
      if (xs[0] == 99) {
        throw new Error("invalid coordinate")
      }
      return xs.map((x) => 2*x)
    `})
    const renderer = mkrenderer(Scatter.create({x: {field: "x", transform}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv._set_data.bind(grv)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(grv, "_set_data"))
    stub.callsFake(set_data)
    stub.onFirstCall().callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    })

    renderer.data_source.patch({x: [[0, 11]]})
    await active
    let settled = false
    const completion = view.ready.then(() => {
      settled = true
      return null
    }, (error: unknown) => {
      settled = true
      return error
    })
    renderer.data_source.patch({x: [[0, 99]]})
    await defer()
    expect(stub.callCount).to.be.equal(1)
    expect(settled).to.be.false
    release()
    expect(await completion).to.be.instanceof(Error)
    expect(stub.callCount).to.be.equal(2)

    renderer.data_source.patch({x: [[0, 12]]})
    await view.ready
    expect(stub.callCount).to.be.equal(3)
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([24, 40, 60, 80])
    await view.ready
  })

  // Basic case with no all glyphs going to their defaults
  async function make_grv() {
    const basic_circle = Scatter.create({fill_color: "red"})
    const glyph_renderer = mkrenderer(basic_circle)
    const grv = await build_view(
      glyph_renderer,
      {parent: await build_view(Plot.create())},
    )
    return grv
  }

  describe("get_reference_point", () => {
    it("should return 0 if no field, value is passed", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point(null)
      expect(index).to.be.equal(0)
    })

    it("should return 0 if field not in column data source", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("milk", "bar")
      expect(index).to.be.equal(0)
    })

    it("should return correct index if field and value in column data source", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("label", "bar")
      expect(index).to.be.equal(1)
    })

    it("should return 0 index if field in column data source but value not available", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("label", "baz")
      expect(index).to.be.equal(0)
    })
  })

  it("should have default selection_glyph equal to main glyph", async () => {
    const {glyph, selection_glyph} = await make_grv()
    expect(selection_glyph.model.attributes).to.be.equal(glyph.model.attributes)
  })

  it("should have default nonselection_glyph with 0.2 alpha", async () => {
    const {nonselection_glyph} = await make_grv()
    expect((nonselection_glyph.model as Scatter).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have undefined hover_glyph if renderer hover_glyph is null", async () => {
    const grv = await make_grv()
    expect(grv.model.hover_glyph).to.be.null
    expect(grv.hover_glyph).to.be.undefined
  })

  it("should have default muted_glyph with 0.2 alpha", async () => {
    const {muted_glyph} = await make_grv()
    expect((muted_glyph.model as Scatter).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have default decimated_glyph with 0.3 line alpha and color grey", async () => {
    const {decimated_glyph} = await make_grv()
    expect((decimated_glyph.model as Scatter).line_alpha).to.be.equal({value: 0.3})
    expect((decimated_glyph.model as Scatter).line_color).to.be.equal({value: "grey"})
  })

  it("should call set_data() once when working with FactorRange", async () => {
    const x_range = FactorRange.create({factors: ["a", "b", "c"]})
    const y_range = FactorRange.create({factors: ["u", "v", "w"]})

    const x_scale = CategoricalScale.create()
    const y_scale = CategoricalScale.create()

    const data_source = ColumnDataSource.create({
      data: {
        x: ["a", "b", "c"],
        y: ["u", "v", "w"],
      },
    })
    const gr = GlyphRenderer.create({glyph: Circle.create({radius: 0.5}), data_source})

    const bare = {toolbar_location: null, title: null, min_border: 0}
    const p = Plot.create({width: 300, height: 300, x_range, y_range, x_scale, y_scale, renderers: [gr], ...bare})

    using spy = restorable(sinon.spy(GlyphRendererView.prototype, "_set_data"))
    const {view} = await display(p)

    const actions = new PlotActions(view, {units: "screen"})
    await actions.pan(xy(100, 100), xy(200, 200))

    expect(spy.callCount).to.be.equal(1) // only initial set_data()
  })
})
