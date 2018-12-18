import {SizeHint, Layoutable} from "./layoutable"
import {BBox} from "../util/bbox"
import {Anchor} from "../enums"

export abstract class Stack extends Layoutable {
  children: Layoutable[] = []
}

export class HStack extends Stack {
  size_hint(): SizeHint {
    let width = 0
    let height = 0

    for (const child of this.children) {
      const size_hint = child.size_hint()
      width += size_hint.width
      height = Math.max(height, size_hint.height)
    }

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {top, bottom} = outer
    let {left} = outer

    for (const child of this.children) {
      const {width} = child.size_hint()
      child.set_geometry(new BBox({left, width, top, bottom}))
      left += width
    }
  }
}

export class VStack extends Stack {
  size_hint(): SizeHint {
    let width = 0
    let height = 0

    for (const child of this.children) {
      const size_hint = child.size_hint()
      width = Math.max(width, size_hint.width)
      height += size_hint.height
    }

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const {left, right} = outer
    let {top} = outer

    for (const child of this.children) {
      const {height} = child.size_hint()
      child.set_geometry(new BBox({top, height, left, right}))
      top += height
    }
  }
}

export type AnchorItem = {
  layout: Layoutable
  anchor: Anchor
  margin: number
}

export class AnchorLayout extends Layoutable {

  children: AnchorItem[] = []

  size_hint(): SizeHint {
    let width = 0
    let height = 0

    for (const {layout} of this.children) {
      const size_hint = layout.size_hint()
      width = Math.max(width, size_hint.width)
      height = Math.max(height, size_hint.height)
    }

    if (this.sizing.width_policy == "fixed" && this.sizing.width != null)
      width = this.sizing.width

    if (this.sizing.height_policy == "fixed" && this.sizing.height != null)
      height = this.sizing.height

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    for (const {layout, anchor, margin} of this.children) {
      const {left, right, top, bottom, hcenter, vcenter} = outer
      const {width, height} = layout.size_hint()

      let bbox: BBox
      switch (anchor) {
        case 'top_left':
          bbox = new BBox({left: left + margin, top: top + margin, width, height})
          break
        case 'top_center':
          bbox = new BBox({hcenter, top: top + margin, width, height})
          break
        case 'top_right':
          bbox = new BBox({right: right - margin, top: top + margin, width, height})
          break
        case 'bottom_right':
          bbox = new BBox({right: right - margin, bottom: bottom - margin, width, height})
          break
        case 'bottom_center':
          bbox = new BBox({hcenter, bottom: bottom - margin, width, height})
          break
        case 'bottom_left':
          bbox = new BBox({left: left + margin, bottom: bottom - margin, width, height})
          break
        case 'center_left':
          bbox = new BBox({left: left + margin, vcenter, width, height})
          break
        case 'center':
          bbox = new BBox({hcenter, vcenter, width, height})
          break
        case 'center_right':
          bbox = new BBox({right: right - margin, vcenter, width, height})
          break
        default:
          throw new Error("unreachable")
      }

      layout.set_geometry(bbox)
    }
  }
}
