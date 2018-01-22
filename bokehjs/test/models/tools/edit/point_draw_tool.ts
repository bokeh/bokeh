import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_1d_hit_test_result} from "core/hittest"

import {Circle} from "models/glyphs/circle"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PointDrawTool} from "models/tools/edit/point_draw_tool"

const utils = require("../../../utils")


describe("PointDrawTool", (): void => {

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

      this.data = {x: [0, 0.5, 1], y: [0, 0.5, 1], z: [null, null, null]};
      this.data_source = new ColumnDataSource({data: this.data});

      this.glyph = new Circle({
        x: {field: "x"},
        y: {field: "y"},
        size: {units: "screen", value: 20}
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

      this.hit_test_stub = sinon.stub(this.glyph_renderer_view.glyph, "hit_test");

      const draw_tool = new PointDrawTool({
        renderers: [this.glyph_renderer],
        active: true,
        empty_value: "Test"
      });
      this.plot.add_tools(draw_tool);
      this.draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;
    });

    it("should select point on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple point on shift-tap", function() {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);
      this.hit_test_stub.returns(create_1d_hit_test_result([[2, 0]]));
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1, 2]);
    });

    it("should add point on tap", function() {
      this.hit_test_stub.returns(null);
      const tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.5, 1, 0.04424778761061947]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.5, 1, 0.3389830508474576]);
    });

    it("should insert empty_value on other columns", function() {
      this.hit_test_stub.returns(null);
      const tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null, 'Test']);
    });

    it("should delete selected on delete key", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Delete};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should clear selection on escape key", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Esc};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data).to.be.deep.equal(this.data);
    });

    it("should drag point on pan", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_start(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_end(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.equal(null);
      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 1]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });

    it("should drag all selected points on pan", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      this.hit_test_stub.returns(create_1d_hit_test_result([[2, 0]]));
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._pan_start(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_end(drag_event);
      expect(this.draw_tool_view._basepoint).to.be.equal(null);
      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 0.6460176991150443]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1.3389830508474576]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });
  })
});
