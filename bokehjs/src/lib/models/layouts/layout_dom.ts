import {Model} from "../../model"
import {SizingMode} from "core/enums"
import {empty, margin, padding} from "core/dom"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"

export abstract class LayoutDOMView extends DOMView implements EventListenerObject {
  model: LayoutDOM

  protected _idle_notified: boolean = false

  child_views: {[key: string]: LayoutDOMView}

  _left: Variable
  _right: Variable
  _top: Variable
  _bottom: Variable
  _width: Variable
  _height: Variable

  _inner_left: Variable
  _inner_right: Variable
  _inner_top: Variable
  _inner_bottom: Variable
  _inner_width: Variable
  _inner_height: Variable

  _offset_right: Variable
  _offset_bottom: Variable

  initialize(options: any): void {
    super.initialize(options)

    this._left = new Variable(`${this.toString()}.left`)
    this._right = new Variable(`${this.toString()}.right`)
    this._top = new Variable(`${this.toString()}.top`)
    this._bottom = new Variable(`${this.toString()}.bottom`)
    this._width = new Variable(`${this.toString()}.width`)
    this._height = new Variable(`${this.toString()}.height`)

    this._inner_left = new Variable(`${this.toString()}.inner_left`)
    this._inner_right = new Variable(`${this.toString()}.inner_right`)
    this._inner_top = new Variable(`${this.toString()}.inner_top`)
    this._inner_bottom = new Variable(`${this.toString()}.inner_bottom`)
    this._inner_width = new Variable(`${this.toString()}.inner_width`)
    this._inner_height = new Variable(`${this.toString()}.inner_height`)

    this._offset_right = new Variable(`${this.toString()}.offset_right`)
    this._offset_bottom = new Variable(`${this.toString()}.offset_bottom`)

    this.child_views = {}
    this.build_child_views()
  }

  get layout_bbox(): {[key: string]: number} {
    return {
      top: this._top.value,
      left: this._left.value,
      right: this._right.value,
      bottom: this._bottom.value,
      width: this._width.value,
      height: this._height.value,
    }
  }

  dump_layout(): void {
    const layoutables: {[key: string]: {[key: string]: number}} = {}
    const pending: LayoutDOM[] = [this]

    let obj: LayoutDOM | undefined
    while (obj = pending.shift()) {
      pending.push(...obj.get_layoutable_children())
      layoutables[obj.toString()] = obj.layout_bbox
    }

    console.table(layoutables)
  }

  get_layoutable_children(): LayoutDOM[] {
    return []
  }

  remove(): void {
    for (const model_id in this.child_views) {
      const view = this.child_views[model_id]
      view.remove()
    }
    this.child_views = {}
    super.remove()
  }

  has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const model_id in this.child_views) {
      const child = this.child_views[model_id]
      if (!child.has_finished())
        return false
    }

    return true
  }

  notify_finished(): void {
    if (!this.is_root)
      super.notify_finished()
    else {
      if (!this._idle_notified && this.has_finished()) {
        if (this.model.document != null) {
          this._idle_notified = true
          this.model.document.notify_idle(this.model)
        }
      }
    }
  }

  protected _calc_width_height(): [number | null, number | null] {
    let measuring: HTMLElement | null = this.el

    while (measuring = measuring.parentElement) {
      // .bk-root element doesn't bring any value
      if (measuring.classList.contains("bk-root"))
        continue

      // we reached <body> element, so use viewport size
      if (measuring == document.body) {
        const {left, right, top, bottom} = margin(document.body)
        const width  = document.documentElement!.clientWidth  - left - right
        const height = document.documentElement!.clientHeight - top  - bottom
        return [width, height]
      }

      // stop on first element with sensible dimensions
      const {left, right, top, bottom} = padding(measuring)
      const {width, height} = measuring.getBoundingClientRect()

      const inner_width = width - left - right
      const inner_height = height - top - bottom

      switch (this.model.sizing_mode) {
        case "scale_width": {
          if (inner_width > 0)
            return [inner_width, inner_height > 0 ? inner_height : null]
          break
        }
        case "scale_height": {
          if (inner_height > 0)
            return [inner_width > 0 ? inner_width : null, inner_height]
          break
        }
        case "scale_both":
        case "stretch_both": {
          if (inner_width > 0 || inner_height > 0)
            return [inner_width > 0 ? inner_width : null, inner_height > 0 ? inner_height : null]
          break
        }
        default:
          throw new Error("unreachable")
      }
    }

    // this element is detached from DOM
    return [null, null]
  }

  suggest_dims(): void {
    switch (this.model.sizing_mode) {
      case "fixed": {
        // If the width or height is unset:
        // - compute it from children
        // - but then save for future use
        // (for some reason widget boxes keep shrinking if you keep computing
        // but this is more efficient and appropriate for fixed anyway).
        let width: number
        if (this.model.width != null)
          width = this.model.width
        else
          width = this.get_width()
          this.model.setv({width: width}, {silent: true})

        let height: number
        if (this.model.height != null)
          height = this.model.height
        else
          height = this.get_height()
          this.model.setv({height: height}, {silent: true})

        this.solver.suggest_value(this._width, width)
        this.solver.suggest_value(this._height, height)
        break
      }
      case "scale_width": {
        const height = this.get_height()
        this.solver.suggest_value(this._height, height)
        break
      }
      case "scale_height": {
        const width = this.get_width()
        this.solver.suggest_value(this._width, width)
        break
      }
      case "scale_both": {
        const [width, height] = this.get_width_height()
        this.solver.suggest_value(this._width, width)
        this.solver.suggest_value(this._height, height)
        break
      }
    }
  }

  update_geometry(): void {
    this.el.style.position = "absolute"
    this.el.style.left = `${this._left.value}px`
    this.el.style.top = `${this._top.value}px`
    this.el.style.width = `${this._width.value}px`
    this.el.style.height = `${this._height.value}px`
  }

  after_layout(): void {
    this._has_finished = true
  }

  layout(): void {
    if (!this.is_root)
      (this.root as LayoutDOMView).layout()
    else
      this._do_layout()
  }

  protected _do_layout(): void {
    // TODO
    this.notify_finished()
  }

  protected _layout(): void {
    for (const child of this.model.get_layoutable_children()) {
      const child_view = this.child_views[child.id]
      child_view._layout()
    }
  }

  rebuild_child_views(): void {
    this.build_child_views()
    this.layout()
  }

  build_child_views(): void {
    const children = this.model.get_layoutable_children()
    build_views(this.child_views, children, {parent: this})

    empty(this.el)

    for (const child of children) {
      // Look-up the child_view in this.child_views and then append We can't just
      // read from this.child_views because then we don't get guaranteed ordering.
      // Which is a problem in non-box layouts.
      const child_view = this.child_views[child.id]
      this.el.appendChild(child_view.el)
      child_view.render()
    }
  }

  connect_signals(): void {
    super.connect_signals()

    if (this.is_root)
      window.addEventListener("resize", this)

    // XXX: this.connect(this.model.change, () => this.layout())
    this.connect(this.model.properties.sizing_mode.change, () => this.layout())
  }

  handleEvent(): void {
    this.layout()
  }

  disconnect_signals(): void {
    window.removeEventListener("resize", this)
    super.disconnect_signals()
  }

  protected _render_classes(): void {
    this.el.className = "" // removes all classes

    const css_classes = this.css_classes().concat(this.model.css_classes)
    for (const name of css_classes)
      this.el.classList.add(name)
  }

  render(): void {
    this._render_classes()
  }
}

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    height: number
    width: number
    disabled: boolean
    sizing_mode: SizingMode
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    height: p.Property<number>
    width: p.Property<number>
    disabled: p.Property<boolean>
    sizing_mode: p.Property<SizingMode>
    css_classes: p.Property<string[]>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends Model {
  properties: LayoutDOM.Props

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LayoutDOM"

    this.define({
      height:      [ p.Number              ],
      width:       [ p.Number              ],
      disabled:    [ p.Bool,       false   ],
      sizing_mode: [ p.SizingMode, "fixed" ],
      css_classes: [ p.Array,      []      ],
    })
  }
}
LayoutDOM.initClass()
