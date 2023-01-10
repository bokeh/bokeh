import {ReglWrapper} from "./regl_wrap"
import {Float32Buffer} from "./buffer"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {CircleView} from "../circle"

export class CircleGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: CircleView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "circle"
  }

  get radius(): Float32Buffer {
    return this._widths
  }

  protected override _set_data(): void {
    super._set_data()
    this.radius.set_from_array(this.glyph.sradius)

    // unused
    this._heights.set_from_scalar(0, 1)
    this._angles.set_from_scalar(0, 1)
  }
}
