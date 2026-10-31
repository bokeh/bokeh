import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {build_view} from "@bokehjs/core/build_views"

import type {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import type {PatchesView} from "@bokehjs/models/glyphs/patches"
import {Patches} from "@bokehjs/models/glyphs/patches"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Selection} from "@bokehjs/models/selections/selection"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {PolyEditToolView} from "@bokehjs/models/tools/edit/poly_edit_tool"
import {PolyEditTool} from "@bokehjs/models/tools/edit/poly_edit_tool"

import {make_pan_event, make_tap_event, make_move_event, make_key_event} from "./_util"

export interface PolyEditTestCase {
  data: {[key: string]: (number[] | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PolyEditToolView
  glyph_view: PatchesView
  glyph_renderer: GlyphRenderer<Patches>
  vertex_glyph_view: ScatterView
  vertex_source: ColumnDataSource
  vertex_renderer: GlyphRenderer
}

async function make_testcase(data: PolyEditTestCase["data"] = {
  xs: [[0, 0.5, 1], [0, 0.5, 1]],
  ys: [[0, -0.5, -1], [0, -0.5, -1]],
  z: [null, null],
}): Promise<PolyEditTestCase> {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = Plot.create({
    x_range: Range1d.create({start: -1, end: 1}),
    y_range: Range1d.create({start: -1, end: 1}),
  })

  const {view: plot_view} = await display(plot)

  const data_source = ColumnDataSource.create({data})
  const vertex_source = ColumnDataSource.create({data: {x: [], y: []}})

  const glyph = Patches.create({
    xs: {field: "xs"},
    ys: {field: "ys"},
  })
  const vertex_glyph = Scatter.create({
    x: {field: "x"},
    y: {field: "y"},
  })

  const glyph_renderer = GlyphRenderer.create({glyph, data_source})
  const glyph_renderer_view = await build_view(glyph_renderer, {parent: plot_view})
  sinon.stub(glyph_renderer_view, "set_data")

  const vertex_renderer = GlyphRenderer.create({glyph: vertex_glyph, data_source: vertex_source})
  const vertex_renderer_view = await build_view(vertex_renderer, {parent: plot_view})

  const draw_tool = PolyEditTool.create({
    active: true,
    default_overrides: {z: "Test"},
    renderers: [glyph_renderer],
    vertex_renderer,
  })
  plot.add_tools(draw_tool)
  await plot_view.ready

  const draw_tool_view = plot_view.owner.get_one(draw_tool)
  plot_view.renderer_views.set(glyph_renderer, glyph_renderer_view)
  plot_view.renderer_views.set(vertex_renderer, vertex_renderer_view)

  return {
    data,
    data_source,
    draw_tool_view,
    glyph_view: glyph_renderer_view.glyph as PatchesView,
    glyph_renderer,
    vertex_glyph_view: vertex_renderer_view.glyph as ScatterView,
    vertex_source,
    vertex_renderer,
  }
}

describe("PolyEditTool", (): void => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool0 = PolyEditTool.create()
      expect(tool0.tooltip).to.be.equal("Poly Edit Tool")

      const tool1 = PolyEditTool.create({description: "My Poly Edit"})
      expect(tool1.tooltip).to.be.equal("My Poly Edit")
    })
  })

  describe("View", () => {

    it("should select patches on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      hit_test_stub.returns(Selection.create({indices: [1]}))
      vertex_hit_test_stub.returns(null)

      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1])
    })

    it("should select multiple patches on shift-tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      vertex_hit_test_stub.returns(null)
      hit_test_stub.returns(Selection.create({indices: [1]}))
      let tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)
      hit_test_stub.returns(Selection.create({indices: [0]}))
      tap_event = make_tap_event(560, 560, true)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([0, 1])
    })

    it("should edit the same first hit when polygons overlap", async () => {
      const testcase = await make_testcase({
        xs: [[-0.5, 0.5, 0.5, -0.5], [-0.4, 0.6, 0.6, -0.4]],
        ys: [[-0.5, -0.5, 0.5, 0.5], [-0.4, -0.4, 0.6, 0.6]],
        z: [null, null],
      })
      const {draw_tool_view: tool, glyph_view, data_source, vertex_source} = testcase
      const {x_scale, y_scale} = glyph_view.renderer.coordinates
      const sx = x_scale.compute(0)
      const sy = y_scale.compute(0)
      glyph_view.map_data()
      const hit = glyph_view.hit_test({type: "point", sx, sy})!
      expect(hit.indices).to.be.equal([0, 1])
      tool._press(make_tap_event(sx, sy))
      expect(tool._cur_index).to.be.equal(0)
      expect(vertex_source.get_array("x")).to.be.equal([-0.5, 0.5, 0.5, -0.5])
      await testcase.vertex_glyph_view.renderer.set_data()
      testcase.vertex_glyph_view.map_data()
      const vx = x_scale.compute(-0.5)
      const vy = y_scale.compute(-0.5)
      tool._pan_start(make_pan_event(vx, vy))
      tool._pan_end(make_pan_event(vx + 10, vy + 10))
      expect(data_source.get_array<number[]>("xs")[0][0]).to.be.equal(x_scale.invert(vx + 10))
      expect(data_source.get_array<number[]>("ys")[0][0]).to.be.equal(y_scale.invert(vy + 10))
      expect(data_source.get_array<number[]>("xs")[1]).to.be.equal([-0.4, 0.6, 0.6, -0.4])
      expect(data_source.get_array<number[]>("ys")[1]).to.be.equal([-0.4, -0.4, 0.6, 0.6])
    })

    it("should keep the existing first-hit snap priority for overlapping vertices", async () => {
      const testcase = await make_testcase({
        xs: [[-0.5, 0.001, 0.002, 0.5]],
        ys: [[-0.5, 0.001, 0.002, -0.5]],
        z: [null],
      })
      const {glyph_view, vertex_glyph_view, draw_tool_view: tool} = testcase
      glyph_view.map_data()
      const {x_scale, y_scale} = glyph_view.renderer.coordinates
      tool._press(make_tap_event(x_scale.compute(0), y_scale.compute(-0.25)))
      await vertex_glyph_view.renderer.set_data()
      vertex_glyph_view.map_data()
      const sx = x_scale.compute(0.002)
      const sy = y_scale.compute(0.002)
      expect(vertex_glyph_view.hit_test({type: "point", sx, sy})!.indices).to.be.equal([1, 2])
      expect(tool._snap_to_vertex(make_tap_event(sx, sy), 0.002, 0.002)).to.be.equal([0.001, 0.001])
      expect(testcase.vertex_source.selected.indices).to.be.equal([])
    })

    it("should replace shift-selected membership with the polygon pressed for editing", async () => {
      const testcase = await make_testcase({
        xs: [[-0.5, 0, 0.5], [-0.25, 0.25, 0.75]],
        ys: [[-0.5, 0.5, -0.5], [-0.25, 0.75, -0.25]],
        z: [null, null],
      })
      const {draw_tool_view: tool, glyph_view, vertex_glyph_view, data_source, vertex_source} = testcase
      const hits = sinon.stub(glyph_view, "hit_test")
      const vertex_hits = sinon.stub(vertex_glyph_view, "hit_test").returns(null)
      hits.returns(Selection.create({indices: [1]}))
      tool._tap(make_tap_event(300, 300))
      hits.returns(Selection.create({indices: [0]}))
      tool._tap(make_tap_event(300, 300, true))
      expect(data_source.selected.indices).to.be.equal([0, 1])
      hits.returns(Selection.create({indices: [1]}))
      tool._press(make_tap_event(300, 300))
      expect(tool._cur_index).to.be.equal(1)
      expect(data_source.selected.indices).to.be.equal([1])
      expect(vertex_source.get_array("x")).to.be.equal([-0.25, 0.25, 0.75])
      expect(vertex_source.get_array("y")).to.be.equal([-0.25, 0.75, -0.25])
      vertex_hits.returns(Selection.create({indices: [1]}))
      tool._pan_start(make_pan_event(300, 300))
      tool._pan_end(make_pan_event(310, 310))
      const {x_scale, y_scale} = glyph_view.renderer.coordinates
      const dx = x_scale.invert(310) - x_scale.invert(300)
      const dy = y_scale.invert(310) - y_scale.invert(300)
      expect(data_source.get_array<number[]>("xs")[1]).to.be.equal([-0.25, 0.25 + dx, 0.75])
      expect(data_source.get_array<number[]>("ys")[1]).to.be.equal([-0.25, 0.75 + dy, -0.25])
      expect(data_source.get_array<number[]>("xs")[0]).to.be.equal([-0.5, 0, 0.5])
      expect(data_source.get_array<number[]>("ys")[0]).to.be.equal([-0.5, 0.5, -0.5])
    })

    for (const action of ["drag", "delete"]) {
      it(`should ${action} shift-selected vertices without changing other vertices`, async () => {
        const xs = Array.from({length: 12}, (_, i) => i/20)
        const ys = Array.from({length: 12}, (_, i) => -i/20)
        const testcase = await make_testcase({xs: [[-0.9, -0.8, -0.7], xs.slice()], ys: [[0, 0.1, 0], ys.slice()], z: [null, null]})
        const {draw_tool_view: tool, glyph_view, vertex_glyph_view, data_source} = testcase
        sinon.stub(glyph_view, "hit_test").returns(Selection.create({indices: [1]}))
        const hits = sinon.stub(vertex_glyph_view, "hit_test").returns(null)
        tool._press(make_tap_event(300, 300))
        hits.returns(Selection.create({indices: [10]}))
        tool._tap(make_tap_event(300, 300))
        hits.returns(Selection.create({indices: [2]}))
        tool._tap(make_tap_event(300, 300, true))
        expect(testcase.vertex_source.selected.indices).to.be.equal([2, 10])
        if (action == "drag") {
          const {x_scale, y_scale} = glyph_view.renderer.coordinates
          const dx = x_scale.invert(310) - x_scale.invert(300)
          const dy = y_scale.invert(310) - y_scale.invert(300)
          tool._pan_start(make_pan_event(300, 300))
          tool._pan_end(make_pan_event(310, 310))
          expect(data_source.get_array<number[]>("xs")[1]).to.be.equal(xs.map((x, i) => x + (i == 2 || i == 10 ? dx : 0)))
          expect(data_source.get_array<number[]>("ys")[1]).to.be.equal(ys.map((y, i) => y + (i == 2 || i == 10 ? dy : 0)))
        } else {
          tool._keyup(make_key_event("Backspace"))
          expect(data_source.get_array<number[]>("xs")[1]).to.be.equal(xs.filter((_, i) => i != 2 && i != 10))
          expect(data_source.get_array<number[]>("ys")[1]).to.be.equal(ys.filter((_, i) => i != 2 && i != 10))
        }
        expect(data_source.get_array<number[]>("xs")[0]).to.be.equal([-0.9, -0.8, -0.7])
        expect(data_source.get_array<number[]>("ys")[0]).to.be.equal([0, 0.1, 0])
        expect(testcase.vertex_source.selected.indices).to.be.equal([])
      })
    }

    it("should delete selected patch on delete key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      hit_test_stub.returns(Selection.create({indices: [1]}))
      vertex_hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event("Backspace")
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data).to.be.equal({
        xs: [[0, 0.5, 1]],
        ys: [[0, -0.5, -1]],
        z: [null],
      })
    })

    it("should clear selection on escape key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      vertex_hit_test_stub.returns(null)
      hit_test_stub.returns(Selection.create({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event("Escape")
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data).to.be.equal(testcase.data)
    })

    it("should show vertices on press", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      sinon.stub(testcase.vertex_glyph_view, "hit_test").returns(null)

      hit_test_stub.returns(Selection.create({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event)

      expect(testcase.vertex_source.data).to.be.equal({
        x: testcase.data.xs[1] as any, // XXX: null
        y: testcase.data.ys[1] as any, // XXX: null
      })
      expect(testcase.draw_tool_view._selected_renderer).to.be.equal(testcase.glyph_renderer)
    })

    it("should select vertex on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      vertex_hit_test_stub.returns(null)
      hit_test_stub.returns(Selection.create({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event)
      vertex_hit_test_stub.returns(Selection.create({indices: [1]}))
      testcase.draw_tool_view._tap(tap_event)
      expect(testcase.vertex_source.selected.indices).to.be.equal([1])
    })

    it("should delete selected vertex on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      vertex_hit_test_stub.returns(null)
      hit_test_stub.returns(Selection.create({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event)

      vertex_hit_test_stub.returns(Selection.create({indices: [1]}))
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event("Backspace")
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.vertex_source.selected.indices).to.be.equal([])
      expect(testcase.vertex_source.data).to.be.equal({
        x: [0, 1],
        y: [0, -1],
      })
      expect(testcase.data_source.data).to.be.equal({
        xs: [[0, 0.5, 1], [0, 1]],
        ys: [[0, -0.5, -1], [0, -1]],
        z: [null, null],
      })
    })

    it("should drag vertex on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      hit_test_stub.returns(Selection.create({indices: [1]}))
      vertex_hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event)
      vertex_hit_test_stub.returns(Selection.create({indices: [1]}))
      const panstart_event = make_pan_event(300, 300)
      testcase.draw_tool_view._pan_start(panstart_event)
      const pan_event = make_pan_event(290, 290)
      testcase.draw_tool_view._pan(pan_event)
      testcase.draw_tool_view._pan_end(pan_event)

      expect(testcase.vertex_source.selected.indices).to.be.equal([])
      expect(testcase.vertex_source.data).to.be.equal({
        x: [0, 0.4646017699115044, 1],
        y: [0, -0.4661016949152542, -1],
      })
      expect(testcase.data_source.data).to.be.equal({
        xs: [[0, 0.5, 1], [0, 0.4646017699115044, 1]],
        ys: [[0, -0.5, -1], [0, -0.4661016949152542, -1]],
        z: [null, null],
      })
    })

    it("should add vertex on press", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      hit_test_stub.returns(Selection.create({indices: [1]}))
      vertex_hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event) // Poly selected
      vertex_hit_test_stub.returns(Selection.create({indices: [1]}))
      testcase.draw_tool_view._press(tap_event) // Vertex selected
      vertex_hit_test_stub.returns(Selection.create({indices: [2]}))
      testcase.draw_tool_view._press(make_tap_event(290, 290)) // Add new vertex

      const xs = [0, 0.5, 0.04424778761061947, 1]
      const ys = [0, -0.5, -0, -1]
      expect(testcase.vertex_source.selected.indices).to.be.equal([])
      expect(testcase.vertex_source.data).to.be.equal({
        x: xs,
        y: ys,
      })
      expect(testcase.data_source.data).to.be.equal({
        xs: [[0, 0.5, 1], xs],
        ys: [[0, -0.5, -1], ys],
        z: [null, null],
      })
    })

    it("should add vertex on tap after press ", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test")

      hit_test_stub.returns(Selection.create({indices: [1]}))
      vertex_hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._press(tap_event) // Poly selected
      vertex_hit_test_stub.returns(Selection.create({indices: [1]}))
      testcase.draw_tool_view._press(tap_event) // Vertex selected
      vertex_hit_test_stub.returns(Selection.create({indices: [2]}))
      const tap_event2 = make_tap_event(290, 290)
      const moveenter_event = make_move_event(290, 290)
      const key_event = make_key_event("Escape")
      testcase.draw_tool_view._tap(tap_event2) // Add new vertex
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(key_event) // Stop editing

      const xs = [0, 0.5, 0.04424778761061947, 1]
      const ys = [0, -0.5, -0, -1]
      expect(testcase.vertex_source.selected.indices).to.be.equal([])
      expect(testcase.vertex_source.data).to.be.equal({
        x: xs,
        y: ys,
      })
      expect(testcase.data_source.data).to.be.equal({
        xs: [[0, 0.5, 1], xs],
        ys: [[0, -0.5, -1], ys],
        z: [null, null],
      })
    })
  })
})
