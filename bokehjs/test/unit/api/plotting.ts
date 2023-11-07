import {expect} from "assertions"

import {figure} from "@bokehjs/api/plotting"
import {LinearAxis} from "@bokehjs/models"

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

    it("should support axis property proxying", () => {
      const p = figure({x_axis_label: "X0", y_axis_label: "Y0"})

      expect(p.xaxes.length).to.be.equal(1)
      expect(p.yaxes.length).to.be.equal(1)
      expect(p.axes.length).to.be.equal(2)

      expect(p.xaxes.map((axis) => axis.axis_label)).to.be.equal(["X0"])
      expect(p.yaxes.map((axis) => axis.axis_label)).to.be.equal(["Y0"])

      p.add_layout(new LinearAxis(), "left")
      p.add_layout(new LinearAxis(), "right")

      p.add_layout(new LinearAxis(), "above")
      p.add_layout(new LinearAxis(), "below")

      expect(p.xaxes.length).to.be.equal(3)
      expect(p.yaxes.length).to.be.equal(3)
      expect(p.axes.length).to.be.equal(6)

      p.xaxes.forEach((axis) => axis.axis_label = "X1")
      p.yaxes.forEach((axis) => axis.axis_label = "Y1")

      expect(p.xaxes.map((axis) => axis.axis_label)).to.be.equal(["X1", "X1", "X1"])
      expect(p.yaxes.map((axis) => axis.axis_label)).to.be.equal(["Y1", "Y1", "Y1"])

      p.xaxis.each((axis) => axis.axis_label = "X2")
      p.yaxis.each((axis) => axis.axis_label = "Y2")

      expect(p.xaxes.map((axis) => axis.axis_label)).to.be.equal(["X2", "X2", "X2"])
      expect(p.yaxes.map((axis) => axis.axis_label)).to.be.equal(["Y2", "Y2", "Y2"])

      p.xaxis.axis_label = "X3"
      p.yaxis.axis_label = "Y3"

      expect(p.xaxes.map((axis) => axis.axis_label)).to.be.equal(["X3", "X3", "X3"])
      expect(p.yaxes.map((axis) => axis.axis_label)).to.be.equal(["Y3", "Y3", "Y3"])

      p.add_layout(new LinearAxis(), "left")
      p.add_layout(new LinearAxis(), "right")

      p.add_layout(new LinearAxis(), "above")
      p.add_layout(new LinearAxis(), "below")

      p.xaxis.axis_label = "X4"
      p.yaxis.axis_label = "Y4"

      expect(p.xaxes.map((axis) => axis.axis_label)).to.be.equal(["X4", "X4", "X4", "X4", "X4"])
      expect(p.yaxes.map((axis) => axis.axis_label)).to.be.equal(["Y4", "Y4", "Y4", "Y4", "Y4"])

      // TODO: this should be disallowed on the type level
      expect(() => p.xaxis.axis_label).to.throw()
      expect(() => p.yaxis.axis_label).to.throw()
    })

    it("should throw if multiple legend_* attributes are provided", () => {
      expect(() => figure().scatter(0, 0, {legend_label: "circle", legend_field: "circle"})).to.throw()
    })
  })
})
