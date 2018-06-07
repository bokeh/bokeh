{expect} = require "chai"

{Document} = require("document")
{compute_value, is_near, is_inside, update_range, RangeTool} = require("models/tools/gestures/range_tool")
{Range1d} = require("models/ranges/range1d")
{LinearScale} = require("models/scales/linear_scale")
{stdoutTrap, stderrTrap} = require 'logtrap'
logging = require "core/logging"

describe "range_tool module", ->
  source = {start: 0, end: 10}
  target = {start: 0, end: 100}

  generate_scale = ->
    new LinearScale({
      source_range: new Range1d(source)
      target_range: new Range1d(target)
    })

  describe "is_near", ->
    scale = generate_scale()

    it "should return false if value == null", ->
      expect(is_near(-10, null, scale)).to.be.false
      expect(is_near(0, null, scale)).to.be.false
      expect(is_near(10, null, scale)).to.be.false
      expect(is_near(10.2, null, scale)).to.be.false

    it "should return false if value maps far from screen pos", ->
      expect(is_near(-10, 5, scale)).to.be.false
      expect(is_near(0, 5, scale)).to.be.false
      expect(is_near(10, 5, scale)).to.be.false
      expect(is_near(47, 5, scale)).to.be.false
      expect(is_near(53, 5, scale)).to.be.false
      expect(is_near(60, 5, scale)).to.be.false
      expect(is_near(100, 5, scale)).to.be.false

    it "should return true if value maps close to screen pos", ->
      expect(is_near(47.1, 5, scale)).to.be.true
      expect(is_near(50, 5, scale)).to.be.true
      expect(is_near(52.9, 5, scale)).to.be.true

    it "should return respect tolerance when testing closeness", ->
      expect(is_near(40, 5, scale, 10)).to.be.false
      expect(is_near(40.1, 5, scale, 10)).to.be.true
      expect(is_near(50, 5, scale, 10)).to.be.true
      expect(is_near(59.9, 5, scale, 10)).to.be.true
      expect(is_near(60, 5, scale, 10)).to.be.false

  describe "is_inside", ->
    x_range = new Range1d(source)
    y_range = new Range1d(source)
    x_scale = generate_scale()
    y_scale = generate_scale()

    it "should return true if sx/sy are inside the overlay", ->
      rt = new RangeTool({x_range: x_range})
      rt.update_overlay_from_ranges()
      r = is_inside(50, 50, x_scale, y_scale, rt.overlay)
      expect(r).to.be.true

      rt = new RangeTool({y_range: y_range})
      rt.update_overlay_from_ranges()
      r = is_inside(50, 50, x_scale, y_scale, rt.overlay)
      expect(r).to.be.true

      rt = new RangeTool({x_range: x_range, y_range: y_range})
      rt.update_overlay_from_ranges()
      r = is_inside(50, 50, x_scale, y_scale, rt.overlay)
      expect(r).to.be.true

    it "should return false if sx/sy are outside the overlay", ->
      rt = new RangeTool({x_range: x_range})
      rt.update_overlay_from_ranges()
      r = is_inside(-1, 50, x_scale, y_scale, rt.overlay)
      expect(r).to.be.false
      r = is_inside(101, 50, x_scale, y_scale, rt.overlay)
      expect(r).to.be.false

      rt = new RangeTool({y_range: y_range})
      rt.update_overlay_from_ranges()
      r = is_inside(50, -1, x_scale, y_scale, rt.overlay)
      expect(r).to.be.false
      r = is_inside(50, 101, x_scale, y_scale, rt.overlay)
      expect(r).to.be.false

  describe "compute_value", ->
    scale = generate_scale()

    it "should return value as-is if new value would be outside range", ->
      range = new Range1d(source)
      r = compute_value(5, scale, 51, range)
      expect(r).to.be.equal 5
      r = compute_value(5, scale, -51, range)
      expect(r).to.be.equal 5

    it "should return new_value if new value would be inside range", ->
      range = new Range1d(source)
      r = compute_value(5, scale, 50, range)
      expect(r).to.be.equal 10
      r = compute_value(5, scale, 0, range)
      expect(r).to.be.equal 5
      r = compute_value(5, scale, -50, range)
      expect(r).to.be.equal 0

  describe "update_range", ->
    scale = generate_scale()

    it "should not update range if new start/end would be outside plot_range", ->
      plot_range = new Range1d({start:-2, end:12})

      range = new Range1d(source)
      update_range(range, scale, 21, plot_range)
      expect(range.start).to.be.equal 0
      expect(range.end).to.be.equal 10

      range = new Range1d(source)
      update_range(range, scale, -21, plot_range)
      expect(range.start).to.be.equal 0
      expect(range.end).to.be.equal 10

    it "should update range if new start/end would be inside plot_range", ->
      plot_range = new Range1d({start:-2, end:12})

      range = new Range1d(source)
      update_range(range, scale, 20, plot_range)
      expect(range.start).to.be.equal 2
      expect(range.end).to.be.equal 12

      range = new Range1d(source)
      update_range(range, scale, -20, plot_range)
      expect(range.start).to.be.equal -2
      expect(range.end).to.be.equal 8

  describe "RangeTool", ->

    describe "construction", ->
      x_range = new Range1d(source)
      y_range = new Range1d(source)

      it "should set overlay in_cursor", ->
        rt = new RangeTool()
        expect(rt.overlay.in_cursor).to.be.equal "grab"

      it "should set overlay ns_cursor", ->
        rt = new RangeTool()
        expect(rt.overlay.ns_cursor).to.be.equal null

        rt = new RangeTool({y_range: y_range})
        expect(rt.overlay.ns_cursor).to.be.equal "ns-resize"

        rt = new RangeTool({y_range: y_range, y_interaction: false})
        expect(rt.overlay.ns_cursor).to.be.equal null

      it "should set overlay ew_cursor", ->
        rt = new RangeTool()
        expect(rt.overlay.ew_cursor).to.be.equal null

        rt = new RangeTool({x_range: x_range})
        expect(rt.overlay.ew_cursor).to.be.equal "ew-resize"

        rt = new RangeTool({x_range: x_range, x_interaction: false})
        expect(rt.overlay.ew_cursor).to.be.equal null

    describe "update_overlay_from_ranges", ->
      x_range = new Range1d(source)
      y_range = new Range1d(source)

      # it "should warn if no ranges are set", ->
      #   old_log_level = logging.logger.level.name
      #   logging.set_log_level("warn")
      #   logging.set_log_level(old_log_level)
      #   rt = new RangeTool()
      #   out = stdoutTrap(() -> rt.update_overlay_from_ranges())
      #   expect(out).to.be.equal 'RangeTool not configured with any Ranges.'

      it "should set overlay coords to null if no ranges are set", ->
        rt = new RangeTool()
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.null
        expect(rt.overlay.right).to.be.null
        expect(rt.overlay.top).to.be.null
        expect(rt.overlay.bottom).to.be.null

      it "should set top/bottom overlay coords to null if y range is null", ->
        rt = new RangeTool({x_range: x_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.not.be.null
        expect(rt.overlay.right).to.not.be.null
        expect(rt.overlay.top).to.be.null
        expect(rt.overlay.bottom).to.be.null

      it "should set left/right overlay coords to null if x range is null", ->
        rt = new RangeTool({y_range: y_range})
        rt.update_overlay_from_ranges()
        expect(rt.overlay.left).to.be.null
        expect(rt.overlay.right).to.be.null
        expect(rt.overlay.top).to.not.be.null
        expect(rt.overlay.bottom).to.not.be.null
