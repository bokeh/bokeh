// Base class for WebGL2 glyph implementations
import type {Context2d} from "core/util/canvas"
import type {GlyphView} from "../glyph"
import type {WebGL2Wrapper} from "./webgl2_wrapper"
import type {Transform} from "./types"

export type BaseGL2GlyphConstructor = {
  new(wrapper: WebGL2Wrapper, base_glyph: GlyphView): BaseGL2Glyph
}

export abstract class BaseGL2Glyph {
  protected nvertices: number = 0
  protected size_changed: boolean = false
  protected data_changed: boolean = false
  protected data_mapped: boolean = false
  protected visuals_changed: boolean = false

  constructor(protected readonly webgl2_wrapper: WebGL2Wrapper, readonly glyph: GlyphView) {}

  get gpu_transform(): boolean {
    return true
  }

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

    // Get canvas dimensions from the WebGL2 canvas
    const webgl2 = this.glyph.renderer.plot_view.canvas_view.webgl2
    if (webgl2 == null) {
      return
    }
    const {width, height} = webgl2.canvas
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
