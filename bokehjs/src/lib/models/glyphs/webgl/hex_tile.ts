import {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import {GLMarkerType} from "./types"
import type {HexTileView} from "../hex_tile"

export class HexTileGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: HexTileView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "hex_tile"
  }

  protected override _set_data(): void {
    super._set_data()

    if (this.glyph.model.orientation == "pointytop") {
      this._angles.set_from_scalar(0.5*Math.PI)
      this._widths.set_from_scalar(this.glyph.svy[0]*2)
      this._heights.set_from_scalar(this.glyph.svx[4]*4/Math.sqrt(3))
    } else {
      this._angles.set_from_scalar(0)
      this._widths.set_from_scalar(this.glyph.svx[0]*2)
      this._heights.set_from_scalar(this.glyph.svy[4]*4/Math.sqrt(3))
    }

    // unused
    this._auxs.set_from_scalar(0)
  }
}
