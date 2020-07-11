import {expect} from "assertions"

import {Plot} from "@bokehjs/models/plots/plot"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {PaddingUnits} from "@bokehjs/core/enums"

describe("datarange1d module", () => {

  describe("default creation", () => {
    const r = new DataRange1d()

    it("should have start = null", () => {
      expect(r.start).to.be.null
    })

    it("should have end = null", () => {
      expect(r.end).to.be.null
    })

    // Math.min(null, null) == 0
    it("should have min = 0", () => {
      expect(r.min).to.be.equal(0)
    })

    // Math.max(null, null) == 0
    it("should have max = 0", () => {
      expect(r.max).to.be.equal(0)
    })

    it("should have flipped = false", () => {
      expect(r.flipped).to.be.false
    })

    it("should not be reversed", () => {
      expect(r.is_reversed).to.be.false
    })

    it("should be valid", () => {
      expect(r.is_valid).to.be.true
    })

    it("should have follow = null", () => {
      expect(r.follow).to.be.null
    })

    it("should have follow_interval = null", () => {
      expect(r.follow_interval).to.be.null
    })

    it("should have default_span = 2", () => {
      expect(r.default_span).to.be.equal(2)
    })

    it("should have no computed_renderers", () => {
      expect(r.computed_renderers()).to.be.equal([])
    })
  })

  describe("explicit bounds=(10,20) creation", () => {
    const r = new DataRange1d({start: 10, end:20})

    it("should have start = 10", () => {
      expect(r.start).to.be.equal(10)
    })

    it("should have end = 20", () => {
      expect(r.end).to.be.equal(20)
    })

    it("should have min = 10", () => {
      expect(r.min).to.be.equal(10)
    })

    it("should have max = 20", () => {
      expect(r.max).to.be.equal(20)
    })
  })

  describe("explicit inverted bounds=(20,10) creation", () => {
    const r = new DataRange1d({start: 20, end:10})

    it("should be reversed", () => {
      expect(r.is_reversed).to.be.true
    })
  })

  describe("explicit bounds=(NaN, NaN) creation", () => {
    const r = new DataRange1d({start: NaN, end: NaN})

    it("should be invalid", () => {
      expect(r.is_valid).to.be.false
    })
  })

  describe("reset", () => {

    it("should reset configuration to initial values", () => {
      const r = new DataRange1d({
        range_padding: 0.3,
        range_padding_units: "absolute",
        follow: "end",
        follow_interval: 10,
        default_span: 8,
      })
      expect(r.range_padding).to.be.equal(0.3)
      expect(r.range_padding_units).to.be.equal("absolute")
      expect(r.follow).to.be.equal("end")
      expect(r.follow_interval).to.be.equal(10)
      expect(r.default_span).to.be.equal(8)

      r.range_padding = 0.2
      r.range_padding_units = "percent" as PaddingUnits

      expect(r.range_padding).to.be.equal(0.2)
      expect(r.range_padding_units).to.be.equal("percent")
      expect(r.follow).to.be.equal("end")
      expect(r.follow_interval).to.be.equal(10)
      expect(r.default_span).to.be.equal(8)

      r.reset()

      expect(r.range_padding).to.be.equal(0.3)
      expect(r.range_padding_units).to.be.equal("absolute")
      expect(r.follow).to.be.equal("end")
      expect(r.follow_interval).to.be.equal(10)
      expect(r.default_span).to.be.equal(8)
    })

    // something must call update(...) to update (start, end)
    it("should not reset (start, end)", () => {
      const r = new DataRange1d({start: 4, end: 10})
      r.reset()
      expect(r.start).to.be.equal(4)
      expect(r.end).to.be.equal(10)
    })
  })

  describe("computed_renderers", () => {

    it("should add renderers from one plot", () => {
      const g1 = new GlyphRenderer()
      const p1 = new Plot({renderers: [g1]})
      const r1 = new DataRange1d({plots: [p1]})
      expect(r1.computed_renderers()).to.be.equal([g1])

      const g2 = new GlyphRenderer()
      const p2 = new Plot({renderers: [g1, g2]})
      const r2 = new DataRange1d({plots: [p2]})
      expect(r2.computed_renderers()).to.be.equal([g1, g2])
    })

    it("should add renderers from multiple plot", () => {
      const g1 = new GlyphRenderer()
      const p1 = new Plot({renderers: [g1]})

      const g2 = new GlyphRenderer()
      const p2 = new Plot({renderers: [g2]})

      const r = new DataRange1d({plots: [p1, p2]})
      expect(r.computed_renderers()).to.be.equal([g1, g2])
    })

    it("should respect user-set renderers", () => {
      const g1 = new GlyphRenderer()
      const p1 = new Plot({renderers: [g1]})

      const g2 = new GlyphRenderer()
      const p2 = new Plot({renderers: [g2]})

      const r = new DataRange1d({plots: [p1, p2], renderers: [g2]})
      expect(r.computed_renderers()).to.be.equal([g2])
    })
  })

  describe("_compute_range", () => {

    it("should use default_span when max=min", () => {
      const r0 = new DataRange1d()
      expect(r0._compute_range(3, 3)).to.be.equal([2, 4])

      const r1 = new DataRange1d({default_span: 4})
      expect(r1._compute_range(3, 3)).to.be.equal([1, 5])

      const r2 = new DataRange1d({default_span: 4, range_padding: 0})
      expect(r2._compute_range(3, 3)).to.be.equal([1, 5])
    })

    it("should use default_span as powers of 10 when scale_hint='log'", () => {
      const r0 = new DataRange1d({scale_hint: "log"})
      expect(r0._compute_range(100, 100)).to.be.similar([9.988493699365053, 1001.1519555381683])

      const r1 = new DataRange1d({scale_hint: "log", default_span: 4})
      expect(r1._compute_range(100, 100)).to.be.similar([0.9988493699365047, 10011.519555381703])
    })

    it("should swap max, min when flipped", () => {
      const r = new DataRange1d({flipped: true})
      expect(r._compute_range(3, 3)).to.be.equal([4, 2])
    })

    it("should follow min when follow=start and not flipped", () => {
      const r = new DataRange1d({range_padding: 0, follow: "start", follow_interval: 4})
      expect(r._compute_range(1, 3)).to.be.equal([1, 3])
      expect(r._compute_range(1, 7)).to.be.equal([1, 5])
    })

    it("should follow max when follow=start and flipped", () => {
      const r = new DataRange1d({range_padding: 0, follow: "start", follow_interval: 4, flipped: true})
      expect(r._compute_range(1, 3)).to.be.equal([3, 1])
      expect(r._compute_range(1, 7)).to.be.equal([7, 3])
    })

    it("should follow max when follow=end and not flipped", () => {
      const r = new DataRange1d({range_padding: 0, follow: "end", follow_interval: 4})
      expect(r._compute_range(1, 3)).to.be.equal([1, 3])
      expect(r._compute_range(1, 7)).to.be.equal([3, 7])
    })

    it("should follow min when follow=end and flipped", () => {
      const r = new DataRange1d({range_padding: 0, follow: "end", follow_interval: 4, flipped: true})
      expect(r._compute_range(1, 3)).to.be.equal([3, 1])
      expect(r._compute_range(1, 7)).to.be.equal([5, 1])
    })

    it("should apply percentage range_padding", () => {
      const r0 = new DataRange1d({range_padding: 0.5})
      expect(r0._compute_range(1, 3)).to.be.equal([0.5, 3.5])

      const r1 = new DataRange1d({range_padding: 0})
      expect(r1._compute_range(1, 3)).to.be.equal([1, 3])
    })

    it("should apply absolute range_padding", () => {
      const r0 = new DataRange1d({range_padding: 0.2, range_padding_units: "absolute"})
      expect(r0._compute_range(1, 3)).to.be.equal([0.8, 3.2])

      const r1 = new DataRange1d({range_padding: 0, range_padding_units: "absolute"})
      expect(r1._compute_range(1, 3)).to.be.equal([1, 3])
    })

    it("should apply range_padding logly when scale_hint='log'", () => {
      const r0 = new DataRange1d({range_padding: 0.5, scale_hint: "log"})
      expect(r0._compute_range(0.01, 10)).to.be.similar([0.0017782794100389264, 56.23413251903488])

      const r1 = new DataRange1d({range_padding: 0, scale_hint: "log"})
      expect(r1._compute_range(0.01, 10)).to.be.similar([0.01, 10])

      const r2 = new DataRange1d({range_padding: 0.5, range_padding_units: "absolute", scale_hint: "log"})
      expect(r2._compute_range(1, 10)).to.be.similar([0.5, 10.5])

      const r3 = new DataRange1d({range_padding: 0, range_padding_units: "absolute", scale_hint: "log"})
      expect(r3._compute_range(1, 10)).to.be.similar([1, 10])
    })
  })

  describe("_compute_min_max", () => {

    it("should compute max/min for dimension of a single plot_bounds", () => {
      const r = new DataRange1d()
      const bounds = [
        {x0: 0, x1: 10, y0: 5, y1: 6},
      ]
      expect(r._compute_min_max(bounds, 0)).to.be.equal([0, 10])
      expect(r._compute_min_max(bounds, 1)).to.be.equal([5, 6])
    })

    it("should compute max/min for dimension of multiple plot_bounds", () => {
      const r = new DataRange1d()
      const bounds0 = [
        {x0: 0, x1: 10, y0: 5, y1: 6},
        {x0: 0, x1: 15, y0: 5.5, y1: 5.6},
      ]
      expect(r._compute_min_max(bounds0, 0)).to.be.equal([0, 15])
      expect(r._compute_min_max(bounds0, 1)).to.be.equal([5, 6])

      const bounds1 = [
        {x0: 0, x1: 10, y0: 5, y1: 6},
        {x0: 0, x1: 15, y0: 5.5, y1: 5.6},
        {x0: -10, x1: 15, y0: 0, y1: 2},
      ]
      expect(r._compute_min_max(bounds1, 0)).to.be.equal([-10, 15])
      expect(r._compute_min_max(bounds1, 1)).to.be.equal([0, 6])
    })
  })

  describe("_computed_plot_bounds", () => {

    it("should compute bounds from configured renderers", () => {
      const r = new DataRange1d()

      const g1 = new GlyphRenderer()
      const g2 = new GlyphRenderer()
      const g3 = new GlyphRenderer()

      const bounds = new Map([
        [g1, {x0: 0, x1: 10, y0: 5, y1: 6}],
        [g2, {x0: 0, x1: 15, y0: 5.5, y1: 5.6}],
        [g3, {x0: -10, x1: 15, y0: 0, y1: 2}],
      ])

      expect(r._compute_plot_bounds([g1], bounds)).to.be.equal({x0: 0, x1: 10, y0: 5, y1: 6})
      expect(r._compute_plot_bounds([g1, g2], bounds)).to.be.equal({x0: 0, x1: 15, y0: 5, y1: 6})
    })

    it("should use invisble renderers by default", () => {
      const r = new DataRange1d()

      const g1 = new GlyphRenderer({visible: false})
      const g2 = new GlyphRenderer()
      const g3 = new GlyphRenderer()

      const bounds = new Map([
        [g1, {x0: 0, x1: 10, y0: 5, y1: 6}],
        [g2, {x0: 0, x1: 15, y0: 5.5, y1: 5.6}],
        [g3, {x0: -10, x1: 15, y0: 0, y1: 2}],
      ])

      expect(r._compute_plot_bounds([g1], bounds)).to.be.equal({x0: 0, x1: 10, y0: 5, y1: 6})
      expect(r._compute_plot_bounds([g1, g2], bounds)).to.be.equal({x0: 0, x1: 15, y0: 5, y1: 6})
    })

    it("should skip invisble renderers if only_visible=false", () => {
      const r = new DataRange1d({only_visible: true})

      const g1 = new GlyphRenderer()
      const g2 = new GlyphRenderer({visible: false})
      const g3 = new GlyphRenderer()

      const bounds = new Map([
        [g1, {x0: 0, x1: 10, y0: 5, y1: 6}],
        [g2, {x0: 0, x1: 15, y0: 5.5, y1: 5.6}],
        [g3, {x0: -10, x1: 15, y0: 0, y1: 2}],
      ])

      expect(r._compute_plot_bounds([g1], bounds)).to.be.equal({x0: 0, x1: 10, y0: 5, y1: 6})
      expect(r._compute_plot_bounds([g1, g2], bounds)).to.be.equal({x0: 0, x1: 10, y0: 5, y1: 6})
    })
  })

  describe("update", () => {

    it("should update its start and end values", () => {
      const g = new GlyphRenderer({id: "id"})
      const p = new Plot({renderers: [g]})
      const r = new DataRange1d({plots: [p]})

      const bounds = new Map([
        [g, {x0: -10, x1: -6, y0: 5, y1: 6}],
      ])

      r.update(bounds, 0, p)
      expect(r.start).to.be.equal(-10.2)
    })

    it("should not update its start or end values to NaN when log", () => {
      const g = new GlyphRenderer({id: "id"})
      const p = new Plot({renderers: [g]})
      const r = new DataRange1d({scale_hint: "log", plots: [p]})

      const bounds = new Map([
        [g, {x0: Infinity, x1: -Infinity, y0: 5, y1: 6}],
      ])

      r.update(bounds, 0, p)
      expect(r.start).to.not.be.NaN
      expect(r.end).to.not.be.NaN
    })
  })

  describe("changing model attribute", () => {

  })

  describe("adjust_bounds_for_aspect", () => {
    it("should preserve y axis when it is larger", () => {
      const r = new DataRange1d()
      const bounds = r.adjust_bounds_for_aspect({x0: 0, x1: 1, y0: 0, y1: 2}, 4)

      expect(bounds.x0).to.be.equal(-3.5)
      expect(bounds.x1).to.be.equal(4.5)
      expect(bounds.y0).to.be.equal(0)
      expect(bounds.y1).to.be.equal(2)
    })

    it("should preserve x axis when it is larger", () => {
      const r = new DataRange1d()
      const bounds = r.adjust_bounds_for_aspect({x0: 0, x1: 8, y0: 0, y1: 1}, 4)

      expect(bounds.x0).to.be.equal(0)
      expect(bounds.x1).to.be.equal(8)
      expect(bounds.y0).to.be.equal(-0.5)
      expect(bounds.y1).to.be.equal(1.5)
    })
  })
})
