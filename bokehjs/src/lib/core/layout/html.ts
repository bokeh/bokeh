import {Layoutable, ContentLayoutable} from "./layoutable"
import {Size, SizeHint, Sizeable} from "./types"
import {size, sized, unsized, content_size, extents} from "../dom"

export class ContentBox extends ContentLayoutable {
  private content_size: Sizeable

  constructor(el: HTMLElement) {
    super()
    this.content_size = unsized(el, () => new Sizeable(size(el)))
  }

  protected _content_size(): Sizeable {
    return this.content_size
  }
}

export class VariadicBox extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  protected _measure(viewport: Size): SizeHint {
    const bounded = new Sizeable(viewport).bounded_to(this.sizing.size)
    return sized(this.el, bounded, () => {
      const content = new Sizeable(content_size(this.el))
      const {border, padding} = extents(this.el)
      return content.grow_by(border).grow_by(padding).map(Math.ceil)
    })
  }
}
