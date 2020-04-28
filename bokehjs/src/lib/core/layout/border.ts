import {SizeHint, Size, Sizeable, Margin} from "./types"
import {Layoutable} from "./layoutable"
import {BBox} from "../util/bbox"

export class BorderLayout extends Layoutable {

  top_panel: Layoutable
  bottom_panel: Layoutable
  left_panel: Layoutable
  right_panel: Layoutable
  center_panel: Layoutable

  min_border: Margin = {left: 0, top: 0, right: 0, bottom: 0}

  absolute: boolean = false

  protected _measure(viewport: Size): SizeHint {
    viewport = new Sizeable(viewport).bounded_to(this.sizing.size)

    const left_hint = this.left_panel.measure({width: 0, height: viewport.height})
    const left = Math.max(left_hint.width, this.min_border.left)

    const right_hint = this.right_panel.measure({width: 0, height: viewport.height})
    const right = Math.max(right_hint.width, this.min_border.right)

    const top_hint = this.top_panel.measure({width: viewport.width, height: 0})
    const top = Math.max(top_hint.height, this.min_border.top)

    const bottom_hint = this.bottom_panel.measure({width: viewport.width, height: 0})
    const bottom = Math.max(bottom_hint.height, this.min_border.bottom)

    const center_viewport = new Sizeable(viewport).shrink_by({left, right, top, bottom})
    const center = this.center_panel.measure(center_viewport)

    const width = left + center.width + right
    const height = top + center.height + bottom

    const align = (() => {
      const {width_policy, height_policy} = this.center_panel.sizing
      return width_policy != "fixed" && height_policy != "fixed"
    })()

    return {width, height, inner: {left, right, top, bottom}, align}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    if (this.absolute) {
      inner = inner.translate(outer.left, outer.top)
    }

    this.center_panel.set_geometry(inner)

    const left_hint = this.left_panel.measure({width: 0, height: outer.height})
    const right_hint = this.right_panel.measure({width: 0, height: outer.height})
    const top_hint = this.top_panel.measure({width: outer.width, height: 0})
    const bottom_hint = this.bottom_panel.measure({width: outer.width, height: 0})

    const {left, top, right, bottom} = inner

    this.top_panel.set_geometry(new BBox({left, right, bottom: top, height: top_hint.height}))
    this.bottom_panel.set_geometry(new BBox({left, right, top: bottom, height: bottom_hint.height}))
    this.left_panel.set_geometry(new BBox({top, bottom, right: left, width: left_hint.width}))
    this.right_panel.set_geometry(new BBox({top, bottom, left: right, width: right_hint.width}))
  }
}
