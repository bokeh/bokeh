import * as sinon from "sinon"

import {expect} from "assertions"
import {display} from "../../../_util"

import {build_view} from "@bokehjs/core/build_views"

import type {RectView} from "@bokehjs/models/glyphs/rect"
import {Rect} from "@bokehjs/models/glyphs/rect"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Selection} from "@bokehjs/models/selections/selection"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {BoxEditToolView} from "@bokehjs/models/tools/edit/box_edit_tool"
import {BoxEditTool} from "@bokehjs/models/tools/edit/box_edit_tool"

import {make_pan_event, make_tap_event, make_move_event, make_key_event} from "./_util"

export interface BoxEditTestCase {
  data: {[key: string]: unknown[]}
  data_source: ColumnDataSource
  draw_tool_view: BoxEditToolView
  glyph_view: RectView
}

async function make_testcase(): Promise<BoxEditTestCase> {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  })

  const {view: plot_view} = await display(plot)

  const data = {
    x: [0, 0.5, 1],
    y: [0, 0.5, 1],
    width: [0.1, 0.2, 0.3],
    height: [0.3, 0.2, 0.1],
    a: [null, null, null],
    b: ["a", "b", "c"],
    c: [100, 200, 300],
    d: [{d: 1}, {d: 2}, {d: 3}],
  }
  const data_source = new ColumnDataSource({data, default_values: {b: "d"}})

  const glyph = new Rect({
    x: {field: "x"},
    y: {field: "y"},
    width: {field: "width"},
    height: {field: "height"},
  })

  const glyph_renderer = new GlyphRenderer({glyph, data_source})
  const glyph_renderer_view = await build_view(glyph_renderer, {parent: plot_view})

  const draw_tool = new BoxEditTool({
    active: true,
    default_overrides: {c: 400},
    empty_value: "Foo",
    renderers: [glyph_renderer as any],
  })
  plot.add_tools(draw_tool)
  await plot_view.ready

  const draw_tool_view = plot_view.owner.get_one(draw_tool)
  plot_view.renderer_views.set(glyph_renderer, glyph_renderer_view)

  return {
    data,
    data_source,
    draw_tool_view,
    glyph_view: glyph_renderer_view.glyph as RectView,
  }
}

describe("BoxEditTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool0 = new BoxEditTool()
      expect(tool0.tooltip).to.be.equal("Box Edit Tool")

      const tool1 = new BoxEditTool({description: "My Box Edit"})
      expect(tool1.tooltip).to.be.equal("My Box Edit")
    })
  })

  describe("View", () => {

    it("should select rect on tap", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      expect(testcase.data_source.selected.indices).to.be.equal([1])
    })

    it("should select multiple rect on shift-tap", async () => {
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

    it("should delete selected on delete key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event("Backspace")
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      const {selected, data} = testcase.data_source
      expect(selected.indices).to.be.equal([])
      expect(data).to.be.equal({
        x: [0, 1],
        y: [0, 1],
        width: [0.1, 0.3],
        height: [0.3, 0.1],
        a: [null, null],
        b: ["a", "c"],
        c: [100, 300],
        d: [{d: 1}, {d: 3}],
      })
    })

    it("should clear selection on escape key", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event("Escape")
      testcase.draw_tool_view._move_enter(moveenter_event)
      testcase.draw_tool_view._keyup(keyup_event)

      expect(testcase.data_source.selected.indices).to.be.equal([])
      expect(testcase.data_source.data).to.be.equal(testcase.data)
    })

    it("should drag selected on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")

      hit_test_stub.returns(new Selection({indices: [1]}))
      const tap_event = make_tap_event(300, 300)
      testcase.draw_tool_view._tap(tap_event)

      let drag_event = make_pan_event(300, 300)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([300, 300])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.equal([200, 200])

      drag_event = make_pan_event(200, 200)
      testcase.draw_tool_view._pan_end(drag_event)
      expect(testcase.draw_tool_view._basepoint).to.be.null
      const {data} = testcase.data_source
      expect(data).to.be.equal({
        x: [0, 0.14601769911504425, 1],
        y: [0, 0.8389830508474576, 1],
        width: [0.1, 0.2, 0.3],
        height: [0.3, 0.2, 0.1],
        a: [null, null, null],
        b: ["a", "b", "c"],
        c: [100, 200, 300],
        d: [{d: 1}, {d: 2}, {d: 3}],
      })
    })

    it("should draw box on pan", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(null)

      let drag_event = make_pan_event(300, 300, true)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      drag_event = make_pan_event(200, 200, true)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      testcase.draw_tool_view._pan_end(drag_event)

      expect(testcase.draw_tool_view._draw_basepoint).to.be.null
      const {selected, data} = testcase.data_source
      expect(selected.indices).to.be.equal([])
      expect(data).to.be.equal({
        x: [0, 0.5, 1, -0.1327433628318584],
        y: [0, 0.5, 1, 0.1694915254237288],
        width: [0.1, 0.2, 0.3, 0.35398230088495575],
        height: [0.3, 0.2, 0.1, 0.3389830508474576],
        a: [null, null, null, null],
        b: ["a", "b", "c", "d"],
        c: [100, 200, 300, 400],
        d: [{d: 1}, {d: 2}, {d: 3}, "Foo"],
      })
    })

    it("should draw and pop box on pan", async () => {
      const testcase = await make_testcase()
      testcase.draw_tool_view.model.num_objects = 3
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(null)

      let drag_event = make_pan_event(300, 300, true)
      testcase.draw_tool_view._pan_start(drag_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      drag_event = make_pan_event(200, 200, true)
      testcase.draw_tool_view._pan(drag_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      testcase.draw_tool_view._pan_end(drag_event)

      expect(testcase.draw_tool_view._draw_basepoint).to.be.null
      const {selected, data} = testcase.data_source
      expect(selected.indices).to.be.equal([])
      expect(data).to.be.equal({
        x: [0.5, 1, -0.1327433628318584],
        y: [0.5, 1, 0.1694915254237288],
        width: [0.2, 0.3, 0.35398230088495575],
        height: [0.2, 0.1, 0.3389830508474576],
        a: [null, null, null],
        b: ["b", "c", "d"],
        c: [200, 300, 400],
        d: [{d: 2}, {d: 3}, "Foo"],
      })
    })

    it("should draw box on press and move", async () => {
      const testcase = await make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test")
      hit_test_stub.returns(null)

      const tap_event1 = make_tap_event(300, 300, true)
      testcase.draw_tool_view._press(tap_event1)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      const move_event = make_move_event(200, 200)
      testcase.draw_tool_view._move(move_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.equal([300, 300])
      const tap_event2 = make_tap_event(200, 200, true)
      testcase.draw_tool_view._press(tap_event2)

      expect(testcase.draw_tool_view._draw_basepoint).to.be.null
      const {selected, data} = testcase.data_source
      expect(selected.indices).to.be.equal([])
      expect(data).to.be.equal({
        x: [0, 0.5, 1, -0.1327433628318584],
        y: [0, 0.5, 1, 0.1694915254237288],
        width: [0.1, 0.2, 0.3, 0.35398230088495575],
        height: [0.3, 0.2, 0.1, 0.3389830508474576],
        a: [null, null, null, null],
        b: ["a", "b", "c", "d"],
        c: [100, 200, 300, 400],
        d: [{d: 1}, {d: 2}, {d: 3}, "Foo"],
      })
    })

    it("should not draw box on press when tool inactive", async () => {
      const testcase = await make_testcase()
      testcase.draw_tool_view.model.active = false

      const tap_event = make_tap_event(300, 300, true)
      testcase.draw_tool_view._press(tap_event)
      expect(testcase.draw_tool_view._draw_basepoint).to.be.undefined
    })
  })
})
