import type {ReglWrapper} from "./regl_wrap"
import {PatchesGL} from "./patches"
import type {PatchesView} from "../patches"
import type {GlyphView} from "../glyph"
import type {RaggedArray} from "core/util/ragged_array"

export type ScreenPatches = {
  sxs: RaggedArray<Float32Array>
  sys: RaggedArray<Float32Array>
}

export interface SyntheticPatchesView extends GlyphView {
  glglyph?: SyntheticPatchesGL
  webgl_patches(): ScreenPatches
}

export class SyntheticPatchesGL extends PatchesGL {
  constructor(regl_wrapper: ReglWrapper, readonly patches_glyph: SyntheticPatchesView) {
    super(regl_wrapper, patches_glyph as unknown as PatchesView)
  }

  protected override _screen_coordinates(): ScreenPatches {
    return this.patches_glyph.webgl_patches()
  }
}
