import {Layoutable} from "./layoutable"
import {Size, SizeHint, Sizeable} from "./types"
import {sized, content_size, extents} from "../dom"

export class HTML extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  protected _measure(viewport: Size): SizeHint {
    const bounded = new Sizeable(viewport).bounded_to(this.sizing.size)
    return sized(this.el, bounded, () => {
      const content = new Sizeable(content_size(this.el))
      const {border, padding} = extents(this.el)
      return content.grow_by(border).grow_by(padding)
    })
  }
}
