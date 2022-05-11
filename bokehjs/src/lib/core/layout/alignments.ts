import {SizeHint, Size} from "./types"
import {Layoutable} from "./layoutable"
import {BBox} from "../util/bbox"

export abstract class Stack extends Layoutable {
  override *[Symbol.iterator]() {
    yield* this.children
  }

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

  protected override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const top = this.absolute ? outer.top : 0
    let left = this.absolute ? outer.left : 0
    const {height} = outer

    for (const child of this.children) {
      const {width} = child.measure({width: 0, height: 0})
      child.set_geometry(new BBox({left, width, top, height}))
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

  protected override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const left = this.absolute ? outer.left : 0
    let top = this.absolute ? outer.top : 0
    const {width} = outer

    for (const child of this.children) {
      const {height} = child.measure({width: 0, height: 0})
      child.set_geometry(new BBox({top, height, left, width}))
      top += height
    }
  }
}

export class NodeLayout extends Layoutable {
  override *[Symbol.iterator]() {
    yield* this.children
  }

  children: Layoutable[] = []

  protected _measure(viewport: Size): SizeHint {
    const {width_policy, height_policy} = this.sizing

    const {min, max} = Math

    let max_width = 0
    let max_height = 0
    for (const layout of this.children) {
      const {width, height} = layout.measure(viewport)
      max_width = max(max_width, width)
      max_height = max(max_height, height)
    }

    const width = (() => {
      const {width} = this.sizing
      if (viewport.width == Infinity) {
        return width_policy == "fixed" ? width ?? max_width : max_width
      } else {
        switch (width_policy) {
          case "fixed": return width ?? max_width
          case "min":   return /*width != null ? min(viewport.width, width) :*/ max_width
          case "fit":   return width != null ? min(viewport.width, width) : viewport.width
          case "max":   return width != null ? max(viewport.width, width) : viewport.width
        }
      }
    })()

    const height = (() => {
      const {height} = this.sizing
      if (viewport.height == Infinity) {
        return height_policy == "fixed" ? height ?? max_height : max_height
      } else {
        switch (height_policy) {
          case "fixed": return height ?? max_height
          case "min":   return /*height != null ? min(viewport.height, height) :*/ max_height
          case "fit":   return height != null ? min(viewport.height, height) : viewport.height
          case "max":   return height != null ? max(viewport.height, height) : viewport.height
        }
      }
    })()

    return {width, height}
  }

  protected override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const bbox = this.absolute ? outer : outer.relative()
    const {left, right, top, bottom} = bbox

    const vcenter = Math.round(bbox.vcenter)
    const hcenter = Math.round(bbox.hcenter)

    for (const layout of this.children) {
      const {margin, halign = "start", valign = "start"} = layout.sizing
      const {width, height, inner} = layout.measure(outer)

      const bbox = (() => {
        const anchor = `${valign}_${halign}` as const
        switch (anchor) {
          case "start_start":   // "top_left"
            return new BBox({left: left + margin.left, top: top + margin.top, width, height})
          case "start_center":  // "top_center"
            return new BBox({hcenter, top: top + margin.top, width, height})
          case "start_end":     // "top_right"
            return new BBox({right: right - margin.right, top: top + margin.top, width, height})
          case "center_start":  // "center_left"
            return new BBox({left: left + margin.left, vcenter, width, height})
          case "center_center": // "center"
            return new BBox({hcenter, vcenter, width, height})
          case "center_end":    // "center_right"
            return new BBox({right: right - margin.right, vcenter, width, height})
          case "end_start":     // "bottom_left"
            return new BBox({left: left + margin.left, bottom: bottom - margin.bottom, width, height})
          case "end_center":    // "bottom_center"
            return new BBox({hcenter, bottom: bottom - margin.bottom, width, height})
          case "end_end":       // "bottom_right"
            return new BBox({right: right - margin.right, bottom: bottom - margin.bottom, width, height})
        }
      })()

      const inner_bbox = inner == null ? bbox : new BBox({
        left: bbox.left + inner.left,
        top: bbox.top + inner.top,
        right: bbox.right - inner.right,
        bottom: bbox.bottom - inner.bottom,
      })

      layout.set_geometry(bbox, inner_bbox)
    }
  }
}
