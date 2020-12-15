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

export class NodeLayout extends Layoutable {
  children: Layoutable[] = []

  /*
  protected _measure_dim(policy: SizingPolicy, size: number | undefined, viewport_size: number) {
    if (viewport_size == Infinity) {
      return width ?? 0
    } else {
      switch (width_policy) {
        case "fixed": return width ?? 0
        case "min":   return width != null ? min(viewport_size, width) : 0
        case "fit":   return width != null ? min(viewport_size, width) : viewport_size
        case "max":   return width != null ? max(viewport_size, width) : viewport_size
      }
    }
  }
  */

  protected _measure(viewport: Size): SizeHint {
    const {width_policy, height_policy} = this.sizing

    /*
    for (const layout of this.children) {
      const {width, height} = layout.measure(viewport)
    }
    */

    const {min, max} = Math

    const width = (() => {
      const {width} = this.sizing
      if (viewport.width == Infinity) {
        return width ?? 0
      } else {
        switch (width_policy) {
          case "fixed": return width ?? 0
          case "min":   return width != null ? min(viewport.width, width) : 0
          case "fit":   return width != null ? min(viewport.width, width) : viewport.width
          case "max":   return width != null ? max(viewport.width, width) : viewport.width
        }
      }
    })()

    const height = (() => {
      const {height} = this.sizing
      if (viewport.height == Infinity) {
        return height ?? 0
      } else {
        switch (height_policy) {
          case "fixed": return height ?? 0
          case "min":   return height != null ? min(viewport.height, height) : 0
          case "fit":   return height != null ? min(viewport.height, height) : viewport.height
          case "max":   return height != null ? max(viewport.height, height) : viewport.height
        }
      }
    })()

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    for (const layout of this.children) {
      const {left, right, top, bottom, hcenter, vcenter} = outer

      const {margin, halign, valign} = layout.sizing
      const {width, height} = layout.measure(outer)

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

      layout.set_geometry(bbox)
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

      const bbox = (() => {
        switch (anchor) {
          case "top_left":
            return new BBox({left: left + margin, top: top + margin, width, height})
          case "top_center":
            return new BBox({hcenter, top: top + margin, width, height})
          case "top_right":
            return new BBox({right: right - margin, top: top + margin, width, height})
          case "bottom_right":
            return new BBox({right: right - margin, bottom: bottom - margin, width, height})
          case "bottom_center":
            return new BBox({hcenter, bottom: bottom - margin, width, height})
          case "bottom_left":
            return new BBox({left: left + margin, bottom: bottom - margin, width, height})
          case "center_left":
            return new BBox({left: left + margin, vcenter, width, height})
          case "center":
            return new BBox({hcenter, vcenter, width, height})
          case "center_right":
            return new BBox({right: right - margin, vcenter, width, height})
        }
      })()

      layout.set_geometry(bbox)
    }
  }
}
