import {expect} from "chai"
import * as sinon from "sinon"

import {Keys} from "core/dom"
import {create_1d_hit_test_result} from "core/hittest"

import {Rect} from "models/glyphs/rect"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {BoxDrawTool} from "models/tools/edit/box_draw_tool"

const utils = require("../../../utils")


describe("BoxDrawTool", () =>

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
        x: [0, 0.5, 1],
        y: [0, 0.5, 1],
        width: [0.1, 0.2, 0.3],
        height: [0.3, 0.2, 0.1],
        z: [null, null, null]
      };
      this.data_source = new ColumnDataSource({data: this.data});

      this.glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {field: "width"},
        height: {field: "height"}
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
    });

    it("should select rect on tap", function(): void {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const draw_tool = new BoxDrawTool({renderers: [this.glyph_renderer]});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple rect on shift-tap", function(): void {
      const draw_tool = new BoxDrawTool({renderers: [this.glyph_renderer]});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      let tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);
      this.hit_test_stub.returns(create_1d_hit_test_result([[2, 0]]));
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1, 2]);
    });

    it("should delete selected on delete key", function(): void {
      const draw_tool = new BoxDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Delete};
      draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should clear selection on escape key", function(): void {
      const draw_tool = new BoxDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1, 0]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Esc};
      draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data).to.be.deep.equal(this.data);
    });

    it("should draw box on pan", function(): void {
      const draw_tool = new BoxDrawTool({renderers: [this.glyph_renderer], empty_value: "Test"});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      let drag_event = {"bokeh": {sx: 300, sy: 300}};
      draw_tool_view._pan_start(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}};
      draw_tool_view._pan(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}};
      draw_tool_view._pan_end(drag_event);
      expect(draw_tool_view._basepoint).to.be.equal(null);
      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.5, 1, -0.1327433628318584]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.5, 1, 0.1694915254237288]);
      expect(this.data_source.data['width']).to.be.deep.equal([0.1, 0.2, 0.3, 0.35398230088495575]);
      expect(this.data_source.data['height']).to.be.deep.equal([0.3, 0.2, 0.1, 0.3389830508474576]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null, "Test"]);
    });
  })
);
