import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_hit_test_result, create_1d_hit_test_result} from "core/hittest"

import {Circle} from "models/glyphs/circle"
import {Patches} from "models/glyphs/patches"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PolyEditTool} from "models/tools/edit/poly_edit_tool"

const utils = require("../../../utils")


describe("PolyEditTool", (): void => {

  describe("View", function(): void {

    afterEach(() => utils.unstub_canvas());

    beforeEach(function(): void {
      utils.stub_canvas();

      // Note default plot dimensions is 600 x 600 (height x width)
      this.plot = new Plot({
         x_range: new Range1d({start: -1, end: 1}),
         y_range: new Range1d({start: -1, end: 1})
      });

      this.plot_view = new this.plot.default_view({model: this.plot, parent: null});
      this.plot_view.layout();

      this.plot_canvas_view = this.plot_view.plot_canvas_view;

      this.data = {
        xs: [[0, 0.5, 1], [0, 0.5, 1]],
        ys: [[0, -0.5, -1], [0, -0.5, -1]],
        z: [null, null]
      };
      this.data_source = new ColumnDataSource({data: this.data});
      this.vertex_source = new ColumnDataSource({data: {x: [], y: []}});

      this.vertex_glyph = new Circle({
        x: {field: "x"},
        y: {field: "y"}
      });
      this.glyph = new Patches({
        xs: {field: "xs"},
        ys: {field: "ys"},
      });

      this.vertex_renderer = new GlyphRenderer({
        glyph: this.vertex_glyph,
        data_source: this.vertex_source
      });

      this.glyph_renderer = new GlyphRenderer({
        glyph: this.glyph,
        data_source: this.data_source
      });

      this.glyph_renderer_view = new this.glyph_renderer.default_view({
        model: this.glyph_renderer,
        plot_view: this.plot_canvas_view,
        parent: this.plot_canvas_view
      });

      this.vertex_renderer_view = new this.vertex_renderer.default_view({
        model: this.vertex_renderer,
        plot_view: this.plot_canvas_view,
        parent: this.plot_canvas_view
      });

      this.hit_test_stub = sinon.stub(this.glyph_renderer_view.glyph, "hit_test");
      this.vertex_hit_test_stub = sinon.stub(this.vertex_renderer_view.glyph, "hit_test");

      const draw_tool = new PolyEditTool({
        active: true,
        empty_value: "Test",
        renderers: [this.glyph_renderer],
        vertex_renderer: this.vertex_renderer
      });
      this.plot.add_tools(draw_tool);
      this.draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;
      this.plot_canvas_view.renderer_views[this.vertex_renderer.id] = this.vertex_renderer_view;
    });

    it("should select patches on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.vertex_hit_test_stub.returns(null);

      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should drag selected patch on pan", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.vertex_hit_test_stub.returns(null);
      const start_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_start(start_event)
      const pan_event = {"bokeh": {sx: 290, sy: 290}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(pan_event)
      this.draw_tool_view._pan_end(pan_event)

      const xdata = [[0, 0.5, 1], [-0.035398230088495575, 0.4646017699115044, 0.9646017699115044]];
      const ydata = [[0, -0.5, -1], [0.03389830508474576, -0.4661016949152542, -0.9661016949152542]];
      expect(this.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(this.data_source.data['ys']).to.be.deep.equal(ydata);
    });

    it("should select multiple patches on shift-tap", function() {
      this.vertex_hit_test_stub.returns(null);
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);
      this.hit_test_stub.returns(create_1d_hit_test_result([[0, 0]]));
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1, 0]);
    });

    it("should delete selected patch on delete key", function(): void {
      sinon.stub(this.glyph_renderer_view, "set_data");
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.vertex_hit_test_stub.returns(null);
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Delete};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1]]);
      expect(this.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1]]);
      expect(this.data_source.data['z']).to.be.deep.equal([null]);
    });

    it("should clear selection on escape key", function(): void {
      this.vertex_hit_test_stub.returns(null);
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Esc};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data).to.be.deep.equal(this.data);
    });

    it("should show vertices on doubletap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._doubletap(tap_event);

      expect(this.vertex_source.data.x).to.be.deep.equal(this.data.xs[1])
      expect(this.vertex_source.data.y).to.be.deep.equal(this.data.ys[1])
      expect(this.draw_tool_view._selected_renderer, this.glyph_renderer)
    });

    it("should select vertex on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      this.vertex_renderer.view.compute_indices();
      this.vertex_hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.draw_tool_view._tap(tap_event);
      expect(this.vertex_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should delete selected vertex on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      this.vertex_renderer.view.compute_indices();

      this.vertex_hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Delete};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.vertex_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.vertex_source.data.x).to.be.deep.equal([0, 1]);
      expect(this.vertex_source.data.y).to.be.deep.equal([0, -1]);
      expect(this.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], [0, 1]]);
      expect(this.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], [0, -1]]);
      expect(this.data_source.data.z).to.be.deep.equal([null, null]);
    });

    it("should drag vertex on pan", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.hit_test_stub.returns
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      this.vertex_renderer.view.compute_indices();
      this.vertex_hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.draw_tool_view._pan_start(tap_event);
      const pan_event = {"bokeh": {sx: 290, sy: 290}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(pan_event);
      this.draw_tool_view._pan_end(pan_event);

      expect(this.vertex_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.vertex_source.data.x).to.be.deep.equal([0, 0.4646017699115044, 1]);
      expect(this.vertex_source.data.y).to.be.deep.equal([0, -0.4661016949152542, -1]);
      expect(this.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], [0, 0.4646017699115044, 1]]);
      expect(this.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], [0, -0.4661016949152542, -1]]);
      expect(this.data_source.data.z).to.be.deep.equal([null, null]);
    });

    it("should add vertex after selected vertex on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._doubletap(tap_event);
      // Have to call CDSView.compute_indices manually for testing
      this.vertex_renderer.view.compute_indices();
      this.vertex_hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      this.draw_tool_view._tap(tap_event);
      this.vertex_hit_test_stub.returns(create_hit_test_result());
      this.draw_tool_view._tap(tap_event);

      expect(this.vertex_source.selected['1d'].indices).to.be.deep.equal([2]);
      expect(this.vertex_source.data.x).to.be.deep.equal([0, 0.5, 0.04424778761061947, 1]);
      expect(this.vertex_source.data.y).to.be.deep.equal([0, -0.5, -0, -1]);
      expect(this.data_source.data.xs).to.be.deep.equal([[0, 0.5, 1], [0, 0.5, 0.04424778761061947, 1]]);
      expect(this.data_source.data.ys).to.be.deep.equal([[0, -0.5, -1], [0, -0.5, -0, -1]]);
      expect(this.data_source.data.z).to.be.deep.equal([null, null]);
    });
  })
});
