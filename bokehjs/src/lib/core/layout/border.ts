import type {SizeHint, Size, Margin} from "./types"
import {Sizeable} from "./types"
import {Layoutable} from "./layoutable"
import type {LRTB} from "../util/bbox"
import {BBox} from "../util/bbox"

export class BorderLayout extends Layoutable {
  override *[Symbol.iterator]() {
    yield this.top_panel
    yield this.bottom_panel
    yield this.left_panel
    yield this.right_panel
    yield this.center_panel
  }

  top_panel: Layoutable
  bottom_panel: Layoutable
  left_panel: Layoutable
  right_panel: Layoutable

  center_panel: Layoutable

  inner_top_panel?: Layoutable
  inner_bottom_panel?: Layoutable
  inner_left_panel?: Layoutable
  inner_right_panel?: Layoutable

  aligns: LRTB<boolean> = {left: true, right: true, top: true, bottom: true}

  min_border: Margin = {left: 0, top: 0, right: 0, bottom: 0}
  padding: Margin = {left: 0, top: 0, right: 0, bottom: 0}

  center_border_width: number = 0

  protected _measure(viewport: Size): SizeHint {
    viewport = new Sizeable({
      width: this.sizing.width_policy == "fixed" || viewport.width == Infinity ? this.sizing.width : viewport.width,
      height: this.sizing.height_policy == "fixed" || viewport.height == Infinity ? this.sizing.height : viewport.height,
    })

    const left_hint = this.left_panel.measure({width: 0, height: viewport.height})
    const left = Math.max(left_hint.width, this.min_border.left) + this.padding.left

    const right_hint = this.right_panel.measure({width: 0, height: viewport.height})
    const right = Math.max(right_hint.width, this.min_border.right) + this.padding.right

    const top_hint = this.top_panel.measure({width: viewport.width, height: 0})
    const top = Math.max(top_hint.height, this.min_border.top) + this.padding.top

    const bottom_hint = this.bottom_panel.measure({width: viewport.width, height: 0})
    const bottom = Math.max(bottom_hint.height, this.min_border.bottom) + this.padding.bottom

    const center_viewport = new Sizeable(viewport).shrink_by({left, right, top, bottom})
    const center = this.center_panel.measure(center_viewport)

    const width = left + center.width + right
    const height = top + center.height + bottom

    const align = (() => {
      const {width_policy, height_policy} = this.center_panel.sizing
      return {
        ...this.aligns,
        fixed_width: width_policy == "fixed",
        fixed_height: height_policy == "fixed",
      }
    })()

    return {width, height, inner: {left, right, top, bottom}, align}
  }

  protected override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    if (this.sizing.visible) {
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

      const adjusted_inner = inner.shrink_by(this.center_border_width)

      if (this.inner_top_panel != null) {
        const {left, right, top, width} = adjusted_inner
        const inner_top_hint = this.inner_top_panel.measure({width, height: 0})
        this.inner_top_panel.set_geometry(new BBox({left, right, top, height: inner_top_hint.height}))
      }

      if (this.inner_bottom_panel != null) {
        const {left, right, bottom, width} = adjusted_inner
        const inner_bottom_hint = this.inner_bottom_panel.measure({width, height: 0})
        this.inner_bottom_panel.set_geometry(new BBox({left, right, bottom, height: inner_bottom_hint.height}))
      }

      if (this.inner_left_panel != null) {
        const {top, bottom, left, height} = adjusted_inner
        const inner_left_hint = this.inner_left_panel.measure({width: 0, height})
        this.inner_left_panel.set_geometry(new BBox({top, bottom, left, width: inner_left_hint.width}))
      }

      if (this.inner_right_panel != null) {
        const {top, bottom, right, height} = adjusted_inner
        const inner_right_hint = this.inner_right_panel.measure({width: 0, height})
        this.inner_right_panel.set_geometry(new BBox({top, bottom, right, width: inner_right_hint.width}))
      }
    } else {
      this.center_panel.set_geometry(new BBox())

      this.top_panel.set_geometry(new BBox())
      this.bottom_panel.set_geometry(new BBox())
      this.left_panel.set_geometry(new BBox())
      this.right_panel.set_geometry(new BBox())

      this.inner_top_panel?.set_geometry(new BBox())
      this.inner_bottom_panel?.set_geometry(new BBox())
      this.inner_left_panel?.set_geometry(new BBox())
      this.inner_right_panel?.set_geometry(new BBox())
    }
  }
}
