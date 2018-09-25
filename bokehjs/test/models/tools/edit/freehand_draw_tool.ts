import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_hit_test_result_from_hits} from "core/hittest"

import {Patches, PatchesView} from "models/glyphs/patches"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {FreehandDrawTool, FreehandDrawToolView} from "models/tools/edit/freehand_draw_tool"

import {make_gesture_event, make_tap_event, make_key_event, make_move_event} from "./utils"

export interface FreehandDrawTestCase {
  data: {[key: string]: (number[] | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: FreehandDrawToolView
  glyph_view: PatchesView
}

const make_testcase = function(): FreehandDrawTestCase {
  // Note default plot dimensions is 600 x 600 (height x width)
  const plot = new Plot({
    x_range: new Range1d({start: -1, end: 1}),
    y_range: new Range1d({start: -1, end: 1}),
  });

  const plot_view: any = new plot.default_view({model: plot, parent: null});
  plot_view.layout();

  const plot_canvas_view = plot_view.plot_canvas_view;

  const data = {
    xs: [[0, 0.5, 1], [0, 0.5, 1]],
    ys: [[0, -0.5, -1], [0, -0.5, -1]],
    z: [null, null],
  };
  const data_source = new ColumnDataSource({data: data});

  const glyph = new Patches({
    xs: {field: "xs"},
    ys: {field: "ys"},
  });

  const glyph_renderer: any = new GlyphRenderer({
    glyph: glyph,
    data_source: data_source,
  });

  const glyph_renderer_view: any = new glyph_renderer.default_view({
    model: glyph_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view,
  });

  const draw_tool = new FreehandDrawTool({
    active: true,
    empty_value: "Test",
    renderers: [glyph_renderer],
  });
  plot.add_tools(draw_tool);
  const draw_tool_view: FreehandDrawToolView = plot_canvas_view.tool_views[draw_tool.id];
  plot_canvas_view.renderer_views[glyph_renderer.id] = glyph_renderer_view;
  sinon.stub(glyph_renderer_view, "set_data");

  return {
    data: data,
    data_source: data_source,
    draw_tool_view: draw_tool_view,
    glyph_view: glyph_renderer_view.glyph,
  }
}

describe("FreehandDrawTool", (): void => {

  describe("Model", function(): void {

    it("should create proper tooltip", function(): void {
      const tool = new FreehandDrawTool()
      expect(tool.tooltip).to.be.equal('Freehand Draw Tool')

      const custom_tool = new FreehandDrawTool({custom_tooltip: 'Freehand Draw Custom'})
      expect(custom_tool.tooltip).to.be.equal('Freehand Draw Custom')
    });
  })

  describe("View", function(): void {

    it("should select patches on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));

      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([1]);
    });

    it("should select multiple patches on shift-tap", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));

      let tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);
      hit_test_stub.returns(create_hit_test_result_from_hits([[0, 0]]));
      tap_event = make_tap_event(560, 560, true);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([0, 1]);
    });

    it("should delete selected on delete key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));

      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event(Keys.Backspace);
      testcase.draw_tool_view._move_enter(moveenter_event);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1]]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1]]);
      expect(testcase.data_source.data['z']).to.be.deep.equal([null]);
    });

    it("should clear selection on escape key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));

      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const moveenter_event = make_move_event(300, 300)
      const keyup_event = make_key_event(Keys.Esc);
      testcase.draw_tool_view._move_enter(moveenter_event);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.data_source.data).to.be.deep.equal(testcase.data);
    });

    it("should draw patch on drag", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(null);
      testcase.draw_tool_view._pan_start(make_gesture_event(300, 300));
      testcase.draw_tool_view._pan(make_gesture_event(290, 290));
      testcase.draw_tool_view._pan_end(make_gesture_event(290, 290));
      const new_xs = [0.04424778761061947, 0.008849557522123894, 0.008849557522123894];
      const new_ys = [-0, 0.03389830508474576, 0.03389830508474576];
      const xdata = [[0, 0.5, 1], [0, 0.5, 1], new_xs];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], new_ys];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
    });

    it("should draw and pop patch on drag", function(): void {
      const testcase = make_testcase();
      testcase.draw_tool_view.model.num_objects = 1
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(null);
      testcase.draw_tool_view._pan_start(make_gesture_event(300, 300));
      testcase.draw_tool_view._pan(make_gesture_event(290, 290));
      testcase.draw_tool_view._pan_end(make_gesture_event(290, 290));

      const xdata = [[0.04424778761061947, 0.008849557522123894, 0.008849557522123894]];
      const ydata = [[-0, 0.03389830508474576, 0.03389830508474576]];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
    });

    it("should insert empty_value on other columns", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");

      hit_test_stub.returns(null);
      testcase.draw_tool_view._pan_start(make_gesture_event(300, 300));
      testcase.draw_tool_view._pan(make_gesture_event(290, 290));
      testcase.draw_tool_view._pan_end(make_gesture_event(290, 290));

      expect(testcase.data_source.data['z']).to.be.deep.equal([null, null, "Test"]);
    });

    it("should not draw poly on doubletap when tool inactive", function(): void {
      const testcase = make_testcase();
      testcase.draw_tool_view.model.active = false;

      testcase.draw_tool_view._pan_start(make_gesture_event(300, 300));
      testcase.draw_tool_view._pan(make_gesture_event(290, 290));
      testcase.draw_tool_view._pan_end(make_gesture_event(290, 290));

      const xdata = [[0, 0.5, 1], [0, 0.5, 1]];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1]];
      expect(testcase.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(testcase.data_source.data['ys']).to.be.deep.equal(ydata);
    });
  })
});
