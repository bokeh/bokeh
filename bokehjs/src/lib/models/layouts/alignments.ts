import {LayoutDOMView} from "./layout_dom"
import {Container} from "core/layout/grid"
import {Layoutable} from "core/layout/layoutable"
import {Sizeable, SizeHint, Size} from "core/layout"
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
      const inner_bbox = (() => {
        const {inner} = size_hint
        if (inner != null) {
          const left = col_extents[c0].left
          const right = col_extents[c1].right
          const top = row_extents[r0].top
          const bottom = row_extents[r1].bottom

          const {width, height} = outer_bbox
          return BBox.from_lrtb({left, top, right: width - right, bottom: height - bottom})
        } else
          return undefined
      })()

      layout.set_geometry(outer_bbox, inner_bbox)
    })
  }
}
