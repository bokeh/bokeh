import {SizeHint, Size} from "./types"
import {Layoutable} from "./layoutable"
import {BBox} from "../util/bbox"
import {Anchor} from "../enums"

export abstract class Stack extends Layoutable {
  children: Layoutable[] = []
}

export class HStack extends Stack {
  protected _measure(_viewport: Size): SizeHint {
    let width = 0
    let height = 0

    for (const child of this.children) {
      const size_hint = child.measure({width: 0, height: 0})
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
      const {width} = child.measure({width: 0, height: 0})
      child.set_geometry(new BBox({left, width, top, bottom}))
      left += width
    }
  }
}

export class VStack extends Stack {
  protected _measure(_viewport: Size): SizeHint {
    let width = 0
    let height = 0

    for (const child of this.children) {
      const size_hint = child.measure({width: 0, height: 0})
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
      const {height} = child.measure({width: 0, height: 0})
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

  protected _measure(viewport: Size): SizeHint {
    let width = 0
    let height = 0

    for (const {layout} of this.children) {
      const size_hint = layout.measure(viewport)
      width = Math.max(width, size_hint.width)
      height = Math.max(height, size_hint.height)
    }

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    for (const {layout, anchor, margin} of this.children) {
      const {left, right, top, bottom, hcenter, vcenter} = outer
      const {width, height} = layout.measure(outer)

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
      }

      layout.set_geometry(bbox)
    }
  }
}
