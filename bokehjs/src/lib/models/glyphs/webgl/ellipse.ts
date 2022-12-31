import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {EllipseView} from "../ellipse"

export class EllipseGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: EllipseView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "ellipse"
  }

  protected override _set_data(): void {
    super._set_data()

    if (this._heights == null) {
      this._heights = new Float32Buffer(this.regl_wrapper)
    }

    this._widths.set_from_array(this.glyph.sw)
    this._heights.set_from_array(this.glyph.sh)
    this._angles.set_from_prop(this.glyph.angle)
  }
}
