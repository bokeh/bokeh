import * as sinon from "sinon"
import {assert} from "@bokehjs/core/util/assert"
import {PathPlacement} from "@bokehjs/models/graphics/path_placement"
import {ColumnDataSource, FactorRange, TeeHead} from "@bokehjs/models"
import {SegmentView} from "@bokehjs/models/glyphs/segment"
import {figure} from "@bokehjs/api/plotting"
import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

describe("whisker()", () => {
  it("should reject invalid dimensions from JavaScript callers", () => {
    expect(() => {
      // @ts-expect-error Exercise an untyped JavaScript caller.
      figure().whisker({dimension: "horizontal"})
    }).to.throw(Error, "dimension must be 'height' or 'width'")
  })

  it("should default to the underlay level", () => {
    expect(figure().whisker().level).to.be.equal("underlay")
  })

  it("should preserve the supplied source", () => {
    const source = ColumnDataSource.create()
    expect(figure().whisker({source}).data_source).to.be.identical(source)
  })

  it("should accept positional coordinates and options", () => {
    const {glyph, level} = figure().whisker(5, 2, 8, {dimension: "width", level: "annotation"})
    expect([glyph.x0, glyph.y0, glyph.x1, glyph.y1]).to.be.equal([
      {value: 2}, {value: 5}, {value: 8}, {value: 5},
    ])
    expect(level).to.be.equal("annotation")
  })

  it("should share the generated base column when the source has a conflicting column name", () => {
    const source = ColumnDataSource.create({data: {x0: [99]}})
    const {glyph} = figure().whisker([2], 1, 3, {source})
    expect(glyph.x0).to.be.equal({field: "x0__1"})
    expect(glyph.x1).to.be.equal(glyph.x0)
    expect(source.data).to.be.equal({x0: [99], x0__1: [2]})
  })

  it("should use the whisker coordinates when raw segment coordinates are supplied", () => {
    const renderer = figure().whisker({
      base: 1, lower: 2, upper: 3,
      // @ts-expect-error Simulate an untyped JavaScript caller.
      x0: 99,
    })
    expect(renderer.glyph.x0).to.be.equal({value: 1})
  })

  for (const node of ["start", "end"] as const) {
    it(`should place a field-sized tee at the ${node}`, () => {
      const renderer = figure().whisker({cap_size: {field: "width"}})
      const path_marking = renderer.glyph.path_markings[node == "start" ? 0 : 1]
      assert(path_marking instanceof PathPlacement)
      expect(path_marking.positions).to.be.equal({value: node})
      assert(path_marking.marking instanceof TeeHead)
      expect(path_marking.marking.size).to.be.equal({field: "width"})
    })
  }

  for (const dimension of ["height", "width"] as const) {
    async function categorical_whisker() {
      const range = FactorRange.create({factors: [["a", "first"], ["b", "second"], ["c", "third"]]})
      const p = figure(dimension == "height" ? {x_range: range, y_range: [-3, 4]} : {x_range: [-3, 4], y_range: range})
      const source = ColumnDataSource.create({
        data: {base: range.factors, lower: [-2, 1, 2], upper: [-1, 3, 2]},
      })
      const renderer = p.whisker({dimension, source})
      const {view} = await display(p)
      const renderer_view = view.owner.get_one(renderer)
      const {glyph} = renderer_view
      assert(glyph instanceof SegmentView)
      return {renderer_view, glyph}
    }

    it(`should map ${dimension} whiskers onto a categorical base`, async () => {
      const {glyph} = await categorical_whisker()
      expect(Array.from(glyph.sx0).every(Number.isFinite)).to.be.true
      expect(Array.from(glyph.sy0).every(Number.isFinite)).to.be.true
      const [base0, base1, lower, upper] = dimension == "height"
        ? [glyph.sx0, glyph.sx1, glyph.sy0, glyph.sy1]
        : [glyph.sy0, glyph.sy1, glyph.sx0, glyph.sx1]
      expect(base0).to.be.equal(base1)
      expect(lower).to.not.be.equal(upper)
    })

    it(`should orient the caps of a zero-length ${dimension} whisker`, async () => {
      const {renderer_view, glyph} = await categorical_whisker()
      const ctx = glyph.canvas.create_layer().ctx
      using rotate = restorable(sinon.spy(ctx, "rotate"))
      renderer_view.paint(ctx)
      expect(rotate.callCount).to.be.equal(6)
      expect(rotate.lastCall.args[0]).to.be.equal(dimension == "height" ? 0 : Math.PI/2)
    })
  }
})
