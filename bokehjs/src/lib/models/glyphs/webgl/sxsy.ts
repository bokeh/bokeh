import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL, SingleMarkerGlyphView} from "./single_marker"
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
    const {missing_point} = SingleMarkerGL
    const nmarkers = this.nvertices
    const centers_array = this._centers.get_sized_array(nmarkers*2)
    for (let i = 0; i < nmarkers; i++) {
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        centers_array[2*i  ] = this.glyph.sx[i]
        centers_array[2*i+1] = this.glyph.sy[i]
      } else {
        centers_array[2*i  ] = missing_point
        centers_array[2*i+1] = missing_point
      }
    }
    this._centers.update()
  }
}
