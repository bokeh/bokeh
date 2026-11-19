import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"
import {figure} from "@bokehjs/api/figure"
import {CartesianMapping} from "@bokehjs/models/coordinates/cartesian_mapping"
import {CoordinateMapping} from "@bokehjs/models/coordinates/coordinate_mapping"
import {SubplotMapping} from "@bokehjs/models/coordinates/subplot_mapping"
import {PolarMapping} from "@bokehjs/models/coordinates/polar_mapping"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {DataRange1d} from "@bokehjs/models/ranges/data_range1d"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {PolarAxis} from "@bokehjs/models/axes/polar_axis"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {PolarTransform} from "@bokehjs/models/expressions/polar"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"

describe("Coordinate mappings", () => {
  it("uses explicit Cartesian ranges and scales with ordinary glyphs and tools", async () => {
    const mapping = CartesianMapping.create({x_range: Range1d.create({start: 1, end: 100}),
                                             y_range: Range1d.create({start: 0, end: 10}), x_scale: LogScale.create()})
    const p = figure({coordinate_system: mapping, width: 300, height: 300, tools: ["box_zoom"]})
    const r = p.segment([1], [2], [100], [8])
    const {view} = await display(p)
    expect(mapping instanceof CoordinateMapping).to.be.true
    expect(p.x_range).to.be.identical(mapping.x_range)
    expect(p.x_scale).to.be.identical(mapping.x_scale)
    const rv = view.owner.get_one(r)
    expect(rv.coordinates.is_separable).to.be.true
    expect(rv.coordinates.invert(...rv.coordinates.compute(10, 5))).to.be.similar([10, 5])
    mapping.x_range = Range1d.create({start: 1, end: 1000})
    await view.ready
    expect(p.x_range).to.be.identical(mapping.x_range)
    expect(rv.coordinates.invert(...rv.coordinates.compute(10, 5))).to.be.similar([10, 5])
    p.width = 250
    await view.ready
    expect(rv.coordinates.compute(10, 5)).to.be.similar([view.frame.x_scale.compute(10), view.frame.y_scale.compute(5)])
  })

  it("infers categorical scales and preserves source autoranging for Cartesian mappings", async () => {
    const mapping = CartesianMapping.create({x_range: FactorRange.create({factors: ["a", "b"]})})
    const p = figure({coordinate_system: mapping, tools: []})
    p.scatter(["a", "b"], [2, 8])
    const {view} = await display(p)
    expect(mapping.x_scale instanceof CategoricalScale).to.be.true
    expect(p.y_range instanceof DataRange1d).to.be.true
    expect(p.y_range.start < 2 && p.y_range.end > 8).to.be.true
    expect(view.polar_transform).to.be.null
  })

  it("uses named extra ranges and fresh frame scales in explicit Cartesian figures", async () => {
    const p = figure({coordinate_system: CartesianMapping.create({x_range: Range1d.create({start: 0, end: 10}),
                                                                  y_range: Range1d.create({start: 0, end: 10})}),
                      extra_y_ranges: {foo: Range1d.create({start: 0, end: 100})}, width: 300, height: 300, tools: []})
    const r = p.scatter([5], [50], {y_range_name: "foo"})
    const {view} = await display(p)
    const rv = view.owner.get_one(r)
    expect(rv.coordinates.compute(5, 50)).to.be.similar([view.frame.x_scale.compute(5), view.frame.y_scales.get("foo")!.compute(50)])
    p.extra_y_ranges = {foo: Range1d.create({start: 0, end: 200})}
    p.width = 250
    await view.ready
    expect(rv.coordinates.compute(5, 50)).to.be.similar([view.frame.x_scale.compute(5), view.frame.y_scales.get("foo")!.compute(50)])
    expect(view.map_from_screen(view.frame.x_scale.compute(5), view.frame.y_scale.compute(5))).to.be.similar([5, 5])
  })

  it("preserves plain Cartesian autoranging across named ranges and explicit renderer lists", async () => {
    const extra = DataRange1d.create()
    const p = figure({extra_y_ranges: {foo: extra}, tools: []})
    const r = p.line([0, 1], [100, 200], {y_range_name: "foo"})
    expect(p.y_range instanceof DataRange1d).to.be.true
    ;(p.y_range as DataRange1d).renderers = [r]
    await display(p)
    expect(p.y_range.start).to.be.similar(95)
    expect(p.y_range.end).to.be.similar(205)
    expect(extra.start).to.be.similar(95)
    expect(extra.end).to.be.similar(205)
  })

  it("rejects foreign renderer coordinate systems in a polar parent", async () => {
    const p = figure({coordinate_system: PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})}), tools: []})
    const coordinates = SubplotMapping.create({x_source: Range1d.create({start: 0, end: 1}),
                                               y_source: Range1d.create({start: 0, end: 1}),
                                               x_target: Range1d.create({start: 0, end: 1}),
                                               y_target: Range1d.create({start: 0, end: 1})})
    const glyph = Scatter.create({x: 0.5, y: 0.5})
    expect(() => p.add_glyph(glyph, undefined, {coordinates})).to.throw(Error, "require a Cartesian parent")
    expect(() => p.scatter([0.5], [0.5], {coordinates})).to.throw(Error, "require a Cartesian parent")
    const raw = GlyphRenderer.create({glyph, coordinates, data_source: ColumnDataSource.create()})
    p.add_renderers(raw)
    const axis = PolarAxis.create({coordinates})
    p.add_layout(axis)
    const {view} = await display(p)
    expect(view.owner.get_one(raw).is_renderable).to.be.false
    expect(view.owner.get_one(axis).is_renderable).to.be.false
  })

  it("rejects native polar renderer mappings on a Cartesian parent", async () => {
    const p = figure({tools: []})
    const coordinates = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
    expect(() => p.scatter([2], [90], {coordinates})).to.throw(Error, "matching polar parent")
    const raw = GlyphRenderer.create({glyph: Scatter.create(), coordinates, data_source: ColumnDataSource.create()})
    p.add_renderers(raw)
    const {view} = await display(p)
    expect(view.owner.get_one(raw).is_renderable).to.be.false
  })

  it("rejects an embedding as the root coordinate system through property validation", () => {
    const p = figure({tools: []})
    const coordinates = SubplotMapping.create({x_target: Range1d.create({start: 0, end: 1}),
                                               y_target: Range1d.create({start: 0, end: 1})})
    expect(() => p.setv({coordinate_system: coordinates})).to.throw(Error)
  })

  it("updates Cartesian subplot target scales without reloading glyph data", async () => {
    const p = figure({x_range: [0, 10], y_range: [0, 10], tools: []})
    const sub = p.subplot({x_source: Range1d.create({start: 0, end: 1}), y_source: Range1d.create({start: 0, end: 1}),
                           x_target: p.x_range, y_target: p.y_range})
    const renderer = sub.scatter([0.5], [0.5])
    const {view} = await display(p)
    const rv = view.owner.get_one(renderer)
    using update = restorable(sinon.spy(rv, "update_data"))
    p.x_range.setv({start: 1, end: 11})
    p.y_range.setv({start: 2, end: 12})
    await view.ready
    expect(update.called).to.be.false
    expect(rv.coordinates.compute(0.5, 0.5)).to.be.similar([view.frame.bbox.hcenter, view.frame.bbox.vcenter])
  })

  it("preserves legacy Cartesian subplot source autoranging with match_aspect", async () => {
    const p = figure({x_range: [0, 10], y_range: [0, 100], width: 400, height: 400, match_aspect: true, tools: []})
    const x_source = DataRange1d.create({range_padding: 0})
    const y_source = DataRange1d.create({range_padding: 0})
    const sub = p.subplot({x_source, y_source, x_target: p.x_range, y_target: p.y_range})
    const renderer = sub.scatter([0, 1], [0, 1])
    x_source.renderers = [renderer]
    y_source.renderers = [renderer]
    await display(p)
    expect([x_source.start, x_source.end]).to.be.similar([0, 1])
    expect([y_source.start, y_source.end]).to.be.similar([-4.5, 5.5])
  })

  it("uses the view camera when a renderer explicitly reuses the root polar mapping", async () => {
    const system = PolarMapping.create({radial_range: Range1d.create({start: 0, end: 10})})
    const p = figure({coordinate_system: system, tools: []})
    const r = p.scatter([5], [90], {coordinates: system})
    const {view} = await display(p)
    const rv = view.owner.get_one(r)
    expect(rv.coordinates).to.be.identical(view.polar_transform!)
    const [sx, sy] = rv.coordinates.compute(5, 90)
    view.set_polar_viewport({x: 23, y: -17, scale: 1})
    await view.ready
    expect(rv.coordinates.compute(5, 90)).to.be.similar([sx + 23, sy - 17])
  })

  it("preserves signed-radius PolarTransform expressions in legacy subcoordinates", async () => {
    const source = ColumnDataSource.create({data: {radius: [-2, 2], angle: [0, Math.PI]}})
    const transform = PolarTransform.create()
    expect([...transform.v_compute(source).x]).to.be.similar([-2, -2])
    expect([...transform.v_compute(source).y]).to.be.similar([0, 0])
    const p = figure({x_range: [0, 1], y_range: [0, 1], tools: []})
    const sub = p.subplot({x_source: Range1d.create({start: -3, end: 3}), y_source: Range1d.create({start: -3, end: 3}),
                           x_target: Range1d.create({start: 0, end: 1}), y_target: Range1d.create({start: 0, end: 1})})
    const r = sub.scatter({x: {expr: transform.x}, y: {expr: transform.y}, source})
    const {view} = await display(p)
    const rv = view.owner.get_one(r)
    expect(r.coordinates instanceof SubplotMapping).to.be.true
    expect(rv.coordinates.is_separable).to.be.true
    const [sx, sy] = rv.coordinates.compute(-2, 0)
    expect(rv.hit_test({type: "point", sx, sy})!.indices).to.be.equal([0, 1])
  })
})
