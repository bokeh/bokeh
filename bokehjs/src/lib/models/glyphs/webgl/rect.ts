import {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {RectView} from "../rect"

export class RectGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: RectView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "rect"
  }

  protected override _set_data(): void {
    super._set_data()

    this._widths.set_from_array(this.glyph.sw)
    this._heights.set_from_array(this.glyph.sh)

    this._angles.set_from_prop(this.glyph.angle)

    const {top_left, top_right, bottom_right, bottom_left} = this.glyph.border_radius
    this._border_radius = [top_left, top_right, bottom_right, bottom_left]

    // unused
    this._auxs.set_from_scalar(0)
  }
}
