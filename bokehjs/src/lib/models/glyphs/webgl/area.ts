import type {ReglWrapper} from "./regl_wrap"
import {PatchGL} from "./patch"
import type {PatchView} from "../patch"
import type {AreaView} from "../area"
import type {ScreenLine} from "../curve"

export interface AreaPathView extends AreaView {
  glglyph?: AreaGL
  webgl_area_path(): ScreenLine
}

export class AreaGL extends PatchGL {
  constructor(regl_wrapper: ReglWrapper, readonly area_glyph: AreaPathView) {
    super(regl_wrapper, area_glyph as unknown as PatchView)
  }

  protected override _screen_coordinates(): ScreenLine {
    return this.area_glyph.webgl_area_path()
  }
}
