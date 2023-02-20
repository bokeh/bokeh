import {ReglWrapper} from "./regl_wrap"
import {Float32Buffer} from "./buffer"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {AnnulusView} from "../annulus"

export class AnnulusGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: AnnulusView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "annulus"
  }

  get outer_radius(): Float32Buffer {
    return this._widths
  }

  get inner_radius(): Float32Buffer {
    return this._heights
  }

  protected override _set_data(): void {
    super._set_data()

    this.outer_radius.set_from_array(this.glyph.souter_radius)
    this.inner_radius.set_from_array(this.glyph.sinner_radius)
  }

  protected override _set_once(): void {
    super._set_once()
    this._angles.set_from_scalar(0)
    this._auxs.set_from_scalar(0)
  }
}
