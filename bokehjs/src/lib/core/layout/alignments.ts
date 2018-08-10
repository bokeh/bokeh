import {SizeHint, Layoutable} from "./layout_canvas"
import {BBox} from "../util/bbox"

export abstract class Container extends Layoutable {
  children: Layoutable[]
}

export abstract class Stack extends Container {}

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

export class AnchorLayout extends Container {

  size_hint(): SizeHint {
    let width = 0
    let height = 0

    for (const child of this.children) {
      const size_hint = child.size_hint()
      width = Math.max(width, size_hint.width)
      height = Math.max(height, size_hint.height)
    }

    return {width, height}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
    /*
    const [hr, vr] = panel.bbox.ranges

    const {location} = this.model
    let sx: number, sy: number
    if (isString(location)) {
      switch (location) {
        case 'top_left':
          sx = hr.start + legend_margin
          sy = vr.start + legend_margin
          break
        case 'top_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.start + legend_margin
          break
        case 'top_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.start + legend_margin
          break
        case 'bottom_right':
          sx = hr.end - legend_margin - legend_width
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.end - legend_margin - legend_height
          break
        case 'bottom_left':
          sx = hr.start + legend_margin
          sy = vr.end - legend_margin - legend_height
          break
        case 'center_left':
          sx = hr.start + legend_margin
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center':
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        case 'center_right':
          sx = hr.end - legend_margin - legend_width
          sy = (vr.end + vr.start)/2 - legend_height/2
          break
        default:
          throw new Error("unreachable code")
      }
    } else if (isArray(location) && location.length == 2) {
      const [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_height
    } else
      throw new Error("unreachable code")
    */
  }
}
