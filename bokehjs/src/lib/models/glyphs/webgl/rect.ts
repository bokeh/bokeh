import type {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import type {GLMarkerType} from "./types"
import type {RectView} from "../rect"

export class RectGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: RectView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return this._border_radius_nonzero ? "round_rect" : "rect"
  }

  protected override _set_data(): void {
    super._set_data()

    this._widths.set_from_array(this.glyph.swidth)
    this._heights.set_from_array(this.glyph.sheight)

    this._angles.set_from_prop(this.glyph.angle)

    const {top_left, top_right, bottom_right, bottom_left} = this.glyph.border_radius
    this._border_radius = [top_left, top_right, bottom_right, bottom_left]
    this._border_radius_nonzero = Math.max(...this._border_radius) > 0.0
  }

  protected override _set_once(): void {
    super._set_once()
    this._auxs.set_from_scalar(0)
  }
}
