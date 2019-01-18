import {Size, SizeHint} from "./types"
import {Layoutable} from "./layoutable"
import {sized, content_size} from "../dom"

export class HTML extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  protected _measure(viewport: Size): SizeHint {
    return this.clip_size(sized(this.el, viewport, () => content_size(this.el)))
  }
}
