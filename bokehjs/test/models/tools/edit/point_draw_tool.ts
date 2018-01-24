import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_1d_hit_test_result} from "core/hittest"

import {Circle, CircleView} from "models/glyphs/circle"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PointDrawTool, PointDrawToolView, BkEv} from "models/tools/edit/point_draw_tool"

const utils = require("../../../utils")

export interface PointDrawTestCase {
  data: {[key: string]: (number | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PointDrawToolView
  glyph_view: CircleView
}

const make_testcase = function(): PointDrawTestCase {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  });

  const plot_view: any = new plot.default_view({model: plot, parent: null});
  plot_view.layout();

  const plot_canvas_view = plot_view.plot_canvas_view;

  const data = {x: [0, 0.5, 1], y: [0, 0.5, 1], z: [null, null, null]};
  const data_source = new ColumnDataSource({data: data});

  const glyph = new Circle({
    x: {field: "x"},
    y: {field: "y"},
    size: {units: "screen", value: 20},
  });

  const glyph_renderer = new GlyphRenderer({
    glyph: glyph,
    data_source: data_source,
  });

  // Untyped to access GlyphView
  const glyph_renderer_view: any = new glyph_renderer.default_view({
    model: glyph_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view,
  });

  const draw_tool = new PointDrawTool({
    renderers: [glyph_renderer],
    active: true,
    empty_value: "Test",
  });
  plot.add_tools(draw_tool);
  const draw_tool_view = plot_canvas_view.tool_views[draw_tool.id];
  plot_canvas_view.renderer_views[glyph_renderer.id] = glyph_renderer_view;

  return {
    data: data,
    data_source: data_source,
    draw_tool_view: draw_tool_view,
    glyph_view: glyph_renderer_view.glyph,
  }
}

const make_event = function(sx: number, sy: number, shift: boolean = false, keyCode: number = 0): BkEv {
  return {"bokeh": {sx: sx, sy: sy}, "srcEvent": {shiftKey: shift}, keyCode: keyCode, shiftKey: shift}
}

describe("PointDrawTool", (): void => {

  describe("View", function(): void {

    afterEach(function(): void {
      utils.unstub_canvas();
    });

    beforeEach(function(): void {
      utils.stub_canvas();
    });

    it("should select point on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple point on shift-tap", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);
      hit_test_stub.returns(create_1d_hit_test_result([[2, 0]]));
      tap_event = make_event(560, 560, true);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([1, 2]);
    });

    it("should add point on tap", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(null);
      const tap_event: BkEv = make_event(300, 200);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data['x']).to.be.deep.equal([0, 0.5, 1, 0.04424778761061947]);
      expect(testcase.data_source.data['y']).to.be.deep.equal([0, 0.5, 1, 0.3389830508474576]);
    });

    it("should insert empty_value on other columns", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(null);
      const tap_event = make_event(300, 200);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null, null, 'Test']);
    });

    it("should delete selected on delete key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const keyup_event = make_event(300, 300, false, Keys.Delete);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data['x']).to.be.deep.equal([0, 1]);
      expect(testcase.data_source.data['y']).to.be.deep.equal([0, 1]);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should clear selection on escape key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = make_event(560, 560);
      testcase.draw_tool_view._tap(tap_event);

      const keyup_event = make_event(300, 300, false, Keys.Esc);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data).to.be.deep.equal(testcase.data);
    });

    it("should drag point on pan", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let drag_event = make_event(300, 300);
      testcase.draw_tool_view._pan_start(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan_end(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.equal(null);
      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 1]);
      expect(testcase.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1]);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });

    it("should drag all selected points on pan", function(): void {
      const testcase = make_testcase()
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      hit_test_stub.returns(create_1d_hit_test_result([[2, 0]]));
      let drag_event = make_event(300, 300, true);
      testcase.draw_tool_view._pan_start(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan_end(drag_event);
      expect(testcase.draw_tool_view._basepoint).to.be.equal(null);
      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 0.6460176991150443]);
      expect(testcase.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1.3389830508474576]);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });
  })
});
