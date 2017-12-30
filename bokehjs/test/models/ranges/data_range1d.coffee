{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{HasProps} = utils.require "core/has_props"
p = utils.require "core/properties"

{CustomJS} = utils.require("models/callbacks/customjs")
{DataRange1d} = utils.require("models/ranges/data_range1d")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")

class TestObject extends HasProps
  type: 'TestObject'

  @define {
    renderers: [ p.Array, [] ]
  }

describe "datarange1d module", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

  describe "default creation", ->
    r = new DataRange1d()

    it "should have start = null", ->
      expect(r.start).to.be.null

    it "should have end = null", ->
      expect(r.end).to.be.null

    # Math.min(null, null) == 0
    it "should have min = 0", ->
      expect(r.min).to.be.equal 0

    # Math.max(null, null) == 0
    it "should have max = 0", ->
      expect(r.max).to.be.equal 0

    it "should have flipped = false", ->
      expect(r.flipped).to.be.equal false

    it "should have follow = null", ->
      expect(r.follow).to.be.null

    it "should have follow_interval = null", ->
      expect(r.follow_interval).to.be.null

    it "should have default_span = 2", ->
      expect(r.default_span).to.be.equal 2

    it "should have no computed_renderers", ->
      expect(r.computed_renderers()).to.be.deep.equal []

  describe "explicit bounds=(10,20) creation", ->
    r = new DataRange1d({start: 10, end:20})

    it "should have start = 10", ->
      expect(r.start).to.be.equal 10

    it "should have end = 20", ->
      expect(r.end).to.be.equal 20

    it "should have min = 10", ->
      expect(r.min).to.be.equal 10

    it "should have max = 20", ->
      expect(r.max).to.be.equal 20

  describe "reset", ->

    it "should reset configuration to initial values", ->
      r = new DataRange1d()
      r.range_padding = 0.2
      r.range_padding_units = 'absolute'
      r.follow = 'end'
      r.follow_interval = 10
      r.default_span = 10
      r.reset()
      expect(r.range_padding).to.be.equal 0.1
      expect(r.range_padding_units).to.be.equal "percent"
      expect(r.follow).to.be.null
      expect(r.follow_interval).to.be.null
      expect(r.default_span).to.be.equal 2

    # something must call update(...) to update (start, end)
    it "should not reset (start, end)", ->
      r = new DataRange1d()
      r.start = 4
      r.end = 10
      r.reset()
      expect(r.start).to.be.equal 4
      expect(r.end).to.be.equal 10

    it "should execute callback exactly once", ->
      cb = new CustomJS()
      r = new DataRange1d({callback: cb})
      spy = sinon.spy(cb, 'execute')
      r.reset()
      expect(spy.calledOnce).to.be.true

  describe "computed_renderers", ->

    it "should add renderers from one plot", ->
      r = new DataRange1d()
      p = new TestObject()
      g = new GlyphRenderer()
      p.renderers = [g]
      r.plots = [p]
      expect(r.computed_renderers()).to.be.deep.equal [g]

      r = new DataRange1d()
      g2 = new GlyphRenderer()
      p.renderers = [g, g2]
      r.plots = [p]
      expect(r.computed_renderers()).to.be.deep.equal [g, g2]


    it "should add renderers from multiple plot", ->
      r = new DataRange1d()
      p = new TestObject()
      g = new GlyphRenderer()
      p.renderers = [g]

      p2 = new TestObject()
      g2 = new GlyphRenderer()
      p2.renderers = [g2]

      r.plots = [p, p2]
      expect(r.computed_renderers()).to.be.deep.equal [g, g2]

    it "should respect user-set renderers", ->
      r = new DataRange1d()
      p = new TestObject()
      g = new GlyphRenderer()
      p.renderers = [g]

      p2 = new TestObject()
      g2 = new GlyphRenderer()
      p2.renderers = [g2]

      r.plots = [p, p2]
      r.renderers = [g2]
      expect(r.computed_renderers()).to.be.deep.equal [g2]

  describe "_compute_range", ->

    it "should use default_span when max=min", ->
      r = new DataRange1d()
      expect(r._compute_range(3, 3)).to.be.deep.equal [2, 4]
      r.default_span = 4
      expect(r._compute_range(3, 3)).to.be.deep.equal [1, 5]
      r.range_padding = 0
      expect(r._compute_range(3, 3)).to.be.deep.equal [1, 5]

    it "should use default_span as powers of 10 when scale_hint='log'", ->
      r = new DataRange1d()
      r.scale_hint = "log"
      [a, b] = r._compute_range(100, 100)
      expect(a).to.be.closeTo(9.988493699365053, 1e-12)
      expect(b).to.be.closeTo(1001.1519555381683, 1e-12)
      r.default_span = 4
      [a, b] = r._compute_range(100, 100)
      expect(a).to.be.closeTo(0.9988493699365047, 1e-12)
      expect(b).to.be.closeTo(10011.519555381703, 1e-12)

    it "should swap max, min when flipped", ->
      r = new DataRange1d()
      r.flipped = true
      expect(r._compute_range(3, 3)).to.be.deep.equal [4, 2]

    it "should follow min when follow=start and not flipped", ->
      r = new DataRange1d()
      r.range_padding = 0
      r.follow = 'start'
      r.follow_interval = 4
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]
      expect(r._compute_range(1, 7)).to.be.deep.equal [1, 5]

    it "should follow max when follow=start and flipped", ->
      r = new DataRange1d()
      r.range_padding = 0
      r.follow = 'start'
      r.follow_interval = 4
      r.flipped = true
      expect(r._compute_range(1, 3)).to.be.deep.equal [3, 1]
      expect(r._compute_range(1, 7)).to.be.deep.equal [7, 3]

    it "should follow max when follow=end and not flipped", ->
      r = new DataRange1d()
      r.range_padding = 0
      r.follow = 'end'
      r.follow_interval = 4
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]
      expect(r._compute_range(1, 7)).to.be.deep.equal [3, 7]

    it "should follow min when follow=end and flipped", ->
      r = new DataRange1d()
      r.range_padding = 0
      r.follow = 'end'
      r.follow_interval = 4
      r.flipped = true
      expect(r._compute_range(1, 3)).to.be.deep.equal [3, 1]
      expect(r._compute_range(1, 7)).to.be.deep.equal [5, 1]

    it "should apply percentage range_padding", ->
      r = new DataRange1d()
      r.range_padding = 0.5
      expect(r._compute_range(1, 3)).to.be.deep.equal [0.5, 3.5]
      r.range_padding = 0
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]

    it "should apply absolute range_padding", ->
      r = new DataRange1d()
      r.range_padding = 0.2
      r.range_padding_units = "absolute"
      expect(r._compute_range(1, 3)).to.be.deep.equal [0.8, 3.2]
      r.range_padding = 0
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]

    it "should apply range_padding logly when scale_hint='log'", ->
      r = new DataRange1d()
      r.range_padding = 0.5
      r.scale_hint = "log"
      [a, b] = r._compute_range(0.01, 10)
      expect(a).to.be.closeTo(0.0017782794100389264, 1e-12)
      expect(b).to.be.closeTo(56.23413251903488, 1e-12)
      r.range_padding = 0
      [a, b] = r._compute_range(0.01, 10)
      expect(a).to.be.closeTo(0.01, 1e-12)
      expect(b).to.be.closeTo(10, 1e-12)

      r.range_padding = 0.5
      r.range_padding_units = "absolute"
      [a, b] = r._compute_range(1, 10)
      expect(a).to.be.closeTo(0.5, 1e-12)
      expect(b).to.be.closeTo(10.5, 1e-12)
      r.range_padding = 0
      [a, b] = r._compute_range(1, 10)
      expect(a).to.be.closeTo(1, 1e-12)
      expect(b).to.be.closeTo(10, 1e-12)

  describe "_compute_min_max", ->

    it "should compute max/min for dimension of a single plot_bounds", ->
      r = new DataRange1d()
      bds = {
        1: {minX: 0, maxX: 10, minY: 5, maxY:6}
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [0, 10]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [5, 6]

    it "should compute max/min for dimension of multiple plot_bounds", ->
      r = new DataRange1d()
      bds = {
        1: {minX: 0, maxX: 10, minY: 5, maxY: 6}
        2: {minX: 0, maxX: 15, minY: 5.5, maxY: 5.6}
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [0, 15]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [5, 6]

      bds = {
        1: {minX: 0, maxX: 10, minY: 5, maxY: 6}
        2: {minX: 0, maxX: 15, minY: 5.5, maxY: 5.6}
        3: {minX: -10, maxX: 15, minY: 0, maxY: 2}
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [-10, 15]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [0, 6]

  describe "_computed_plot_bounds", ->

    it "should compute bounds from configured renderers", ->
      r = new DataRange1d()

      g1 = new TestObject()
      g1.id = 1
      g2 = new TestObject()
      g2.id = 2

      bds = {
        1: {minX: 0, maxX: 10, minY: 5, maxY: 6}
        2: {minX: 0, maxX: 15, minY: 5.5, maxY: 5.6}
        3: {minX: -10, maxX: 15, minY: 0, maxY: 2}
      }

      expect(r._compute_plot_bounds([g1], bds)).to.be.deep.equal {minX: 0, maxX: 10, minY: 5, maxY: 6}
      expect(r._compute_plot_bounds([g1, g2], bds)).to.be.deep.equal {minX: 0, maxX: 15, minY: 5, maxY: 6}

  describe "update", ->

    it "should update its start and end values", ->
      r = new DataRange1d()
      p = new TestObject()
      g = new GlyphRenderer()
      g.id = "id"
      p.renderers = [g]
      r.plots = [p]

      bds = {
        "id": {minX: -10, maxX: -6, minY: 5, maxY: 6}
      }

      r.update(bds, 0, "id")
      expect(r.start).to.be.equal -10.2

    it "should not update its start or end values to NaN when log", ->
      r = new DataRange1d()
      r.scale_hint = "log"
      p = new TestObject()
      g = new GlyphRenderer()
      g.id = "id"
      p.renderers = [g]
      r.plots = [p]

      bds = {
        "id": {minX: Infinity, maxX: -Infinity, minY: 5, maxY: 6}
      }

      r.update(bds, 0, "id")
      expect(r.start).not.to.be.NaN
      expect(r.end).not.to.be.NaN

  describe "changing model attribute", ->

    it "should execute callback once", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')
      r = new DataRange1d({callback: cb})
      expect(spy.called).to.be.false
      r.start = 15
      expect(spy.calledOnce).to.be.true

  describe "adjust_bounds_for_aspect", ->
    it "should preserve y axis when it is larger", ->
      r = new DataRange1d()

      bds = {minX: 0, maxX: 1, minY: 0, maxY: 2}

      bds = r.adjust_bounds_for_aspect(bds, 4)
      expect(bds.minX).to.be.equal -3.5
      expect(bds.maxX).to.be.equal 4.5
      expect(bds.minY).to.be.equal 0
      expect(bds.maxY).to.be.equal 2

    it "should preserve x axis when it is larger", ->
      r = new DataRange1d()

      bds = {minX: 0, maxX: 8, minY: 0, maxY: 1}

      bds = r.adjust_bounds_for_aspect(bds, 4)
      expect(bds.minX).to.be.equal 0
      expect(bds.maxX).to.be.equal 8
      expect(bds.minY).to.be.equal -0.5
      expect(bds.maxY).to.be.equal 1.5
