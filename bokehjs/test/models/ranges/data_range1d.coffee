{expect} = require "chai"
utils = require "../../utils"

{Collections} = utils.require "base"

HasProps = utils.require "core/has_props"

class TestObject extends HasProps
  type: 'TestObject'

describe "datarange1d module", ->

  describe "default creation", ->
    r = Collections('DataRange1d').create()

    it "should have start = null", ->
      expect(r.get('start')).to.be.null

    it "should have end = null", ->
      expect(r.get('end')).to.be.null

    # Math.min(null, null) == 0
    it "should have min = 0", ->
      expect(r.get('min')).to.be.equal 0

    # Math.max(null, null) == 0
    it "should have max = 0", ->
      expect(r.get('max')).to.be.equal 0

    it "should have flipped = false", ->
      expect(r.get('flipped')).to.be.equal false

    it "should have follow = null", ->
      expect(r.get('follow')).to.be.null

    it "should have follow_interval = null", ->
      expect(r.get('follow_interval')).to.be.null

    it "should have default_span = 2", ->
      expect(r.get('default_span')).to.be.equal 2

    it "should have no computed_renderers", ->
      expect(r.computed_renderers()).to.be.deep.equal []

  describe "explicit bounds=(10,20) creation", ->
    r = Collections('DataRange1d').create({start: 10, end:20})

    it "should have start = 10", ->
      expect(r.get('start')).to.be.equal 10

    it "should have end = 20", ->
      expect(r.get('end')).to.be.equal 20

    it "should have min = 10", ->
      expect(r.get('min')).to.be.equal 10

    it "should have max = 20", ->
      expect(r.get('max')).to.be.equal 20

  describe "reset", ->

    it "should reset configuration to initial values", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0.2)
      r.set('follow', 'end')
      r.set('follow_interval', 10)
      r.set('default_span', 10)
      r.reset()
      expect(r.get('range_padding')).to.be.equal 0.1
      expect(r.get('follow')).to.be.null
      expect(r.get('follow_interval')).to.be.null
      expect(r.get('default_span')).to.be.equal 2

    # something must call update(...) to update (start, end)
    it "should not reset (start, end)", ->
      r = Collections('DataRange1d').create()
      r.set('start', 4)
      r.set('end', 10)
      r.reset()
      expect(r.get('start')).to.be.equal 4
      expect(r.get('end')).to.be.equal 10

  describe "computed_renderers", ->

    it "should add renderers from one plot", ->
      r = Collections('DataRange1d').create()
      p = new TestObject()
      g = new TestObject()
      g.type = "GlyphRenderer"
      p.set('renderers', [g])
      r.set('plots', [p])
      expect(r.computed_renderers()).to.be.deep.equal [g]

      r = Collections('DataRange1d').create()
      g2 = new TestObject()
      g2.type = "GlyphRenderer"
      p.set('renderers', [g, g2])
      r.set('plots', [p])
      expect(r.computed_renderers()).to.be.deep.equal [g, g2]


    it "should add renderers from multiple plot", ->
      r = Collections('DataRange1d').create()
      p = new TestObject()
      g = new TestObject()
      g.type = "GlyphRenderer"
      p.set('renderers', [g])

      p2 = new TestObject()
      g2 = new TestObject()
      g2.type = "GlyphRenderer"
      p2.set('renderers', [g2])

      r.set('plots', [p, p2])
      expect(r.computed_renderers()).to.be.deep.equal [g, g2]

    it "should respect user-set renderers", ->
      r = Collections('DataRange1d').create()
      p = new TestObject()
      g = new TestObject()
      g.type = "GlyphRenderer"
      p.set('renderers', [g])

      p2 = new TestObject()
      g2 = new TestObject()
      g2.type = "GlyphRenderer"
      p2.set('renderers', [g2])

      r.set('plots', [p, p2])
      r.set('renderers', [g2])
      expect(r.computed_renderers()).to.be.deep.equal [g2]

  describe "_compute_range", ->

    it "should use default_span when max=min", ->
      r = Collections('DataRange1d').create()
      expect(r._compute_range(3, 3)).to.be.deep.equal [2, 4]
      r.set('default_span', 4)
      expect(r._compute_range(3, 3)).to.be.deep.equal [1, 5]

    it "should swap max, min when flipped", ->
      r = Collections('DataRange1d').create()
      r.set('flipped', true)
      expect(r._compute_range(3, 3)).to.be.deep.equal [4, 2]

    it "should follow min when follow=start and not flipped", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0)
      r.set('follow', 'start')
      r.set('follow_interval', 4)
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]
      expect(r._compute_range(1, 7)).to.be.deep.equal [1, 5]

    it "should follow max when follow=start and flipped", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0)
      r.set('follow', 'start')
      r.set('follow_interval', 4)
      r.set('flipped', true)
      expect(r._compute_range(1, 3)).to.be.deep.equal [3, 1]
      expect(r._compute_range(1, 7)).to.be.deep.equal [7, 3]

    it "should follow max when follow=end and not flipped", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0)
      r.set('follow', 'end')
      r.set('follow_interval', 4)
      expect(r._compute_range(1, 3)).to.be.deep.equal [1, 3]
      expect(r._compute_range(1, 7)).to.be.deep.equal [3, 7]

    it "should follow min when follow=end and flipped", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0)
      r.set('follow', 'end')
      r.set('follow_interval', 4)
      r.set('flipped', true)
      expect(r._compute_range(1, 3)).to.be.deep.equal [3, 1]
      expect(r._compute_range(1, 7)).to.be.deep.equal [5, 1]

    it "should apply range_padding", ->
      r = Collections('DataRange1d').create()
      r.set('range_padding', 0.5)
      expect(r._compute_range(1, 3)).to.be.deep.equal [0.5, 3.5]

  describe "_compute_min_max", ->

    it "should compute max/min for dimension of a single plot_bounds", ->
      r = Collections('DataRange1d').create()
      bds = {
        1: [[0, 10], [5, 6]]
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [0, 10]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [5, 6]

    it "should compute max/min for dimension of multiple plot_bounds", ->
      r = Collections('DataRange1d').create()
      bds = {
        1: [[0, 10], [5, 6]]
        2: [[0, 15], [5.5, 5.6]]
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [0, 15]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [5, 6]

      bds = {
        1: [[0, 10], [5, 6]]
        2: [[0, 15], [5.5, 5.6]]
        3: [[-10, 15], [0, 2]]
      }
      expect(r._compute_min_max(bds, 0)).to.be.deep.equal [-10, 15]
      expect(r._compute_min_max(bds, 1)).to.be.deep.equal [0, 6]

  describe "_computed_plot_bounds", ->

    it "should compute bounds from configured renderers", ->
      r = Collections('DataRange1d').create()

      g1 = new TestObject()
      g1.id = 1
      g2 = new TestObject()
      g2.id = 2

      bds = {
        1: [[0, 10], [5, 6]]
        2: [[0, 15], [5.5, 5.6]]
        3: [[-10, 15], [0, 2]]
      }

      expect(r._compute_plot_bounds([g1], bds)).to.be.deep.equal [[0, 10], [5, 6]]
      expect(r._compute_plot_bounds([g1, g2], bds)).to.be.deep.equal [[0, 15], [5, 6]]
