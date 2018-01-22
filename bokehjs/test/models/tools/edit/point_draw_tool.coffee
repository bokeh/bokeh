{expect} = require "chai"
utils = require "../../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")
{Keys} = utils.require("core/dom")
{create_1d_hit_test_result, create_hit_test_result} = utils.require("core/hittest")

{PointDrawTool, PointDrawToolView} = utils.require("models/tools/edit/point_draw_tool")
{Range1d} = utils.require("models/ranges/range1d")
{Circle} = utils.require("models/glyphs/circle")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{ColumnDataSource} = utils.require("models/sources/column_data_source")
{Plot} = utils.require("models/plots/plot")
{Toolbar} = utils.require("models/tools/toolbar")

{create_glyph_view} = require("../../glyphs/glyph_utils")


describe "PointDrawTool", ->

  describe "View", ->

    afterEach ->
      utils.unstub_canvas()

    beforeEach ->
      utils.stub_canvas()

      # Note default plot dimensions is 600 x 600 (height x width)
      @plot = new Plot({
         x_range: new Range1d({start: -1, end: 1})
         y_range: new Range1d({start: -1, end: 1})
      })
      document = new Document()
      document.add_root(@plot)

      @plot_view = new @plot.default_view({model: @plot, parent: null})
      @plot_view.layout()

      @plot_canvas_view = @plot_view.plot_canvas_view

      @data = {x: [0, 0.5, 1], y: [0, 0.5, 1], z: [null, null, null]}
      @data_source = new ColumnDataSource({data: @data})

      @glyph = new Circle({
        x: {field: "x"}
        y: {field: "y"}
        size: {units: "screen", value: 20}
      })

      @glyph_renderer = new GlyphRenderer({
        glyph: @glyph
        data_source: @data_source
      })

      @glyph_renderer_view = new @glyph_renderer.default_view({
        model: @glyph_renderer
        plot_view: @plot_canvas_view
        parent: @plot_canvas_view
      })

      @hit_test_stub = sinon.stub(@glyph_renderer_view.glyph, "hit_test")

    it "should select point on tap", ->
      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      expect(@data_source.selected['1d'].indices).to.be.deep.equal([1])

    it "should select multiple point on shift-tap", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)
      @hit_test_stub.returns(create_1d_hit_test_result([[2]]))
      tap_event = {"bokeh": {sx: 560, sy: 560}, "srcEvent": {shiftKey: true}}
      draw_tool_view._tap(tap_event)

      expect(@data_source.selected['1d'].indices).to.be.deep.equal([1, 2])

    it "should add point on tap", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(null)
      tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      expect(@data_source.selected['1d'].indices).to.be.deep.equal([])
      expect(@data_source.data['x']).to.be.deep.equal([0, 0.5, 1, 0.04424778761061947])
      expect(@data_source.data['y']).to.be.deep.equal([0, 0.5, 1, 0.3389830508474576])
      expect(@data_source.data['z']).to.be.deep.equal([null, null, null, null])

    it "should insert empty_value on other columns", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer], empty_value: 'Test'})
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(null)
      tap_event = {"bokeh": {sx: 300, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      expect(@data_source.data['z']).to.be.deep.equal([null, null, null, 'Test'])

    it "should delete selected on delete key", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      draw_tool.active = true
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      keyup_event = {keyCode: Keys.Delete}
      draw_tool_view._keyup(keyup_event)

      expect(@data_source.selected['1d'].indices).to.be.deep.equal([])
      expect(@data_source.data['x']).to.be.deep.equal([0, 1])
      expect(@data_source.data['y']).to.be.deep.equal([0, 1])
      expect(@data_source.data['z']).to.be.deep.equal([null, null])

    it "should clear selection on escape key", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      draw_tool.active = true
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      keyup_event = {keyCode: Keys.Esc}
      draw_tool_view._keyup(keyup_event)

      expect(@data_source.selected['1d'].indices).to.be.deep.equal([])
      expect(@data_source.data).to.be.deep.equal(@data)

    it "should drag point on pan", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      draw_tool.active = true
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._pan_start(drag_event)
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300])

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._pan(drag_event)
      expect(draw_tool_view._basepoint).to.be.deep.equal([200, 200])

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._pan_end(drag_event)
      expect(draw_tool_view._basepoint).to.be.equal(null)
      expect(@data_source.selected['1d'].indices).to.be.deep.equal([])
      expect(@data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 1])
      expect(@data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1])
      expect(@data_source.data['z']).to.be.deep.equal([null, null, null])

    it "should drag all selected points on pan", ->
      draw_tool = new PointDrawTool({renderers: [@glyph_renderer]})
      draw_tool.active = true
      @plot.add_tools(draw_tool)
      draw_tool_view = @plot_canvas_view.tool_views[draw_tool.id]
      @plot_canvas_view.renderer_views[@glyph_renderer.id] = @glyph_renderer_view

      @hit_test_stub.returns(create_1d_hit_test_result([[1]]))
      tap_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: false}}
      draw_tool_view._tap(tap_event)

      @hit_test_stub.returns(create_1d_hit_test_result([[2]]))
      drag_event = {"bokeh": {sx: 300, sy: 300}, "srcEvent": {shiftKey: true}}
      draw_tool_view._pan_start(drag_event)
      expect(draw_tool_view._basepoint).to.be.deep.equal([300, 300])
      
      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._pan(drag_event)
      expect(draw_tool_view._basepoint).to.be.deep.equal([200, 200])

      drag_event = {"bokeh": {sx: 200, sy: 200}, "srcEvent": {shiftKey: false}}
      draw_tool_view._pan_end(drag_event)
      expect(draw_tool_view._basepoint).to.be.equal(null)
      expect(@data_source.selected['1d'].indices).to.be.deep.equal([])
      expect(@data_source.data['x']).to.be.deep.equal([0, 0.14601769911504425, 0.6460176991150443])
      expect(@data_source.data['y']).to.be.deep.equal([0, 0.8389830508474576, 1.3389830508474576])
      expect(@data_source.data['z']).to.be.deep.equal([null, null, null])
