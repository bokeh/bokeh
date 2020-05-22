import {expect} from "chai"
import {create_glyph_renderer_view} from "../models/glyphs/glyph_utils"

import {Fill, Line, Text, Visuals} from "@bokehjs/core/visuals"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {Circle, CircleView} from "@bokehjs/models/glyphs/circle"
import * as text_glyph from "@bokehjs/models/glyphs/text"

describe("Fill", () => {

  describe("set_value", () => {
    for (const [attr, spec, value] of [
      ['fillStyle', 'fill_color', 'red'],
      ['globalAlpha', 'fill_alpha', 0.5],
    ]) {
      it(`should set canvas context ${attr} value from ${spec} spec value`, () =>{
        const ctx = {} as any
        const attrs = {} as any
        attrs[spec] = {value}
        const model = new Circle(attrs)
        const fill = new Fill(model)
        fill.set_value(ctx)
        expect(ctx[attr]).to.be.equal(value)
      })
    }
  })

  describe("doit", () => {
    it("should be false if fill_color is null", () => {
      const attrs = {fill_alpha: {value: 1}, fill_color: {value: null}}
      const model = new Circle(attrs)
      const fill = new Fill(model)
      expect(fill.doit).to.be.false
    })
    it("should be false if fill_alpha is 0", () => {
      const attrs = {fill_alpha: {value: 0}, fill_color: {value: "red"}}
      const model = new Circle(attrs)
      const fill = new Fill(model)
      expect(fill.doit).to.be.false
    })
    it("should be true otherwise", () => {
      const attrs = {fill_alpha: {value: 1}, fill_color: {value: "red"}}
      const model = new Circle(attrs)
      const fill = new Fill(model)
      expect(fill.doit).to.be.true
    })
  })

})

describe("Line", () => {

  describe("set_value", () => {
    for (const [attr, spec, value] of [
      ['strokeStyle', 'line_color', 'red'],
      ['globalAlpha', 'line_alpha', 0.5],
      ['lineWidth', 'line_width', 2],
      ['lineJoin', 'line_join', 'miter'],
      ['lineCap', 'line_cap', 'butt'],
      ['lineDashOffset', 'line_dash_offset', 2],

      // TS complains destructuring this, just test (redundantly) by hand below
      //['lineDash', 'line_dash', [1,2]],
    ]) {
      it(`should set canvas context ${attr} value from ${spec} spec value`, () =>{
        const ctx = {} as any
        ctx.setLineDash = function(x: number) { ctx.lineDash = x }
        ctx.setLineDashOffset = function(x: number) { ctx.lineDashOffset = x }
        const attrs = {line_dash: [1, 2]} as any
        attrs[spec] = {value}
        const model = new Circle(attrs)
        const line = new Line(model)
        line.set_value(ctx)
        expect(ctx[attr]).to.be.equal(value)
        expect(ctx.lineDash).to.be.deep.equal([1, 2])
      })
    }
  })
  describe("doit", () => {
    it("should be false if line_color is null", () => {
      const attrs = {line_alpha: {value: 1}, line_color: {value: null}, line_width: {value: 1}}
      const model = new Circle(attrs)
      const line = new Line(model)
      expect(line.doit).to.be.false
    })
    it("should be false if line_width is 0", () => {
      const attrs = {line_alpha: {value: 1}, line_color: {value: "red"}, line_width: {value: 0}}
      const model = new Circle(attrs)
      const line = new Line(model)
      expect(line.doit).to.be.false
    })
    it("should be false if line_alpha is 0", () => {
      const attrs = {line_alpha: {value: 0}, line_color: {value: "red"}, line_width: {value: 1}}
      const model = new Circle(attrs)
      const line = new Line(model)
      expect(line.doit).to.be.false
    })
    it("should be true otherwise", () => {
      const attrs = {line_alpha: {value: 1}, line_color: {value: "red"}, line_width: {value: 1}}
      const model = new Circle(attrs)
      const line = new Line(model)
      expect(line.doit).to.be.true
    })
  })

})

describe("Text", () => {

  describe("set_value", () => {
    for (const [attr, spec, value] of [
      // "font" handled below
      ['fillStyle',    'text_color', 'red'],
      ['globalAlpha',  'text_alpha', '0.5'],
      ['textAlign',    'text_align', 'center'],
      ['textBaseline', 'text_baseline', 'bottom'],
    ]) {
      it(`should set canvas context ${attr} value from ${spec} spec value`, () =>{
        const ctx = {} as any
        const attrs = {text_font: 'times', text_font_size: "16px", text_font_style: "bold"} as any
        attrs[spec] = {value}
        const model = new text_glyph.Text(attrs)
        const text = new Text(model)
        text.set_value(ctx)
        expect(ctx[attr]).to.be.equal(value)
        expect(ctx.font).to.be.equal("bold 16px times")
      })
    }
  })
  describe("doit", () => {
    it("should be false if text_color is null", () => {
      const attrs = {text_alpha: {value: 1}, text_color: {value: null}}
      const model = new text_glyph.Text(attrs)
      const text = new Text(model)
      expect(text.doit).to.be.false
    })
    it("should be false if text_alpha is 0", () => {
      const attrs = {text_alpha: {value: 0}, text_color: {value: "red"}}
      const model = new text_glyph.Text(attrs)
      const text = new Text(model)
      expect(text.doit).to.be.false
    })
    it("should be true otherwise", () => {
      const attrs = {text_alpha: {value: 1}, text_color: {value: "red"}}
      const model = new text_glyph.Text(attrs)
      const text = new Text(model)
      expect(text.doit).to.be.true
    })
  })

})

describe("Visuals", () => {

  it("should set the correct visual values when values are vectorized", () => {
    const source = new ColumnDataSource({data: {fill_alpha: [0, 0.5, 1]}})
    const attrs = {fill_alpha: {field: "fill_alpha"}}

    const circle = new Circle(attrs)
    const visuals = new Visuals(circle) as Visuals & {fill: Fill}

    visuals.warm_cache(source)

    const ctx = {} as any
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(0.5)
  })

  it("should set the correct visual values when values are vectorized and all_indices is set", () => {
    const source = new ColumnDataSource({data: {fill_alpha: [0, 0.5, 1]}})
    const attrs = {fill_alpha: {field: "fill_alpha"}}

    const circle = new Circle(attrs)
    const visuals = new Visuals(circle) as Visuals & {fill: Fill}

    visuals.warm_cache(source)
    visuals.set_all_indices([1, 2])

    const ctx = {} as any
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(1)
  })

  describe("interacting with GlyphViews", () => {

    it("set_all_indices should be called by the glyph view", async () => {
      const attrs = {fill_alpha: {field: "fill_alpha"}}

      const circle = new Circle(attrs)
      const renderer_view = await create_glyph_renderer_view(circle, {fill_alpha: [0, 0.5, 1]})

      const filter = new IndexFilter({indices: [1, 2]})
      renderer_view.model.view = new CDSView({source: renderer_view.model.data_source, filters: [filter]})
      //need to manually set_data because signals for renderer aren't connected by create_glyph_view util
      renderer_view.set_data()

      const ctx = {} as any
      (renderer_view.glyph as CircleView).visuals.fill.set_vectorize(ctx, 1)
      expect(ctx.globalAlpha).to.be.equal(1)
    })
  })
})
