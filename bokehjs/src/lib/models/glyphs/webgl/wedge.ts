import {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {WedgeView} from "../wedge"

export class WedgeGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: WedgeView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "wedge"
  }

  protected override _set_data(): void {
    super._set_data()

    if (this._heights == null) {
      this._heights = this._widths
    }

    const nmarkers = this.nvertices
    const widths_array = this._widths.get_sized_array(nmarkers)
    for (let i = 0; i < nmarkers; i++) {
      widths_array[i] = this.glyph.sradius[i]*2
    }
    this._widths.update()

    this._angles.set_from_scalar(0, 1)
  }
}
