import type {ReglWrapper} from "./regl_wrap"
import type {Float32Buffer} from "./buffer"
import type {SXSYGlyphView} from "./sxsy"
import {SXSYGlyphGL} from "./sxsy"
import type {Arrayable} from "core/types"
import {mul} from "core/util/arrayable"

type RadialLikeGlyphView = SXSYGlyphView & {
  sradius: Arrayable<number>
}

export abstract class RadialGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: RadialLikeGlyphView) {
    super(regl_wrapper, glyph)
  }

  // TODO: should be 'radius'
  get size(): Float32Buffer {
    return this._widths
  }

  protected override _set_data(): void {
    super._set_data()

    // Ideally we wouldn't multiply here, but currently handling of
    // circle glyph and scatter with circle marker is handled with
    // a single code path.
    this.size.set_from_array(mul(this.glyph.sradius, 2.0))
  }

  protected override _set_once(): void {
    super._set_once()
    this._heights.set_from_scalar(0)
  }
}
