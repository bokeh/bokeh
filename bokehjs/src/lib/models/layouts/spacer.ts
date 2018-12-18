import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {SizeHint, Layoutable} from "core/layout"

export class SpacerView extends LayoutDOMView {
  model: Spacer

  get child_models(): LayoutDOM[] {
    return []
  }

  _update_layout(): void {
    const {model} = this

    this.layout = new class extends Layoutable {
      size_hint(): SizeHint {
        const {width, height} = model
        return {
          width: width != null ? width : 0,
          height: height != null ? height : 0,
        }
      }
    }
    this.layout.set_sizing(this.box_sizing())
  }
}

export namespace Spacer {
  export interface Attrs extends LayoutDOM.Attrs {}

  export interface Props extends LayoutDOM.Props {}
}

export interface Spacer extends Spacer.Attrs {}

export class Spacer extends LayoutDOM {
  properties: Spacer.Props

  constructor(attrs?: Partial<Spacer.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Spacer"
    this.prototype.default_view = SpacerView
  }
}
Spacer.initClass()
