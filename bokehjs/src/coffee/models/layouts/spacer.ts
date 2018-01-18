import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {extend} from "core/util/object"
import {Variable} from "core/layout/solver"

export class SpacerView extends LayoutDOMView {

  render() {
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
  get_width() {
    return 1
  }

  get_height() {
    return 1
  }
}

export class Spacer extends LayoutDOM {

  get_constrained_variables(): {[key: string]: Variable} {
    return extend({}, super.get_constrained_variables(), {
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
    })
  }
}

Spacer.prototype.type = "Spacer"
Spacer.prototype.default_view = SpacerView
