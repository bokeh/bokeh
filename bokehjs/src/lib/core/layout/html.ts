import {Layoutable} from "./layoutable"
import {Size, SizeHint, Sizeable} from "./types"
import {size, sized, unsized, content_size, extents} from "../dom"

export class ContentBox extends Layoutable {
  private content_size: Sizeable

  constructor(el: HTMLElement) {
    super()
    this.content_size = unsized(el, () => new Sizeable(size(el)))
  }

  /*
  protected _min_size(): SizeHint {
    return this.content_size.expanded_to(this.sizing.min_size)
    .map(...) // apply fixed size (?)
  }

  protected _max_size(): SizeHint {
    return this.sizing.max_size
  }
  */

  protected _measure(viewport: Sizeable): SizeHint {
    const bounds = viewport.bounded_to(this.sizing.size)
                           .bounded_to(this.content_size)

    const width = (() => {
      switch (this.sizing.width_policy) {
        case "fixed":
          return this.sizing.width != null ? this.sizing.width : this.content_size.width
        case "min":
          return this.content_size.width
        case "fit":
          return bounds.width
        case "max":
          return Math.max(this.content_size.width, bounds.width)
        default:
          throw new Error("unexpected")
      }
    })()

    const height = (() => {
      switch (this.sizing.height_policy) {
        case "fixed":
          return this.sizing.height != null ? this.sizing.height : this.content_size.height
        case "min":
          return this.content_size.height
        case "fit":
          return bounds.height
        case "max":
          return Math.max(this.content_size.height, bounds.height)
        default:
          throw new Error("unexpected")
      }
    })()

    return {width, height}
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
