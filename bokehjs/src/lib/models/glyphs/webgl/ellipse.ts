import {Float32Buffer} from "./buffer"
import {ReglWrapper} from "./regl_wrap"
import {SingleMarkerGL} from "./single_marker"
import {GLMarkerType} from "./types"
import type {EllipseView} from "../ellipse"

export class EllipseGL extends SingleMarkerGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: EllipseView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "ellipse"
  }

  protected override _set_data(): void {
    const nmarkers = this.nvertices

    if (this._centers == null) {
      // Either all or none are set.
      this._centers = new Float32Buffer(this.regl_wrapper)
      this._widths = new Float32Buffer(this.regl_wrapper)
      this._heights = new Float32Buffer(this.regl_wrapper)
      this._angles = new Float32Buffer(this.regl_wrapper)
    }

    const centers_array = this._centers.get_sized_array(nmarkers*2)
    const widths_array = this._widths!.get_sized_array(nmarkers)
    const heights_array = this._heights!.get_sized_array(nmarkers)
    for (let i = 0; i < nmarkers; i++) {
      if (isFinite(this.glyph.sx[i]) && isFinite(this.glyph.sy[i])) {
        centers_array[2*i  ] = this.glyph.sx[i]
        centers_array[2*i+1] = this.glyph.sy[i]
      } else {
        centers_array[2*i  ] = SingleMarkerGL.missing_point
        centers_array[2*i+1] = SingleMarkerGL.missing_point
      }
      widths_array[i] = this.glyph.sw[i]
      heights_array[i] = this.glyph.sh[i]

    }
    this._centers.update()
    this._widths!.update()
    this._heights!.update()

    this._angles!.set_from_prop(this.glyph.angle)
  }
}
