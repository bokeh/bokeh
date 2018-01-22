import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_1d_hit_test_result} from "core/hittest"

import {Patches} from "models/glyphs/patches"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {PolyDrawTool} from "models/tools/edit/poly_draw_tool"

const utils = require("../../../utils")


describe("PolyDrawTool", (): void => {

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

      this.glyph = new Patches({
        xs: {field: "xs"},
        ys: {field: "ys"},
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
      const draw_tool = new PolyDrawTool({
        active: true,
        empty_value: "Test",
        renderers: [this.glyph_renderer]
      });
      this.plot.add_tools(draw_tool);
      this.draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;
    });

    it("should select patches on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple patches on shift-tap", function() {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);
      this.hit_test_stub.returns(create_1d_hit_test_result([[0, 0]]));
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1, 0]);
    });

    it("should delete selected on delete key", function(): void {
      sinon.stub(this.glyph_renderer_view, "set_data");
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
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
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Esc};
      this.draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data).to.be.deep.equal(this.data);
    });

    it("should draw patch on pan", function(): void {
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_start(drag_event);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1], [0, 0.5, 1], [0.04424778761061947, -0.30973451327433627]];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1], [-0, 0.3389830508474576]];
      expect(this.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(this.data_source.data['ys']).to.be.deep.equal(ydata);
    });

    it("should insert empty_value on other columns", function(): void {
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan_start(drag_event);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, "Test"]);
    });

    it("should extend existing patch on shift-pan", function(): void {
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._pan_start(drag_event);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1], [0, 0.5, 1, -0.30973451327433627]];
      const ydata = [[0, -0.5, -1], [0, -0.5, -1, 0.3389830508474576]];
      expect(this.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(this.data_source.data['ys']).to.be.deep.equal(ydata);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should extend selected patch on shift-pan", function(): void {
      this.data_source.selected["1d"].indices = [0];
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: true}};
      this.draw_tool_view._pan_start(drag_event);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      this.draw_tool_view._pan(drag_event);

      const xdata = [[0, 0.5, 1, -0.30973451327433627], [0, 0.5, 1]];
      const ydata = [[0, -0.5, -1, 0.3389830508474576], [0, -0.5, -1]];
      expect(this.data_source.data['xs']).to.be.deep.equal(xdata);
      expect(this.data_source.data['ys']).to.be.deep.equal(ydata);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null]);
    });
  })
});
