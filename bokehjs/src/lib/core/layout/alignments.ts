import {LayoutItem, NormGeom} from "./layout_canvas"

export abstract class Stack extends LayoutItem {
  children: LayoutItem[]

  get_size(): number {
    let size = 0
    for (const child of this.children)
      size += child.get_size()
    return size
  }
}

export class HStack extends Stack {
  _set_geom(geom: NormGeom): void {
    const {top, bottom} = geom
    let {left} = geom

    for (const child of this.children) {
      const width = child.get_size()
      child.set_geom({left, width, top, bottom})
      left += width
    }
  }
}

export class VStack extends Stack {
  _set_geom(geom: NormGeom): void {
    const {left, right} = geom
    let {top} = geom

    for (const child of this.children) {
      const height = child.get_size()
      child.set_geom({top, height, left, right})
      top += height
    }
  }
}
