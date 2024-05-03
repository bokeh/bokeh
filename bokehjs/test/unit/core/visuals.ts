import {expect} from "assertions"
import {create_glyph_renderer_view} from "../models/glyphs/_util"

import type {Context2d} from "@bokehjs/core/util/canvas"
import {CanvasLayer} from "@bokehjs/core/util/canvas"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import type {CircleView} from "@bokehjs/models/glyphs/circle"
import {Circle} from "@bokehjs/models/glyphs/circle"

import {Model} from "@bokehjs/model"
import {DOMComponentView} from "@bokehjs/core/dom_view"
import {build_view} from "@bokehjs/core/build_views"
import * as visuals from "@bokehjs/core/visuals"
import * as mixins from "@bokehjs/core/property_mixins"
import type * as p from "@bokehjs/core/properties"

class SomeModelView extends DOMComponentView implements visuals.Paintable {
  declare model: SomeModel
  visuals: SomeModel.Visuals

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this) as any
  }

  request_paint(): void {}

  get canvas() {
    return {
      create_layer(): CanvasLayer {
        return new CanvasLayer("canvas", true)
      },
    }
  }
}

export namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & Mixins
  export type Mixins = mixins.Text & mixins.Line & mixins.Fill & mixins.Hatch
  export type Visuals = {text: visuals.Text, line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
}

export interface SomeModel extends SomeModel.Attrs {}

export class SomeModel extends Model {
  declare properties: SomeModel.Props
  declare __view_type__: SomeModelView

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SomeModelView
    this.mixins<SomeModel.Mixins>([mixins.Text, mixins.Line, mixins.Fill, mixins.Hatch])
  }
}

describe("core/visuals", () => {

  describe("Fill", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", async () => {
        const attrs = {
          fill_color: "red",
          fill_alpha: 0.6,
        }
        const model = new SomeModel(attrs)
        const view = await build_view(model)

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")! as Context2d
        view.visuals.fill.set_value(ctx)

        expect(ctx.fillStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
      })
    })

    describe("doit", () => {
      it("should be false if fill_color is null", async () => {
        const attrs = {fill_alpha: 1, fill_color: null}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {fill} = view.visuals
        expect(fill.doit).to.be.false
      })

      it("should be false if fill_alpha is 0", async () => {
        const attrs = {fill_alpha: 0, fill_color: "red"}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {fill} = view.visuals
        expect(fill.doit).to.be.false
      })

      it("should be true otherwise", async () => {
        const attrs = {fill_alpha: 1, fill_color: "red"}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {fill} = view.visuals
        expect(fill.doit).to.be.true
      })
    })
  })

  describe("Line", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", async () =>{
        const attrs = {
          line_color: "red",
          line_alpha: 0.6,
          line_width: 2,
          line_join: "miter" as "miter",
          line_cap: "butt" as "butt",
          line_dash: [1, 2],
          line_dash_offset: 2,
        }
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {line} = view.visuals

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")! as Context2d
        line.set_value(ctx)

        expect(ctx.strokeStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
        expect(ctx.lineWidth).to.be.equal(2)
        expect(ctx.lineJoin).to.be.equal("miter")
        expect(ctx.lineCap).to.be.equal("butt")
        expect(ctx.getLineDash()).to.be.equal([1, 2])
        expect(ctx.lineDashOffset).to.be.equal(2)
      })
    })

    describe("doit", () => {
      it("should be false if line_color is null", async () => {
        const attrs = {line_alpha: 1, line_color: null, line_width: 1}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {line} = view.visuals
        expect(line.doit).to.be.false
      })

      it("should be false if line_width is 0", async () => {
        const attrs = {line_alpha: 1, line_color: "red", line_width: 0}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {line} = view.visuals
        expect(line.doit).to.be.false
      })

      it("should be false if line_alpha is 0", async () => {
        const attrs = {line_alpha: 0, line_color: "red", line_width: 1}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {line} = view.visuals
        expect(line.doit).to.be.false
      })

      it("should be true otherwise", async () => {
        const attrs = {line_alpha: 1, line_color: "red", line_width: 1}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {line} = view.visuals
        expect(line.doit).to.be.true
      })
    })
  })

  describe("Text", () => {

    describe("set_value", () => {
      it("should set canvas context attributes", async () => {
        const attrs = {
          text_font: "times",
          text_font_size: "16px",
          text_font_style: "bold" as "bold",
          text_color: "red",
          text_alpha: 0.6,
          text_align: "center" as "center",
          text_baseline: "bottom" as "bottom",
        }
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {text} = view.visuals

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")! as Context2d
        text.set_value(ctx)

        expect(ctx.fillStyle).to.be.equal("rgba(255, 0, 0, 0.6)") // #ff000099
        expect(ctx.textAlign).to.be.equal("center")
        expect(ctx.textBaseline).to.be.equal("bottom")
        expect(ctx.font).to.be.equal("bold 16px times")
      })
    })

    describe("doit", () => {
      it("should be false if text_color is null", async () => {
        const attrs = {text_alpha: 1, text_color: null}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {text} = view.visuals
        expect(text.doit).to.be.false
      })

      it("should be false if text_alpha is 0", async () => {
        const attrs = {text_alpha: 0, text_color: "red"}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {text} = view.visuals
        expect(text.doit).to.be.false
      })

      it("should be true otherwise", async () => {
        const attrs = {text_alpha: 1, text_color: "red"}
        const model = new SomeModel(attrs)
        const view = await build_view(model)
        const {text} = view.visuals
        expect(text.doit).to.be.true
      })
    })
  })

  describe("Visuals", () => {

    describe("interacting with GlyphViews", () => {

      it("should get initialized with appropriate indices", async () => {
        const circle = new Circle({fill_color: {field: "fill_color"}, fill_alpha: {field: "fill_alpha"}})
        const data = {fill_color: ["red", "green", "blue"], fill_alpha: [0, 0.6, 0.8]}
        const renderer_view = await create_glyph_renderer_view(circle, data)

        const filter = new IndexFilter({indices: [1, 2]})
        renderer_view.model.view = new CDSView({filter})
        // XXX: need to manually set_data because signals for renderer aren't connected by create_glyph_view util
        await renderer_view.set_data()

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")! as Context2d

        const glyph_view = renderer_view.glyph as CircleView
        glyph_view.visuals.fill.set_vectorize(ctx, 1)

        expect(ctx.fillStyle).to.be.equal("rgba(0, 0, 255, 0.8)")
      })
    })
  })
})
