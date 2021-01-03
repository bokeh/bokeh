import {expect} from "assertions"
import {create_glyph_renderer_view} from "../models/glyphs/_util"

import {Fill, Line, Text} from "@bokehjs/core/visuals"
import {Context2d} from "@bokehjs/core/util/canvas"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {Circle, CircleView} from "@bokehjs/models/glyphs/circle"
import * as text_glyph from "@bokehjs/models/glyphs/text"

import {Model} from "@bokehjs/model"
import {View} from "@bokehjs/core/view"

class SomeView extends View {
  model: Model
}

describe("core/visuals", () => {

  describe("Fill", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", () => {
        const attrs = {
          fill_color: "red",
          fill_alpha: 0.6,
        }
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const fill = new Fill(view)

        const ctx = {} as Context2d
        fill.set_value(ctx)

        expect(ctx.fillStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
      })
    })

    describe("doit", () => {
      it("should be false if fill_color is null", () => {
        const attrs = {fill_alpha: {value: 1}, fill_color: {value: null}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const fill = new Fill(view)
        expect(fill.doit).to.be.false
      })

      it("should be false if fill_alpha is 0", () => {
        const attrs = {fill_alpha: {value: 0}, fill_color: {value: "red"}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const fill = new Fill(view)
        expect(fill.doit).to.be.false
      })

      it("should be true otherwise", () => {
        const attrs = {fill_alpha: {value: 1}, fill_color: {value: "red"}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const fill = new Fill(view)
        expect(fill.doit).to.be.true
      })
    })
  })

  describe("Line", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", () =>{
        const attrs = {
          line_color: "red",
          line_alpha: 0.6,
          line_width: 2,
          line_join: "miter" as "miter",
          line_cap: "butt" as "butt",
          line_dash: [1, 2],
          line_dash_offset: 2,
        }
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const line = new Line(view)

        const ctx = {} as Context2d
        line.set_value(ctx)

        expect(ctx.strokeStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
        expect(ctx.lineWidth).to.be.equal(2)
        expect(ctx.lineJoin).to.be.equal("miter")
        expect(ctx.lineCap).to.be.equal("butt")
        expect(ctx.lineDash).to.be.equal([1, 2])
        expect(ctx.lineDashOffset).to.be.equal(2)
      })
    })

    describe("doit", () => {
      it("should be false if line_color is null", () => {
        const attrs = {line_alpha: {value: 1}, line_color: {value: null}, line_width: {value: 1}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const line = new Line(view)
        expect(line.doit).to.be.false
      })

      it("should be false if line_width is 0", () => {
        const attrs = {line_alpha: {value: 1}, line_color: {value: "red"}, line_width: {value: 0}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const line = new Line(view)
        expect(line.doit).to.be.false
      })

      it("should be false if line_alpha is 0", () => {
        const attrs = {line_alpha: {value: 0}, line_color: {value: "red"}, line_width: {value: 1}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const line = new Line(view)
        expect(line.doit).to.be.false
      })

      it("should be true otherwise", () => {
        const attrs = {line_alpha: {value: 1}, line_color: {value: "red"}, line_width: {value: 1}}
        const model = new Circle(attrs)
        const view = new SomeView({model, parent: null})
        const line = new Line(view)
        expect(line.doit).to.be.true
      })
    })
  })

  describe("Text", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", () => {
        const attrs = {
          text_font: "times",
          text_font_size: "16px",
          text_font_style: "bold" as "bold",
          text_color: "red",
          text_alpha: 0.6,
          text_align: "center" as "center",
          text_baseline: "bottom" as "bottom",
        }
        const model = new text_glyph.Text(attrs)
        const view = new SomeView({model, parent: null})
        const text = new Text(view)

        const ctx = {} as Context2d
        text.set_value(ctx)

        expect(ctx.fillStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
        expect(ctx.textAlign).to.be.equal("center")
        expect(ctx.textBaseline).to.be.equal("bottom")
        expect(ctx.font).to.be.equal("bold 16px times")
      })
    })

    describe("doit", () => {
      it("should be false if text_color is null", () => {
        const attrs = {text_alpha: {value: 1}, text_color: {value: null}}
        const model = new text_glyph.Text(attrs)
        const view = new SomeView({model, parent: null})
        const text = new Text(view)
        expect(text.doit).to.be.false
      })

      it("should be false if text_alpha is 0", () => {
        const attrs = {text_alpha: {value: 0}, text_color: {value: "red"}}
        const model = new text_glyph.Text(attrs)
        const view = new SomeView({model, parent: null})
        const text = new Text(view)
        expect(text.doit).to.be.false
      })

      it("should be true otherwise", () => {
        const attrs = {text_alpha: {value: 1}, text_color: {value: "red"}}
        const model = new text_glyph.Text(attrs)
        const view = new SomeView({model, parent: null})
        const text = new Text(view)
        expect(text.doit).to.be.true
      })
    })
  })

  describe("Visuals", () => {

    describe("interacting with GlyphViews", () => {

      it("should get initialized with appropriate indices", async () => {
        const circle = new Circle({fill_color: {field: "fill_color"}, fill_alpha: {field: "fill_alpha"}})
        const data = {fill_color: ["red", "green", "blue"], fill_alpha: [0, 0.6, 1]}
        const renderer_view = await create_glyph_renderer_view(circle, data)

        const filter = new IndexFilter({indices: [1, 2]})
        renderer_view.model.view = new CDSView({source: renderer_view.model.data_source, filters: [filter]})
        // XXX: need to manually set_data because signals for renderer aren't connected by create_glyph_view util
        renderer_view.set_data()

        const ctx = {} as Context2d
        const glyph_view = renderer_view.glyph as CircleView
        glyph_view.visuals.fill.set_vectorize(ctx, 1)

        expect(ctx.fillStyle).to.be.equal("rgba(0, 0, 255, 1)") // #ff000099
      })
    })
  })
})
