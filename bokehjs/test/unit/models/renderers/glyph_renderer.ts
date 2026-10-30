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
import {FactorRange} from "@bokehjs/models/ranges"
import {CategoricalScale} from "@bokehjs/models/scales"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {CustomJSTransform} from "@bokehjs/models/transforms/customjs_transform"
import {Text, TextView} from "@bokehjs/models/glyphs/text"
import {defer} from "@bokehjs/core/util/defer"
import type * as p from "@bokehjs/core/properties"
import type {TextBox} from "@bokehjs/core/graphics"

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
    using spy = restorable(sinon.spy(grv, "set_data"))
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
    using spy = restorable(sinon.spy(grv, "set_data"))
    renderer.data_source.patch({x: [[0, 11]]})
    renderer.data_source.patch({x: [[2, 33]]})
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
    using spy = restorable(sinon.spy(grv, "set_data"))
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

  it("shares completion, merges partial indices, and gives full updates precedence", async () => {
    const {view} = await display(Plot.create({renderers: [mkrenderer(Scatter.create())]}))
    const grv = view.owner.get_one(view.model.renderers[0] as GlyphRenderer)
    using stub = restorable(sinon.stub(grv, "set_data").resolves())
    const first = grv.update_data([0])
    expect(grv.update_data([2])).to.be.equal(first)
    expect(stub.callCount).to.be.equal(0)
    await first
    expect(stub.firstCall.args[0]).to.be.equal([0, 2])
    const partial = grv.update_data([1])
    expect(grv.update_data()).to.be.equal(partial)
    expect(grv.update_data([3])).to.be.equal(partial)
    await partial
    expect(stub.lastCall.args[0]).to.be.undefined
  })

  it("retains updates during an active pass and recovers after failure", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    let release!: () => void
    using stub = restorable(sinon.stub(grv, "set_data"))
    stub.onFirstCall().returns(new Promise<void>((_resolve, reject) => release = () => reject(new Error("first failure"))))
    stub.onSecondCall().rejects(new Error("data failure"))
    stub.resolves()
    const first = grv.update_data([0])
    const first_error = first.catch((error: Error) => error)
    await Promise.resolve()
    const second = grv.update_data([1])
    expect(first === second).to.be.false
    expect(stub.callCount).to.be.equal(1)
    release()
    const error = await second.catch((error: Error) => error)
    expect(error).to.be.instanceof(Error)
    expect(await first_error).to.be.instanceof(Error)
    await grv.update_data([2])
    expect(stub.callCount).to.be.equal(3)
    expect(stub.lastCall.args[0]).to.be.equal([2])
  })

  it("keeps ready pending until source-driven data work completes", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv.set_data.bind(grv)
    let release!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    using stub = restorable(sinon.stub(grv, "set_data").callsFake(async (indices) => {
      await gate
      await set_data(indices)
    }))
    renderer.data_source.patch({x: [[0, 99]]})
    let ready = false
    const completion = view.ready.then(() => ready = true)
    await Promise.resolve()
    await Promise.resolve()
    expect(stub.callCount).to.be.equal(1)
    expect(ready).to.be.false
    release()
    await completion
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([99, 20, 30, 40])
  })

  it("completes a queued source update after its active predecessor fails", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv.set_data.bind(grv)
    let fail!: () => void
    using stub = restorable(sinon.stub(grv, "set_data"))
    stub.callsFake(set_data)
    stub.onFirstCall().returns(new Promise<void>((_resolve, reject) => fail = () => reject(new Error("first failure"))))
    renderer.data_source.patch({x: [[0, 11]]})
    await Promise.resolve()
    renderer.data_source.patch({x: [[1, 22]]})
    const completion = view.ready.catch((error: unknown) => error)
    fail()
    expect(await completion).to.be.instanceof(Error)
    expect(stub.callCount).to.be.equal(2)
    expect([...(grv.glyph as ScatterView).x]).to.be.equal([11, 22, 30, 40])
    await view.ready
  })

  it("drops ready tracking and skips queued work when removed behind a failing active pass", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    let fail!: () => void
    using stub = restorable(sinon.stub(grv, "set_data"))
    stub.onFirstCall().returns(new Promise<void>((_resolve, reject) => fail = () => reject(new Error("removed failure"))))
    renderer.data_source.patch({x: [[0, 11]]})
    await Promise.resolve()
    renderer.data_source.patch({x: [[1, 22]]})
    const queued = grv.update_data([2])
    const ready = view.ready
    grv.remove()
    await ready
    await grv.ready
    expect(stub.callCount).to.be.equal(1)
    fail()
    await queued
    expect(stub.callCount).to.be.equal(1)
    await view.ready
  })

  it("skips queued data work after removal", async () => {
    const renderer = mkrenderer(Scatter.create())
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    using spy = restorable(sinon.spy(grv, "set_data"))
    const pending = grv.update_data()
    grv.remove()
    await pending
    expect(spy.callCount).to.be.equal(0)
  })

  it("does not request paint when removed during an active data pass", async () => {
    const renderer = mkrenderer(Scatter.create({x: {field: "x"}, y: {field: "y"}}))
    const {view} = await display(Plot.create({renderers: [renderer]}))
    const grv = view.owner.get_one(renderer)
    const set_data = grv.set_data.bind(grv)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(grv, "set_data").callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    }))
    using paint = restorable(sinon.spy(grv, "request_paint"))
    renderer.data_source.patch({x: [[0, 99]]})
    await active
    const completion = grv.update_data([1])
    const ready = view.ready
    grv.remove()
    await ready
    release()
    await completion
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
    const set_data = grv.set_data.bind(grv)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(grv, "set_data"))
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

    using spy = restorable(sinon.spy(GlyphRendererView.prototype, "set_data"))
    const {view} = await display(p)

    const actions = new PlotActions(view, {units: "screen"})
    await actions.pan(xy(100, 100), xy(200, 200))

    expect(spy.callCount).to.be.equal(1) // only initial set_data()
  })
})
