import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_hit_test_result_from_hits} from "core/hittest"

import {Circle, CircleView} from "models/glyphs/circle"
import {Patches, PatchesView} from "models/glyphs/patches"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PolyEditTool, PolyEditToolView} from "models/tools/edit/poly_edit_tool"

import {make_gesture_event, make_tap_event, make_move_event, make_key_event} from "./utils"

export interface PolyEditTestCase {
  data: {[key: string]: (number[] | null)[]}
  data_source: ColumnDataSource
  draw_tool_view: PolyEditToolView
  glyph_view: PatchesView
  glyph_renderer: GlyphRenderer
  vertex_glyph_view: CircleView
  vertex_source: ColumnDataSource
  vertex_renderer: GlyphRenderer
}

const make_testcase = function(): PolyEditTestCase {
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
  const vertex_source = new ColumnDataSource({data: {x: [], y: []}});

  const vertex_glyph = new Circle({
    x: {field: "x"},
    y: {field: "y"},
  });
  const glyph = new Patches({
    xs: {field: "xs"},
    ys: {field: "ys"},
  });

  const vertex_renderer: any = new GlyphRenderer({
    glyph: vertex_glyph,
    data_source: vertex_source,
  });

  const glyph_renderer: any = new GlyphRenderer({
    glyph: glyph,
    data_source: data_source,
  });

  // Untyped to access GlyphView
  const glyph_renderer_view: any = new glyph_renderer.default_view({
    model: glyph_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view,
  });
  sinon.stub(glyph_renderer_view, "set_data");

  // Untyped to access GlyphView
  const vertex_renderer_view: any = new vertex_renderer.default_view({
    model: vertex_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view,
  });


  const draw_tool = new PolyEditTool({
    active: true,
    empty_value: "Test",
    renderers: [glyph_renderer],
    vertex_renderer: vertex_renderer,
  });
  plot.add_tools(draw_tool);
  const draw_tool_view = plot_canvas_view.tool_views[draw_tool.id];
  plot_canvas_view.renderer_views[glyph_renderer.id] = glyph_renderer_view;
  plot_canvas_view.renderer_views[vertex_renderer.id] = vertex_renderer_view;

  return {
    data: data,
    data_source: data_source,
    draw_tool_view: draw_tool_view,
    glyph_view: glyph_renderer_view.glyph,
    glyph_renderer: glyph_renderer,
    vertex_glyph_view: vertex_renderer_view.glyph,
    vertex_source: vertex_source,
    vertex_renderer: vertex_renderer,
  }
}

describe("PolyEditTool", (): void => {

  describe("Model", function(): void {

    it("should create proper tooltip", function(): void {
      const tool = new PolyEditTool()
      expect(tool.tooltip).to.be.equal('Poly Edit Tool')

      const custom_tool = new PolyEditTool({custom_tooltip: 'Poly Edit Custom'})
      expect(custom_tool.tooltip).to.be.equal('Poly Edit Custom')
    });
  })

  describe("View", function(): void {

    it("should select patches on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      vertex_hit_test_stub.returns(null);

      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([1]);
    });


    it("should select multiple patches on shift-tap", function() {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      vertex_hit_test_stub.returns(null);
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      let tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);
      hit_test_stub.returns(create_hit_test_result_from_hits([[0, 0]]));
      tap_event = make_tap_event(560, 560, true);
      testcase.draw_tool_view._tap(tap_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([0, 1]);
    });

    it("should delete selected patch on delete key", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      vertex_hit_test_stub.returns(null);
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const moveenter_event = make_move_event(300, 300);
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
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      vertex_hit_test_stub.returns(null);
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._tap(tap_event);

      const moveenter_event = make_move_event(300, 300);
      const keyup_event = make_key_event(Keys.Esc);
      testcase.draw_tool_view._move_enter(moveenter_event);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.data_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.data_source.data).to.be.deep.equal(testcase.data);
    });

    it("should show vertices on doubletap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      sinon.stub(testcase.vertex_glyph_view, "hit_test").returns(null);

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event);

      expect(testcase.vertex_source.data.x).to.be.deep.equal(testcase.data.xs[1]);
      expect(testcase.vertex_source.data.y).to.be.deep.equal(testcase.data.ys[1]);
      expect(testcase.draw_tool_view._selected_renderer).to.be.equal(testcase.glyph_renderer);
    });

    it("should select vertex on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      vertex_hit_test_stub.returns(null);
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      testcase.vertex_renderer.view.compute_indices();
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      testcase.draw_tool_view._tap(tap_event);
      expect(testcase.vertex_source.selected.indices).to.be.deep.equal([1]);
    });

    it("should delete selected vertex on tap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      vertex_hit_test_stub.returns(null);
      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      testcase.vertex_renderer.view.compute_indices();

      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      testcase.draw_tool_view._tap(tap_event);

      const moveenter_event = make_move_event(300, 300);
      const keyup_event = make_key_event(Keys.Backspace);
      testcase.draw_tool_view._move_enter(moveenter_event);
      testcase.draw_tool_view._keyup(keyup_event);

      expect(testcase.vertex_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.vertex_source.data.x).to.be.deep.equal([0, 1]);
      expect(testcase.vertex_source.data.y).to.be.deep.equal([0, -1]);
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], [0, 1]]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], [0, -1]]);
      expect(testcase.data_source.data.z).to.be.deep.equal([null, null]);
    });

    it("should drag vertex on pan", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      vertex_hit_test_stub.returns(null);
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      testcase.vertex_renderer.view.compute_indices();
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      const panstart_event = make_gesture_event(300, 300);
      testcase.draw_tool_view._pan_start(panstart_event);
      const pan_event = make_gesture_event(290, 290);
      testcase.draw_tool_view._pan(pan_event);
      testcase.draw_tool_view._pan_end(pan_event);

      expect(testcase.vertex_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.vertex_source.data.x).to.be.deep.equal([0, 0.4646017699115044, 1]);
      expect(testcase.vertex_source.data.y).to.be.deep.equal([0, -0.4661016949152542, -1]);
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], [0, 0.4646017699115044, 1]]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], [0, -0.4661016949152542, -1]]);
      expect(testcase.data_source.data.z).to.be.deep.equal([null, null]);
    });

    it("should add vertex on doubletap", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      vertex_hit_test_stub.returns(null);
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event); // Poly selected
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      testcase.vertex_renderer.view.compute_indices();
      testcase.draw_tool_view._doubletap(tap_event); // Vertex selected
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[2, 0]]));
      testcase.draw_tool_view._doubletap(make_tap_event(290, 290)); // Add new vertex

      const xs = [0, 0.5, 0.04424778761061947, 1];
      const ys = [0, -0.5, -0, -1];
      expect(testcase.vertex_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.vertex_source.data.x).to.be.deep.equal(xs);
      expect(testcase.vertex_source.data.y).to.be.deep.equal(ys);
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], xs]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], ys]);
      expect(testcase.data_source.data.z).to.be.deep.equal([null, null]);
    });

    it("should add vertex on tap after doubletap ", function(): void {
      const testcase = make_testcase();
      const hit_test_stub = sinon.stub(testcase.glyph_view, "hit_test");
      const vertex_hit_test_stub = sinon.stub(testcase.vertex_glyph_view, "hit_test");

      hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      vertex_hit_test_stub.returns(null);
      const tap_event = make_tap_event(300, 300);
      testcase.draw_tool_view._doubletap(tap_event); // Poly selected
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[1, 0]]));
      testcase.vertex_renderer.view.compute_indices();
      testcase.draw_tool_view._doubletap(tap_event); // Vertex selected
      vertex_hit_test_stub.returns(create_hit_test_result_from_hits([[2, 0]]));
      const tap_event2 = make_tap_event(290, 290);
      const moveenter_event = make_move_event(290, 290);
      const key_event = make_key_event(Keys.Esc);
      testcase.draw_tool_view._tap(tap_event2); // Add new vertex
      testcase.draw_tool_view._move_enter(moveenter_event);
      testcase.draw_tool_view._keyup(key_event); // Stop editing

      const xs = [0, 0.5, 0.04424778761061947, 1];
      const ys = [0, -0.5, -0, -1];
      expect(testcase.vertex_source.selected.indices).to.be.deep.equal([]);
      expect(testcase.vertex_source.data.x).to.be.deep.equal(xs);
      expect(testcase.vertex_source.data.y).to.be.deep.equal(ys);
      expect(testcase.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], xs]);
      expect(testcase.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], ys]);
      expect(testcase.data_source.data.z).to.be.deep.equal([null, null]);
    });
  })
});
