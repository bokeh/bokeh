import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_1d_hit_test_result} from "core/hittest"

import {Patches, PatchesView} from "models/glyphs/patches"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PolyDrawTool, PolyDrawToolView, BkEv} from "models/tools/edit/poly_draw_tool"

const utils = require("../../../utils")

export interface PolyDrawTestCase {
  data: {[key: string]: (number[] | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PolyDrawToolView
  glyph_view: PatchesView
}

const make_testcase = function(): PolyDrawTestCase {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1})
  });

  const plot_view: any = new plot.default_view({model: plot, parent: null});
  plot_view.layout();

  const plot_canvas_view = plot_view.plot_canvas_view;

  const data = {
    xs: [[0, 0.5, 1], [0, 0.5, 1]],
    ys: [[0, -0.5, -1], [0, -0.5, -1]],
    z: [null, null]
  };
  const data_source = new ColumnDataSource({data: data});

  const glyph = new Patches({
    xs: {field: "xs"},
    ys: {field: "ys"},
  });

  const glyph_renderer = new GlyphRenderer({
    glyph: glyph,
    data_source: data_source
  });

  const glyph_renderer_view: any = new glyph_renderer.default_view({
    model: glyph_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view
  });

  const draw_tool = new PolyDrawTool({
    active: true,
    empty_value: "Test",
    renderers: [glyph_renderer]
  });
  plot.add_tools(draw_tool);
  const draw_tool_view = plot_canvas_view.tool_views[draw_tool.id];
  plot_canvas_view.renderer_views[glyph_renderer.id] = glyph_renderer_view;
  sinon.stub(glyph_renderer_view, "set_data");

  return {
    data: data,
    data_source: data_source,
    draw_tool_view: draw_tool_view,
    glyph_view: glyph_renderer_view.glyph
  }
}

const make_event = function(sx: number, sy: number, shift: boolean = false, keyCode: number = 0): BkEv {
  return {"bokeh": {sx: sx, sy: sy}, "srcEvent": {shiftKey: shift}, keyCode: keyCode, shiftKey: shift}
}

describe("PolyDrawTool", (): void => {

  describe("View", function(): void {

    afterEach(function(): void {
      utils.unstub_canvas();
    });

    beforeEach(function(): void {
      utils.stub_canvas();
    });

    it("should select patches on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));

      const tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple patches on shift-tap", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));

      let tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);
      hit_test_stub.returns(create_1d_hit_test_result([[0, 0]]));
      tap_event = make_event(560, 560, true);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([1, 0]);
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
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1]]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1]]);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null]);
    });

    it("should clear selection on escape key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));

      const tap_event = make_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const keyup_event = make_event(300, 300, false, Keys.Esc);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(testcase.data_source.data).to.be.deep.equal(testcase.data);
    });

    it("should draw patch on pan", function(): void {
      const testcase = make_testcase();
      sinon.stub(testcase.glyph_view, "hit_test");

      let drag_event = make_event(300, 300);
      testcase.draw_tool_view._pan_start(drag_event);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1], [0, 0.5, 1], [0.04424778761061947, -0.30973451327433627]];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], [-0, 0.3389830508474576]];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
    });

    it("should insert empty_value on other columns", function(): void {
      const testcase = make_testcase();
      sinon.stub(testcase.glyph_view, "hit_test");

      let drag_event = make_event(300, 300);
      testcase.draw_tool_view._pan_start(drag_event);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan(drag_event);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null, "Test"]);
    });

    it("should extend existing patch on shift-pan", function(): void {
      const testcase = make_testcase();
      sinon.stub(testcase.glyph_view, "hit_test");

      let drag_event = make_event(300, 300, true);
      testcase.draw_tool_view._pan_start(drag_event);

      drag_event = make_event(200, 200);
      testcase.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1], [0, 0.5, 1, -0.30973451327433627]];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1, 0.3389830508474576]];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should extend selected patch on shift-pan", function(): void {
      const testcase = make_testcase();
      sinon.stub(testcase.glyph_view, "hit_test");

      testcase.data_source.selected["1d"].indices = [0];
      let drag_event = make_event(300, 300, true);
      testcase.draw_tool_view._pan_start(drag_event);

      drag_event = make_event(200, 200, false);
      testcase.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1, -0.30973451327433627], [0, 0.5, 1]];
      const ydata = [[0, -0.5, -1, 0.3389830508474576], [0, -0.5, -1]];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null]);
    });
  })
});
