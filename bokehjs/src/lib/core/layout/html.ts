import {SizeHint, Layoutable} from "./layoutable"
import {sized, unsized, size} from "../dom"

export class HTML extends Layoutable {

  constructor(readonly el: HTMLElement) {
    super()
  }

  size_hint(): SizeHint {
    const computed = this.clip_size(unsized(this.el, () => size(this.el)))

    const width = this.sizing.width != null ? this.sizing.width : computed.width
    const height = this.sizing.height != null ? this.sizing.height : computed.height

    return {width, height}
  }

  has_hfw(): boolean {
    return true
  }

  // XXX: doesn't preserve aspect
  hfw(width: number): number {
    const {height} = sized(this.el, {width}, () => size(this.el))
    return this.clip_height(height)
  }

  wfh(height: number): number {
    const {width} = sized(this.el, {height}, () => size(this.el))
    return this.clip_width(width)
  }
}
