import {Size, SizeHint, Sizeable} from "./types"
import {Layoutable} from "./layoutable"
import {sized, content_size} from "../dom"

export class HTML extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  protected _measure(viewport: Size): SizeHint {
    const bounded = new Sizeable(viewport).bounded_to(this.sizing.size)
    return sized(this.el, bounded, () => content_size(this.el))
  }
}
