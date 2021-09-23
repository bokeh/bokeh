import {expect} from "assertions"

import {figure} from "@bokehjs/api/plotting"

describe("in api/plotting module", () => {
  describe("figure()", () => {
    describe("glyph methods", () => {
      it("should support '_units' auxiliary properties", () => {
        const p = figure()
        const attrs = {x: 0, y: 0, inner_radius: 1, outer_radius: 2}

        const r0 = p.annular_wedge({...attrs})
        expect(r0.glyph.start_angle).to.be.equal({field: "start_angle"})
        expect(r0.glyph.end_angle).to.be.equal({field: "end_angle"})

        const r1 = p.annular_wedge({
          ...attrs,
          start_angle: [0, 120, 240],
          end_angle: [60, 180, 300], end_angle_units: "deg",
        })
        expect(r1.glyph.start_angle).to.be.equal({field: "start_angle"})
        expect(r1.glyph.end_angle).to.be.equal({field: "end_angle", units: "deg"})

        const r2 = p.annular_wedge({
          ...attrs,
          start_angle: [0, 120, 240], start_angle_units: "deg",
          end_angle: [60, 180, 300],
        })
        expect(r2.glyph.start_angle).to.be.equal({field: "start_angle", units: "deg"})
        expect(r2.glyph.end_angle).to.be.equal({field: "end_angle"})

        const r3 = p.annular_wedge({
          ...attrs,
          start_angle: [0, 120, 240], start_angle_units: "deg",
          end_angle: [60, 180, 300], end_angle_units: "deg",
        })
        expect(r3.glyph.start_angle).to.be.equal({field: "start_angle", units: "deg"})
        expect(r3.glyph.end_angle).to.be.equal({field: "end_angle", units: "deg"})

        const r4 = p.annular_wedge({
          ...attrs,
          start_angle: 120,
          end_angle: 180, end_angle_units: "deg",
        })
        expect(r4.glyph.start_angle).to.be.equal({value: 120})
        expect(r4.glyph.end_angle).to.be.equal({value: 180, units: "deg"})

        const r5 = p.annular_wedge({
          ...attrs,
          start_angle: 120, start_angle_units: "deg",
          end_angle: 180,
        })
        expect(r5.glyph.start_angle).to.be.equal({value: 120, units: "deg"})
        expect(r5.glyph.end_angle).to.be.equal({value: 180})

        const r6 = p.annular_wedge({
          ...attrs,
          start_angle: 120, start_angle_units: "deg",
          end_angle: 180, end_angle_units: "deg",
        })
        expect(r6.glyph.start_angle).to.be.equal({value: 120, units: "deg"})
        expect(r6.glyph.end_angle).to.be.equal({value: 180, units: "deg"})

        expect(() => p.annular_wedge({...attrs, start_angle_units: "deg"})).to.throw(Error)
        expect(() => p.annular_wedge({...attrs, end_angle_units: "deg"})).to.throw(Error)
      })
    })

    it("should throw if multiple legend_* attributes are provided", () => {
      expect(() => figure().circle(0, 0, {legend_label: "circle", legend_field: "circle"})).to.throw()
    })
  })
})
