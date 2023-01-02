import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL, SingleMarkerGlyphView} from "./single_marker"
import {interleave} from "./webgl_utils"
import {Arrayable} from "core/types"

// NOTE: this is not equivalent to XYGlyphView
export type SXSYGlyphView = SingleMarkerGlyphView & {
  sx: Arrayable<number>
  sy: Arrayable<number>
}

export abstract class SXSYGlyphGL extends SingleMarkerGL {

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: SXSYGlyphView) {
    super(regl_wrapper, glyph)
  }

  protected _set_data(): void {
    const nmarkers = this.nvertices
    const centers_array = this._centers.get_sized_array(2*nmarkers)
    interleave(this.glyph.sx, this.glyph.sy, nmarkers, SingleMarkerGL.missing_point, centers_array)
    this._centers.update()
  }
}
