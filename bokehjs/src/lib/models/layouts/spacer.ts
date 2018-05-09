import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Variable} from "core/layout/solver"

export class SpacerView extends LayoutDOMView {
  model: Spacer

  render(): void {
    super.render()
    if (this.model.sizing_mode == "fixed") {
      this.el.style.width = `${this.model.width}px`
      this.el.style.height = `${this.model.height}px`
    }
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-spacer-box")
  }

  // spacer must always have some width/height
  get_width(): number {
    return 1
  }

  get_height(): number {
    return 1
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

  get_constrained_variables(): {[key: string]: Variable} {
    return {
      ...super.get_constrained_variables(),

      on_edge_align_top    : this._top,
      on_edge_align_bottom : this._height_minus_bottom,
      on_edge_align_left   : this._left,
      on_edge_align_right  : this._width_minus_right,

      box_cell_align_top   : this._top,
      box_cell_align_bottom: this._height_minus_bottom,
      box_cell_align_left  : this._left,
      box_cell_align_right : this._width_minus_right,

      box_equal_size_top   : this._top,
      box_equal_size_bottom: this._height_minus_bottom,
      box_equal_size_left  : this._left,
      box_equal_size_right : this._width_minus_right,
    }
  }
}
Spacer.initClass()
