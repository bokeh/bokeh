import {LayoutItem} from "./layout_canvas"
import {SizeHint} from "./index"
import {BBox} from "../util/bbox"
import {Side} from "../enums"

export abstract class Stack extends LayoutItem {
  children: LayoutItem[]
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

  _set_geometry(outer: BBox, inner: BBox): void {
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

  _set_geometry(outer: BBox, inner: BBox): void {
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

export interface Panelable {
  get_size(): number
}

export class SidePanel extends LayoutItem {

  constructor(readonly side: Side, private readonly item: Panelable) {
    super()
  }

  get is_horizontal(): boolean {
    return this.side == "above" || this.side == "below"
  }

  size_hint(): SizeHint {
    const size = axis_view.get_size()
    if (this.is_horizontal)
      return {width: 0, height: size}
    else
      return {width: size, height: 0}
  }

  /*
  _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
    axis_view.model.panel._set_geom(geom)
  }
  */
}
