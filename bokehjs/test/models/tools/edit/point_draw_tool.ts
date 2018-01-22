const {expect} = require("chai");
const utils = require("../../../utils");
const sinon = require('sinon');

const {Keys} = utils.require("core/dom");
const {create_1d_hit_test_result, create_hit_test_result} = utils.require("core/hittest");

const {PointDrawTool, PointDrawToolView} = utils.require("models/tools/edit/point_draw_tool");
const {Range1d} = utils.require("models/ranges/range1d");
const {Circle} = utils.require("models/glyphs/circle");
const {GlyphRenderer} = utils.require("models/renderers/glyph_renderer");
const {ColumnDataSource} = utils.require("models/sources/column_data_source");
const {Plot} = utils.require("models/plots/plot");
const {Toolbar} = utils.require("models/tools/toolbar");

const {create_glyph_view} = require("../../glyphs/glyph_utils");


describe("PointDrawTool", () =>

  describe("View", function() {

    afterEach(() => utils.unstub_canvas());

    beforeEach(function() {
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
    });

    it("should select point on tap", function() {
      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1]);
    });

    it("should select multiple point on shift-tap", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      let tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);
      this.hit_test_stub.returns(create_1d_hit_test_result([[2]]));
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([1, 2]);
    });

    it("should add point on tap", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(null);
      const tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.5, 1, 0.04424778761061947]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.5, 1, 0.3389830508474576]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null, null]);
    });

    it("should insert empty_value on other columns", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer], empty_value: 'Test'});
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(null);
      const tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null, 'Test']);
    });

    it("should delete selected on delete key", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Delete};
      draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 1]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null]);
    });

    it("should clear selection on escape key", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      const keyup_event = {keyCode: Keys.Esc};
      draw_tool_view._keyup(keyup_event);

      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data).to.be.deep.equal(this.data);
    });

    it("should drag point on pan", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._pan_start(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._pan(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._pan_end(drag_event);
      expect(draw_tool_view._basepoint).to.be.equal(null);
      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 1]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });

    it("should drag all selected points on pan", function() {
      const draw_tool = new PointDrawTool({renderers: [this.glyph_renderer]});
      draw_tool.active = true;
      this.plot.add_tools(draw_tool);
      const draw_tool_view = this.plot_canvas_view.tool_views[draw_tool.id];
      this.plot_canvas_view.renderer_views[this.glyph_renderer.id] = this.glyph_renderer_view;

      this.hit_test_stub.returns(create_1d_hit_test_result([[1]]));
      const tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}};
      draw_tool_view._tap(tap_event);

      this.hit_test_stub.returns(create_1d_hit_test_result([[2]]));
      let drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: true}};
      draw_tool_view._pan_start(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._pan(drag_event);
      expect(draw_tool_view._basepoint).to.be.deep.equal([200, 200]);

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}};
      draw_tool_view._pan_end(drag_event);
      expect(draw_tool_view._basepoint).to.be.equal(null);
      expect(this.data_source.selected['1d'].indices).to.be.deep.equal([]);
      expect(this.data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 0.6460176991150443]);
      expect(this.data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1.3389830508474576]);
      expect(this.data_source.data['z']).to.be.deep.equal([null, null, null]);
    });
  })
);
