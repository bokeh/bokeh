// This module implements the Base GL Glyph and some utilities
import {Context2d} from "core/util/canvas"
import {type GlyphView} from "../glyph"
import {ReglWrapper} from "./regl_wrap"

export type BaseGLGlyphConstructor = {
  new(regl: ReglWrapper, base_glyph: GlyphView): BaseGLGlyph
}

export abstract class BaseGLGlyph {
  protected nvertices: number = 0
  protected size_changed: boolean = false
  protected data_changed: boolean = false
  protected visuals_changed: boolean = false

  constructor(protected readonly regl_wrapper: ReglWrapper, readonly glyph: GlyphView) {}

  set_data_changed(): void {
    const {data_size} = this.glyph
    if (data_size != this.nvertices) {
      this.nvertices = data_size
      this.size_changed = true
    }

    this.data_changed = true
  }

  set_visuals_changed(): void {
    this.visuals_changed = true
  }

  render(_ctx: Context2d, indices: number[], mainglyph: GlyphView): boolean {
    if (indices.length == 0) {
      return true
    }
    const {width, height} = this.glyph.renderer.plot_view.canvas_view.webgl!.canvas
    const trans = {
      pixel_ratio: this.glyph.renderer.plot_view.canvas_view.pixel_ratio,  // pass pixel_ratio to webgl
      width,
      height,
    }
    this.draw(indices, mainglyph, trans)
    return true
  }

  abstract draw(indices: number[], mainglyph: GlyphView, trans: Transform): void
}

export type Transform = {
  pixel_ratio: number
  width: number
  height: number
}
