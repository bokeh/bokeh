import {expect} from "assertions"
import * as sinon from "sinon"

import {Keys} from "@bokehjs/core/dom"
import {build_view} from "@bokehjs/core/build_views"
import {NumberArray} from '@bokehjs/core/types'

import {Patches, PatchesView} from "@bokehjs/models/glyphs/patches"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Selection} from "@bokehjs/models/selections/selection"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {PolyDrawTool, PolyDrawToolView} from "@bokehjs/models/tools/edit/poly_draw_tool"

import {make_pan_event, make_tap_event, make_move_event, make_key_event} from "./utils"

export interface PolyDrawTestCase {
  data: {[key: string]: (number[] | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PolyDrawToolView
  glyph_view: PatchesView
}

async function make_testcase(): Promise<PolyDrawTestCase> {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  })

  const plot_view = (await build_view(plot)).build()

  const data = {
    xs: [[0, 0.5, 1], [0, 0.5, 1]],
    ys: [[0, -0.5, -1], [0, -0.5, -1]],
    z: [null, null],
  }
  const data_source = new ColumnDataSource({data})

  const glyph = new Patches({
    xs: {field: "xs"},
    ys: {field: "ys"},
  })

  const glyph_renderer = new GlyphRenderer({glyph, data_source})
  const glyph_renderer_view = await build_view(glyph_renderer, {parent: plot_view})

  const draw_tool = new PolyDrawTool({
    active: true,
    empty_value: "Test",
    renderers: [glyph_renderer as any],
  })
  plot.add_tools(draw_tool)
  await plot_view.ready

  const draw_tool_view = plot_view.tool_views.get(draw_tool)! as PolyDrawToolView
  plot_view.renderer_views.set(glyph_renderer, glyph_renderer_view)
  sinon.stub(glyph_renderer_view, "set_data")

  return {
    data,
    data_source,
    draw_tool_view,
    glyph_view: glyph_renderer_view.glyph as PatchesView,
  }
}

describe("PolyDrawTool", (): void => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new PolyDrawTool()
      expect(tool.tooltip).to.be.equal('Polygon Draw Tool')

      const custom_tool = new PolyDrawTool({custom_tooltip: 'Poly Draw Custom'})
      expect(custom_tool.tooltip).to.be.equal('Poly Draw Custom')
    })
  })

  describe("View", () => {

    it("should select patches on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(new Selection({indices: [1]}))

      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1])
    })

    it("should select multiple patches on shift-tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(new Selection({indices: [1]}))

      let tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)
      hit_test_stub.returns(new Selection({indices: [0]}))
      tap_event = make_tap_event(560, 560, true)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1, 0])
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
      expect(testcase.data_source.data.xs).to.be.equal([[0, 0.5, 1]])
      expect(testcase.data_source.data.ys).to.be.equal([[0, -0.5, -1]])
      expect(testcase.data_source.data.z).to.be.equal([null])
    })

    it("should clear selection on escape key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(new Selection({indices: [1]}))

      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event(Keys.Esc)
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data).to.be.equal(testcase.data)
    })

    it("should drag selected patch on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const start_event = make_pan_event(300, 300)
      testcase.draw_tool_view._pan_start(start_event)
      const pan_event = make_pan_event(290, 290)
      testcase.draw_tool_view._pan(pan_event)
      testcase.draw_tool_view._pan_end(pan_event)

      const xdata = [[0, 0.5, 1], [-0.035398230088495575, 0.4646017699115044, 0.9646017699115044]]
      const ydata = [[0, -0.5, -1], [0.03389830508474576, -0.4661016949152542, -0.9661016949152542]]
      expect(testcase.data_source.data.xs).to.be.equal(xdata)
      expect(testcase.data_source.data.ys).to.be.equal(ydata)
    })

    it("should drag previously selected patch on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      const start_event1 = make_tap_event(300, 300)
      hit_test_stub.returns(new Selection({indices: [0]}))
      testcase.draw_tool_view._tap(start_event1)
      const start_event2 = make_pan_event(300, 300)
      hit_test_stub.returns(new Selection({indices: [1]}))
      testcase.draw_tool_view._pan_start(start_event2)
      const pan_event = make_pan_event(290, 290)
      testcase.draw_tool_view._pan(pan_event)
      testcase.draw_tool_view._pan_end(pan_event)

      const xdata = [[-0.035398230088495575, 0.4646017699115044, 0.9646017699115044],
                     [-0.035398230088495575, 0.4646017699115044, 0.9646017699115044]]
      const ydata = [[0.03389830508474576, -0.4661016949152542, -0.9661016949152542],
                     [0.03389830508474576, -0.4661016949152542, -0.9661016949152542]]
      expect(testcase.data_source.data.xs).to.be.equal(xdata)
      expect(testcase.data_source.data.ys).to.be.equal(ydata)
    })

    it("should draw patch on doubletap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      testcase.draw_tool_view._doubletap(make_tap_event(300, 300))
      testcase.draw_tool_view._tap(make_tap_event(250, 250))
      testcase.draw_tool_view._doubletap(make_tap_event(200, 200))

      const new_xs = [0.04424778761061947, -0.13274336283185842, -0.30973451327433627]
      const new_ys = [-0, 0.1694915254237288, 0.3389830508474576]
      const xdata = [[0, 0.5, 1], [0, 0.5, 1], new_xs]
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], new_ys]
      expect(testcase.data_source.data.xs).to.be.equal(xdata)
      expect(testcase.data_source.data.ys).to.be.equal(ydata)
    })

    it("should draw and pop patch on doubletap", async () => {
      const testcase = await make_testcase()
      testcase.draw_tool_view.model.num_objects = 2
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      testcase.draw_tool_view._doubletap(make_tap_event(300, 300))
      testcase.draw_tool_view._tap(make_tap_event(250, 250))
      testcase.draw_tool_view._doubletap(make_tap_event(200, 200))

      const new_xs = [0.04424778761061947, -0.13274336283185842, -0.30973451327433627]
      const new_ys = [-0, 0.1694915254237288, 0.3389830508474576]
      const xdata = [[0, 0.5, 1], new_xs]
      const ydata = [[0, -0.5, -1], new_ys]
      expect(testcase.data_source.data.xs).to.be.equal(xdata)
      expect(testcase.data_source.data.ys).to.be.equal(ydata)
    })

    it("should draw patch despite typed array data", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      testcase.draw_tool_view._doubletap(make_tap_event(300, 300))
      testcase.data_source.data.xs[2] = NumberArray.from(testcase.data_source.data.xs[2])
      testcase.data_source.data.ys[2] = NumberArray.from(testcase.data_source.data.ys[2])
      testcase.draw_tool_view._tap(make_tap_event(250, 250))
      testcase.draw_tool_view._doubletap(make_tap_event(200, 200))

      const new_xs = [0.044247787445783615, -0.13274335861206055, -0.30973451327433627]
      const xdata = [[0, 0.5, 1], [0, 0.5, 1], new_xs]
      expect(testcase.data_source.data.xs).to.be.similar(xdata)

      const new_ys = [0, 0.16949152946472168, 0.3389830508474576]
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], new_ys]
      expect(testcase.data_source.data.ys).to.be.similar(ydata)
    })

    it("should end draw patch on escape", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      testcase.draw_tool_view._doubletap(make_tap_event(300, 300))
      testcase.draw_tool_view._tap(make_tap_event(250, 250))
      testcase.draw_tool_view._move_enter(make_move_event(0, 0))
      testcase.draw_tool_view._keyup(make_key_event(Keys.Esc))

      const new_xs = [0.04424778761061947, -0.13274336283185842]
      const new_ys = [-0, 0.1694915254237288]
      const xdata = [[0, 0.5, 1], [0, 0.5, 1], new_xs]
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], new_ys]
      expect(testcase.data_source.data.xs).to.be.equal(xdata)
      expect(testcase.data_source.data.ys).to.be.equal(ydata)
    })

    it("should insert empty_value on other columns", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(null)
      testcase.draw_tool_view._doubletap(make_tap_event(300, 300))

      expect(testcase.data_source.data.z).to.be.equal([null, null, "Test"])
    })

    it("should not draw poly on doubletap when tool inactive", async () => {
      const testcase = await make_testcase()
      testcase.draw_tool_view.model.active = false

      const tap_event = make_tap_event(300, 300, true)
      testcase.draw_tool_view._doubletap(tap_event)
      expect(testcase.draw_tool_view._drawing).to.be.false
    })
  })
})
