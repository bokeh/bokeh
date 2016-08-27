_ = require "underscore"
{expect} = require "chai"
utils = require "../../../utils"
sinon = require 'sinon'

# {Document} = utils.require("document")
SelectTool = utils.require("models/tools/gestures/select_tool").Model
SelectToolView = utils.require("models/tools/gestures/select_tool").View
# ResizeToolView = utils.require("models/tools/gestures/resize_tool.coffee").View
Range1d = utils.require("models/ranges/range1d").Model
Plot = utils.require("models/plots/plot").Model
Rect = utils.require("models/glyphs/rect").Model
Circle = utils.require("models/glyphs/circle").Model
# Toolbar = utils.require("models/tools/toolbar").Model
{Document} = utils.require("document")
PlotCanvasView = utils.require('models/plots/plot_canvas').View

describe "SelectTool module", ->

  describe "SelectTool.Model", ->

    beforeEach ->
      @plot = new Plot({
        x_range: new Range1d({start: 0, end: 1})
        y_range: new Range1d({start: 0, end: 1})
      })

      @rect = @plot.add_glyph(new Rect())
      @circle = @plot.add_glyph(new Circle())

    describe "SelectTool._get_selectable_renderers method", ->

      it "Should return all renderers if SelectTool doesn't have any set", ->
        @plot.add_tools(new SelectTool())
        select_tool = @plot.toolbar.tools[0]
        renderers = select_tool._get_selectable_renderers()
        expect(renderers.length).to.be.equal(2)

      it "Should return only renderers set on SelectTool `renderers` attr", ->
        @plot.add_tools(new SelectTool({renderers: [@rect]}))
        select_tool = @plot.toolbar.tools[0]
        renderers = select_tool._get_selectable_renderers()
        expect(renderers.length).to.be.equal(1)
        expect(renderers[0].id).to.be.equal(@rect.id)

      it "Should return only renderers with names in SelectTool `names` attr", ->
        @rect.name = 'rect'
        @plot.add_tools(new SelectTool({names: ['rect']}))
        select_tool = @plot.toolbar.tools[0]
        renderers = select_tool._get_selectable_renderers()
        expect(renderers.length).to.be.equal(1)
        expect(renderers[0].id).to.be.equal(@rect.id)

    describe "SelectToolView", ->

      afterEach ->
        utils.unstub_canvas()
        utils.unstub_solver()

      beforeEach ->
        utils.stub_canvas()
        utils.stub_solver()

        doc = new Document()
        @plot = new Plot({
          x_range: new Range1d({start: 0, end: 1})
          y_range: new Range1d({start: 0, end: 1})
        })
        doc.add_root(@plot)
        @plot_view = new @plot.plot_canvas.default_view({model: @plot.plot_canvas })
        sinon.stub(@plot_view, 'update_constraints')

        @select_tool = new SelectTool()
        @select_tool_view = new @select_tool.default_view({
          model: @select_tool
          plot_model: @plot.plot_canvas
          plot_view: @plot_view
        })

      describe "SelectToolView._get_expanded_geometry method", ->

        it "shouldn't mutate the `geometry` argument", ->
          initial = {type: "point", vx: 0, vy:0}
          _ = @select_tool_view._get_expanded_geometry(initial)
          expect(initial).to.be.deep.equal({type: "point", vx: 0, vy:0})

        it "should add the correct elements based on if type='point'", ->
          geom = @select_tool_view._get_expanded_geometry({
            type: "point"
            vx: 0
            vy: 0
          }, true, false)
          expect(geom).to.have.all.keys([
            'type', 'vx', 'vy', 'x', 'y', 'sx', 'sy'
          ])

        it "should add the correct elements based on if type='rect'", ->
          geom = @select_tool_view._get_expanded_geometry({
            type: "rect"
            vx0: 0
            vy0: 0
            vx1: 100
            vy1: 100
          }, true, false)
          expect(geom).to.have.all.keys([
            'type', 'vx0', 'vy0', 'vx1', 'vy1', 'x0', 'y0', 'x1', 'y1', 'sx0', 'sy0', 'sx1', 'sy1'
          ])

        it "should add the correct elements based on if type='poly'", ->
          geom = @select_tool_view._get_expanded_geometry({
            type: "poly"
            vx: [0]
            vy: [0]
          }, true, false)
          expect(geom).to.have.all.keys([
            'type', 'vx', 'vy', 'x', 'y', 'sx', 'sy'
          ])

      describe "SelectToolView._save_geometry", ->
        geom = {type: "point", vx: 0, vy: 0, x: 0, y: 0, sx: 0, sy: 0}

        it "should append when append is false", ->
            @select_tool_view._save_geometry(geom, false)
            @select_tool_view._save_geometry(geom, false)
            expect(@plot.tool_events.geometries.length).to.be.equal(1)

        it "should append when append is true", ->
            @select_tool_view._save_geometry(geom, true)
            @select_tool_view._save_geometry(geom, true)
            expect(@plot.tool_events.geometries.length).to.be.equal(2)
