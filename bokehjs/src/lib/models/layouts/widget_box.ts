import {logger} from "core/logging"
import * as p from "core/properties"
import {Variable} from "core/layout/solver"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export class WidgetBoxView extends LayoutDOMView {
  model: WidgetBox

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild_child_views())
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-widget-box")
  }

  render(): void {
    this._render_classes() // XXX: because no super()

    if (this.model.sizing_mode == 'fixed' || this.model.sizing_mode == 'scale_height') {
      const width = this.get_width()
      if (this.model._width.value != width)
        this.solver.suggest_value(this.model._width, width)
    }

    if (this.model.sizing_mode == 'fixed' || this.model.sizing_mode == 'scale_width') {
      const height = this.get_height()
      if (this.model._height.value != height)
        this.solver.suggest_value(this.model._height, height)
    }

    this.solver.update_variables()

    if (this.model.sizing_mode == 'stretch_both') {
      this.el.style.position = 'absolute'
      this.el.style.left = `${this.model._dom_left.value}px`
      this.el.style.top = `${this.model._dom_top.value}px`
      this.el.style.width = `${this.model._width.value}px`
      this.el.style.height = `${this.model._height.value}px`
    } else {
      // Note we DO NOT want to set a height (except in stretch_both). Widgets
      // are happier sizing themselves. We've tried to tell the layout what
      // the height is with the suggest_value. But that doesn't mean we need
      // to put it in the dom.
      let css_width: string
      if (this.model._width.value - 20 > 0)
        css_width = `${this.model._width.value - 20}px`
      else
        css_width = "100%"

      this.el.style.width = css_width
    }
  }

  get_height(): number {
    let height = 0
    for (const key in this.child_views) {
      const child_view = this.child_views[key]
      const el = child_view.el
      const style = getComputedStyle(el)
      const marginTop = parseInt(style.marginTop!) || 0
      const marginBottom = parseInt(style.marginBottom!) || 0
      height += el.offsetHeight + marginTop + marginBottom
    }
    return height + 20
  }

  get_width(): number {
    if (this.model.width != null)
      return this.model.width
    else {
      let width = this.el.scrollWidth + 20
      for (const key in this.child_views) {
        const child_view = this.child_views[key]
        // Take the max width of all the children as the constrainer.
        const child_width = child_view.el.scrollWidth
        if (child_width > width)
          width = child_width
      }
      return width
    }
  }
}

export namespace WidgetBox {
  export interface Attrs extends LayoutDOM.Attrs {
    children: LayoutDOM[]
  }

  export interface Props extends LayoutDOM.Props {
    children: p.Property<LayoutDOM[]>
  }
}

export interface WidgetBox extends WidgetBox.Attrs {}

export class WidgetBox extends LayoutDOM {

  properties: WidgetBox.Props

  constructor(attrs?: Partial<WidgetBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "WidgetBox"
    this.prototype.default_view = WidgetBoxView

    this.define({
      children: [ p.Array, [] ],
    })
  }

  initialize(): void {
    super.initialize()
    if (this.sizing_mode == 'fixed' && this.width == null) {
      this.width = 300 // Set a default for fixed.
      logger.info("WidgetBox mode is fixed, but no width specified. Using default of 300.")
    }
  }

  get_constrained_variables(): {[key: string]: Variable} {
    const vars: {[key: string]: Variable} = {
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
    }

    if (this.sizing_mode != 'fixed') {
      vars.box_equal_size_left  = this._left
      vars.box_equal_size_right = this._width_minus_right
    }

    return vars
  }

  get_layoutable_children(): LayoutDOM[] {
    return this.children
  }
}

WidgetBox.initClass()
