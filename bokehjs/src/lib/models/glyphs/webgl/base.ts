// This module implements the Base GL Glyph and some utilities
import type {Context2d} from "core/util/canvas"
import type {GlyphView} from "../glyph"
import type {ReglWrapper} from "./regl_wrap"
import {WrappedBuffer} from "./buffer"

export type BaseGLGlyphConstructor = {
  new(regl: ReglWrapper, base_glyph: GlyphView): BaseGLGlyph
}

export abstract class BaseGLGlyph {
  protected nvertices: number = 0
  protected size_changed: boolean = false
  protected data_changed: boolean = false
  protected data_mapped: boolean = false
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

  set_data_mapped(): void {
    this.data_mapped = true
  }

  set_visuals_changed(): void {
    this.visuals_changed = true
  }

  render(_ctx: Context2d, indices: number[], mainglyph: GlyphView): void {
    if (indices.length == 0) {
      return
    }
    const {width, height} = this.glyph.renderer.plot_view.canvas_view.webgl!.canvas
    const {pixel_ratio} = this.glyph.renderer.plot_view.canvas_view
    const trans = {
      pixel_ratio,  // Needed to scale antialiasing
      width:  width / pixel_ratio,
      height: height / pixel_ratio,
    }
    this.draw(indices, mainglyph, trans)
    this.glyph.renderer.plot_view.canvas_view.mark_webgl_dirty()
  }

  abstract draw(indices: number[], mainglyph: GlyphView, trans: Transform): void

  /** Release every buffer owned by this glyph. Shared shader programs, dash
   * textures, and framebuffer resources remain owned by ReglWrapper. */
  destroy(): void {
    const destroyed = new Set<WrappedBuffer<any>>()
    const destroy = (value: unknown): void => {
      if (value instanceof WrappedBuffer) {
        if (!destroyed.has(value)) {
          destroyed.add(value)
          value.destroy()
        }
      } else if (Array.isArray(value)) {
        for (const item of value) {
          destroy(item)
        }
      } else if (value instanceof Map) {
        for (const item of value.values()) {
          destroy(item)
        }
      }
    }

    for (const value of Object.values(this)) {
      destroy(value)
    }
  }
}

export type Transform = {
  pixel_ratio: number
  width: number
  height: number
}
