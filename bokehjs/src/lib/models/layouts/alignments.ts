import type {LayoutDOMView} from "./layout_dom"
import type {Container} from "core/layout/grid"
import {Layoutable} from "core/layout/layoutable"
import type {Sizeable, SizeHint, Size} from "core/layout"
import {BBox} from "core/util/bbox"
import {assert} from "core/util/assert"

const {max} = Math

export class GridAlignmentLayout extends Layoutable {
  constructor(readonly children: Container<LayoutDOMView>) {
    super()
  }

  protected _measure(_viewport: Sizeable): SizeHint {
    return {width: 0, height: 0}
  }

  override compute(viewport: Partial<Size> = {}): void {
    const {width, height} = viewport
    assert(width != null && height != null)

    const size_hint: SizeHint = {width, height}
    const outer = new BBox({left: 0, top: 0, width, height})

    let inner: BBox | undefined = undefined

    if (size_hint.inner != null) {
      const {left, top, right, bottom} = size_hint.inner
      inner = new BBox({left, top, right: width - right, bottom: height - bottom})
    }

    this.set_geometry(outer, inner)
  }

  override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const items = this.children.map((_, child) => {
      const {layout, bbox} = child
      assert(layout != null)

      const size_hint = layout.measure(bbox)
      return {child, layout, bbox, size_hint}
    })

    const row_extents = Array(items.nrows).fill(null).map(() => ({top: 0, bottom: 0}))
    const col_extents = Array(items.ncols).fill(null).map(() => ({left: 0, right: 0}))

    items.foreach(({r0, c0, r1, c1}, {size_hint}) => {
      const {inner} = size_hint

      if (inner != null) {
        col_extents[c0].left = max(col_extents[c0].left, inner.left)
        col_extents[c1].right = max(col_extents[c1].right, inner.right)

        row_extents[r0].top = max(row_extents[r0].top, inner.top)
        row_extents[r1].bottom = max(row_extents[r1].bottom, inner.bottom)
      }
    })

    items.foreach(({r0, c0, r1, c1}, {layout, size_hint, bbox}) => {
      const outer_bbox = bbox
      const inner_bbox = size_hint.inner == null ? undefined : (() => {
        const {inner, align} = size_hint

        const align_left = align?.left ?? true
        const align_right = align?.right ?? true
        const align_top = align?.top ?? true
        const align_bottom = align?.bottom ?? true

        const fixed_width = align?.fixed_width ?? false
        const fixed_height = align?.fixed_height ?? false

        const {left, right} = (() => {
          if (fixed_width) {
            const inner_width = outer_bbox.width - inner.right - inner.left

            if (align_left) {
              const left = col_extents[c0].left
              const right = outer_bbox.width - (left + inner_width)
              return {left, right}
            } else if (align_right) {
              const right = col_extents[c1].right
              const left = outer_bbox.width - (right + inner_width)
              return {left, right}
            } else {
              const left = inner.left
              const right = inner.right
              return {left, right}
            }
          } else {
            const left = align_left ? col_extents[c0].left : inner.left
            const right = align_right ? col_extents[c1].right : inner.right
            return {left, right}
          }
        })()

        const {top, bottom} = (() => {
          if (fixed_height) {
            const inner_height = outer_bbox.height - inner.bottom - inner.top

            if (align_top) {
              const top = row_extents[r0].top
              const bottom = outer_bbox.height - (top + inner_height)
              return {top, bottom}
            } else if (align_bottom) {
              const bottom = row_extents[r1].bottom
              const top = outer_bbox.height - (bottom + inner_height)
              return {top, bottom}
            } else {
              const top = inner.top
              const bottom = inner.bottom
              return {top, bottom}
            }
          } else {
            const top = align_top ? row_extents[r0].top : inner.top
            const bottom = align_bottom ? row_extents[r1].bottom : inner.bottom
            return {top, bottom}
          }
        })()

        const {width, height} = outer_bbox
        return BBox.from_lrtb({left, top, right: width - right, bottom: height - bottom})
      })()

      layout.set_geometry(outer_bbox, inner_bbox)
    })
  }
}
