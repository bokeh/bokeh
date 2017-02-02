{expect} = require "chai"
utils = require "../../../utils"

{Document} = utils.require("document")
{ZoomOutTool} = utils.require("models/tools/actions/zoom_out_tool")
{Range1d} = utils.require("models/ranges/range1d")
{Plot} = utils.require("models/plots/plot")
{Toolbar} = utils.require("models/tools/toolbar")

describe "ZoomOutTool", ->

  describe "Model", ->

    it "should create proper tooltip", ->
      tool = new ZoomOutTool()
      expect(tool.tooltip).to.be.equal('Zoom Out')

      x_tool = new ZoomOutTool({dimensions: 'width'})
      expect(x_tool.tooltip).to.be.equal('Zoom Out (x-axis)')

      y_tool = new ZoomOutTool({dimensions: 'height'})
      expect(y_tool.tooltip).to.be.equal('Zoom Out (y-axis)')

  describe "View", ->

    afterEach ->
      utils.unstub_canvas()

    beforeEach ->
      utils.stub_canvas()

      @plot = new Plot({
         x_range: new Range1d({start: -1, end: 1})
         y_range: new Range1d({start: -1, end: 1})
      })

      document = new Document()
      document.add_root(@plot)

      @plot_canvas_view = new @plot.plot_canvas.default_view({
        model: @plot.plot_canvas
      })

    it "should zoom into both ranges", ->
      zoom_out_tool = new ZoomOutTool()

      @plot.add_tools(zoom_out_tool)

      zoom_out_tool_view = new zoom_out_tool.default_view({
        model: zoom_out_tool
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # perform the tool action
      zoom_out_tool_view.do()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.1, 1.1])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.1, 1.1])

    it "should zoom the x-axis only", ->
      zoom_out_tool = new ZoomOutTool({dimensions: 'width'})

      @plot.add_tools(zoom_out_tool)

      zoom_out_tool_view = new zoom_out_tool.default_view({
        model: zoom_out_tool
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # perform the tool action
      zoom_out_tool_view.do()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.1, 1.1])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.0, 1.0])

    it "should zoom the y-axis only", ->
      zoom_out_tool = new ZoomOutTool({dimensions: 'height'})

      @plot.add_tools(zoom_out_tool)

      zoom_out_tool_view = new zoom_out_tool.default_view({
        model: zoom_out_tool
        plot_model: @plot.plot_canvas
        plot_view: @plot_canvas_view
      })

      # perform the tool action
      zoom_out_tool_view.do()

      hr = @plot_canvas_view.frame.x_ranges['default']
      expect([hr.start, hr.end]).to.be.deep.equal([-1.0, 1.0])
      vr = @plot_canvas_view.frame.y_ranges['default']
      expect([vr.start, vr.end]).to.be.deep.equal([-1.1, 1.1])
