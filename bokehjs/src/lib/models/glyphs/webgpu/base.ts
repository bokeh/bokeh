// Base class for WebGPU glyph implementations
import type {Context2d} from "core/util/canvas"
import type {GlyphView} from "../glyph"
import type {WebGPUWrapper} from "./webgpu_wrapper"
import type {Transform} from "./types"

export type BaseGPUGlyphConstructor = {
  new(wrapper: WebGPUWrapper, base_glyph: GlyphView): BaseGPUGlyph
}

export abstract class BaseGPUGlyph {
  protected nvertices: number = 0
  protected size_changed: boolean = false
  protected data_changed: boolean = false
  protected data_mapped: boolean = false
  protected visuals_changed: boolean = false

  constructor(protected readonly webgpu_wrapper: WebGPUWrapper, readonly glyph: GlyphView) {}

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

    // Get canvas dimensions from the WebGPU canvas
    const webgpu = this.glyph.renderer.plot_view.canvas_view.webgpu
    if (webgpu == null) {
      return
    }
    const {width, height} = webgpu.canvas
    const {pixel_ratio} = this.glyph.renderer.plot_view.canvas_view

    const trans: Transform = {
      pixel_ratio,  // Needed to scale antialiasing
      width: width / pixel_ratio,
      height: height / pixel_ratio,
    }

    this.draw(indices, mainglyph, trans)
  }

  abstract draw(indices: number[], mainglyph: GlyphView, trans: Transform): void
}
