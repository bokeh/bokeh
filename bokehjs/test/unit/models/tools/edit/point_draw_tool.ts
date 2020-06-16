import {expect} from "assertions"
import * as sinon from "sinon"

import {Keys} from "@bokehjs/core/dom"
import {build_view} from "@bokehjs/core/build_views"

import {Circle, CircleView} from "@bokehjs/models/glyphs/circle"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Selection} from "@bokehjs/models/selections/selection"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {PointDrawTool, PointDrawToolView} from "@bokehjs/models/tools/edit/point_draw_tool"

import {make_pan_event, make_tap_event, make_move_event, make_key_event} from "./utils"

export interface PointDrawTestCase {
  data: {[key: string]: (number | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PointDrawToolView
  glyph_view: CircleView
}

async function make_testcase(): Promise<PointDrawTestCase> {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  })

  const plot_view = (await build_view(plot)).build()

  const data = {x: [0, 0.5, 1], y: [0, 0.5, 1], z: [null, null, null]}
  const data_source = new ColumnDataSource({data})

  const glyph = new Circle({
    x: {field: "x"},
    y: {field: "y"},
    size: {units: "screen", value: 20},
  })

  const glyph_renderer = new GlyphRenderer({glyph, data_source})
  const glyph_renderer_view = await build_view(glyph_renderer, {parent: plot_view})

  const draw_tool = new PointDrawTool({
    active: true,
    empty_value: "Test",
    renderers: [glyph_renderer as any],
  })
  plot.add_tools(draw_tool)
  await plot_view.ready

  const draw_tool_view = plot_view.tool_views.get(draw_tool)! as PointDrawToolView
  plot_view.renderer_views.set(glyph_renderer, glyph_renderer_view)

  return {
    data,
    data_source,
    draw_tool_view,
    glyph_view: glyph_renderer_view.glyph as CircleView,
  }
}

describe("PointDrawTool", (): void => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new PointDrawTool()
      expect(tool.tooltip).to.be.equal('Point Draw Tool')

      const custom_tool = new PointDrawTool({custom_tooltip: 'Point Draw Custom'})
      expect(custom_tool.tooltip).to.be.equal('Point Draw Custom')
    })
  })

  describe("View", () => {

    it("should select point on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1])
    })

    it("should select multiple point on shift-tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      let tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)
      hit_test_stub.returns(new Selection({indices: [2]}))
      tap_event = make_tap_event(560, 560, true)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1, 2])
    })

    it("should add point on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 200)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0, 0.5, 1, 0.04424778761061947])
      expect(testcase.data_source.data.y).to.be.equal([0, 0.5, 1, 0.3389830508474576])
    })

    it("should add and pop point on tap", async () => {
      const testcase = await make_testcase()
      testcase.draw_tool_view.model.num_objects = 3
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 200)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0.5, 1, 0.04424778761061947])
      expect(testcase.data_source.data.y).to.be.equal([0.5, 1, 0.3389830508474576])
    })

    it("should insert empty_value on other columns", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      const tap_event = make_tap_event(300, 200)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.data.z).to.be.equal([null, null, null, 'Test'])
    })

    it("should delete selected on delete key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event(Keys.Backspace)
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0, 1])
      expect(testcase.data_source.data.y).to.be.equal([0, 1])
      expect(testcase.data_source.data.z).to.be.equal([null, null])
    })

    it("should clear selection on escape key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(560, 560)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event(Keys.Esc)
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data).to.be.equal(testcase.data)
    })

    it("should drag point on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      let drag_event = make_pan_event(300, 300)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([300, 300])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([200, 200])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan_end(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.null
      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0, 0.14601769911504425, 1])
      expect(testcase.data_source.data.y).to.be.equal([0, 0.8389830508474576, 1])
      expect(testcase.data_source.data.z).to.be.equal([null, null, null])
    })

    it("should drag previously selected on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      hit_test_stub.returns(null)
      let drag_event = make_pan_event(300, 300)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([300, 300])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([200, 200])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan_end(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.null
      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0, 0.14601769911504425, 1])
      expect(testcase.data_source.data.y).to.be.equal([0, 0.8389830508474576, 1])
      expect(testcase.data_source.data.z).to.be.equal([null, null, null])
    })

    it("should drag all selected points on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      hit_test_stub.returns(new Selection({indices: [2]}))
      let drag_event = make_pan_event(300, 300, true)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([300, 300])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([200, 200])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan_end(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.null
      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data.x).to.be.equal([0, 0.14601769911504425, 0.6460176991150443])
      expect(testcase.data_source.data.y).to.be.equal([0, 0.8389830508474576, 1.3389830508474576])
      expect(testcase.data_source.data.z).to.be.equal([null, null, null])
    })
  })
})
