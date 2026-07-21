import {expect} from "#framework/assertions"

import {BaseGLGlyph} from "@bokehjs/models/glyphs/webgl/base"
import type {Transform} from "@bokehjs/models/glyphs/webgl/base"
import {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import type {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import type {GlyphView} from "@bokehjs/models/glyphs/glyph"
import type {Buffer} from "regl"

describe("BaseGLGlyph", () => {
  it("should destroy owned buffers once, including array and map members", () => {
    let destroyed = 0
    const wrapper = {
      flush() {},
      buffer() {
        return Object.assign((_options: unknown) => {}, {
          destroy() { destroyed++ },
        }) as unknown as Buffer
      },
    } as unknown as ReglWrapper

    class TestGLGlyph extends BaseGLGlyph {
      readonly first = this.own(new Float32Buffer(this.regl_wrapper))
      readonly second = this.own(new Float32Buffer(this.regl_wrapper))
      readonly aliases = [this.first, this.second]
      readonly mapped = new Map([["first", this.first]])

      constructor() {
        super(wrapper, {} as GlyphView)
        this.first.set_from_scalar(1)
        this.second.set_from_scalar(2)
      }

      draw(_indices: number[], _main_glyph: GlyphView, _transform: Transform): void {}
    }

    const glyph = new TestGLGlyph()
    glyph.destroy()
    glyph.destroy()
    expect(destroyed).to.be.equal(2)
  })
})
