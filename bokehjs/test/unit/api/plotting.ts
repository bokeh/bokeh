import {expect} from "assertions"

import {figure} from "@bokehjs/api/plotting"
import {ColumnDataSource, LinearAxis} from "@bokehjs/models"

describe("in api/plotting module", () => {
  describe("figure()", () => {
    describe("glyph methods", () => {
      it("should validate arguments", () => {
        const source = new ColumnDataSource()

        const gr0 = figure().circle()
        expect(gr0.glyph.x).to.be.equal({field: "x"})
        expect(gr0.glyph.y).to.be.equal({field: "y"})
        expect(gr0.glyph.radius).to.be.equal({field: "radius"})
        expect(gr0.data_source).to.not.be.equal(source)

        const gr1 = figure().circle({source})
        expect(gr1.glyph.x).to.be.equal({field: "x"})
        expect(gr1.glyph.y).to.be.equal({field: "y"})
        expect(gr1.glyph.radius).to.be.equal({field: "radius"})
        expect(gr1.data_source).to.be.equal(source)

        const gr2 = figure().circle(5, 10, 0.5)
        expect(gr2.glyph.x).to.be.equal({value: 5})
        expect(gr2.glyph.y).to.be.equal({value: 10})
        expect(gr2.glyph.radius).to.be.equal({value: 0.5})
        expect(gr2.data_source).to.not.be.equal(source)

        const gr3 = figure().circle(5, 10, 0.5, {source})
        expect(gr3.glyph.x).to.be.equal({value: 5})
        expect(gr3.glyph.y).to.be.equal({value: 10})
        expect(gr3.glyph.radius).to.be.equal({value: 0.5})
        expect(gr3.data_source).to.be.equal(source)

        const gr4 = figure().circle([1, 2, 3], [4, 5, 6], [7, 8, 9])
        expect(gr4.glyph.x).to.be.equal({field: "x"})
        expect(gr4.glyph.y).to.be.equal({field: "y"})
        expect(gr4.glyph.radius).to.be.equal({field: "radius"})
        expect(gr4.data_source).to.not.be.equal(source)

        const gr5 = figure().circle([1, 2, 3], [4, 5, 6], [7, 8, 9], {source})
        expect(gr5.glyph.x).to.be.equal({field: "x"})
        expect(gr5.glyph.y).to.be.equal({field: "y"})
        expect(gr5.glyph.radius).to.be.equal({field: "radius"})
        expect(gr5.data_source).to.be.equal(source)

        const gr6 = figure().circle({field: "X"}, {field: "Y"}, 0.5)
        expect(gr6.glyph.x).to.be.equal({field: "X"})
        expect(gr6.glyph.y).to.be.equal({field: "Y"})
        expect(gr6.glyph.radius).to.be.equal({value: 0.5})
        expect(gr6.data_source).to.not.be.equal(source)

        const gr7 = figure().circle({field: "X"}, {field: "Y"}, 0.5, {source})
        expect(gr7.glyph.x).to.be.equal({field: "X"})
        expect(gr7.glyph.y).to.be.equal({field: "Y"})
        expect(gr7.glyph.radius).to.be.equal({value: 0.5})
        expect(gr7.data_source).to.be.equal(source)

        const gr8 = figure().circle({field: "X"}, {field: "Y"}, {field: "R"})
        expect(gr8.glyph.x).to.be.equal({field: "X"})
        expect(gr8.glyph.y).to.be.equal({field: "Y"})
        expect(gr8.glyph.radius).to.be.equal({field: "R"})
        expect(gr8.data_source).to.not.be.equal(source)

        const gr9 = figure().circle({field: "X"}, {field: "Y"}, {field: "R"}, {source})
        expect(gr9.glyph.x).to.be.equal({field: "X"})
        expect(gr9.glyph.y).to.be.equal({field: "Y"})
        expect(gr9.glyph.radius).to.be.equal({field: "R"})
        expect(gr9.data_source).to.be.equal(source)

        const gr10 = figure().circle({field: "X"}, {field: "Y"}, {field: "R"}, {x: {field: "X1"}, source})
        expect(gr10.glyph.x).to.be.equal({field: "X1"})
        expect(gr10.glyph.y).to.be.equal({field: "Y"})
        expect(gr10.glyph.radius).to.be.equal({field: "R"})
        expect(gr10.data_source).to.be.equal(source)

        expect(() => {
          // @ts-ignore TS2575: No overload expects 2 arguments, (...)
          figure().circle(5, 10)
        }).to.throw(Error, /^wrong number of arguments/)

        expect(() => {
          // @ts-ignore TS2559: Type '0' has no properties in common with type 'Partial<CircleArgs>'
          figure().circle(5, 10, 0.5, 0)
        }).to.throw(Error, /^expected optional arguments/)

        expect(() => {
          // @ts-ignore TS2353: Object literal may only specify known properties, (...)
          figure().circle(5, 10, {source}, 0)
        }).to.throw(Error, /^invalid value for 'radius' parameter at position 2/)
      })

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
