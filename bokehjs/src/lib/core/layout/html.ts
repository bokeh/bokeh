import {Layoutable} from "./layoutable"
import {Size, SizeHint, Sizeable} from "./types"
import {size, sized, unsized, content_size, extents} from "../dom"

export class ContentBox extends Layoutable {
  private _min_size: Sizeable

  constructor(el: HTMLElement) {
    super()
    this._min_size = unsized(el, () => new Sizeable(size(el)))
  }

  protected _measure(viewport: Sizeable): SizeHint {
    const bounds = viewport.bounded_to(this.sizing.size)
    return this._min_size.expanded_to(bounds)
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
