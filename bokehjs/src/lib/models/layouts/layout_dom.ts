import {Model} from "../../model"
import {SizingMode} from "core/enums"
import {empty, margin, padding} from "core/dom"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {BBox, Layoutable} from "core/layout"

export abstract class LayoutDOMView extends DOMView implements EventListenerObject {
  model: LayoutDOM

  protected _idle_notified: boolean = false

  child_views: {[key: string]: LayoutDOMView}

  layout: Layoutable

  initialize(options: any): void {
    super.initialize(options)
    this.child_views = {}
    this.build_child_views()
  }

  get_layoutable_models(): LayoutDOM[] {
    return []
  }

  get_layoutable_views(): LayoutDOMView[] {
    return this.get_layoutable_models().map((child) => this.child_views[child.id])
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

  protected _available_space(): [number | null, number | null] {
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

      if (inner_width > 0 || inner_height > 0)
        return [inner_width > 0 ? inner_width : null, inner_height > 0 ? inner_height : null]
    }

    // this element is detached from DOM
    return [null, null]
  }

  update_position(): void {
    this.el.style.position = this.is_root ? "relative" : "absolute"
    this.el.style.left = `${this.layout._left.value}px`
    this.el.style.top = `${this.layout._top.value}px`
    this.el.style.width = `${this.layout._width.value}px`
    this.el.style.height = `${this.layout._height.value}px`
  }

  after_layout(): void {
    this._has_finished = true
  }

  do_layout(): void {
    /**
     * Layout's entry point.
     */
    if (!this.is_root)
      this.root.do_layout()
    else
      this._do_layout()
  }

  protected _do_layout(): void {
    const [available_width, available_height] = this._available_space()
    const size_hint = this.layout.size_hint()

    let width: number
    let height: number

    const {width_mode, height_mode} = this.model

    switch (width_mode) {
      case "fixed": {
        if (this.model.width != null)
          width = this.model.width
        else
          throw new Error("fixed mode requires width to be set")
        break
      }
      case "max": {
        width = available_width
        break
      }
      case "auto": {
        if (this.model.width != null)
          width = this.model.width
        else
          width = available_width
        break
      }
      default:
        throw new Error("unreachable")
    }

    switch (height_mode) {
      case "fixed": {
        if (this.model.height != null)
          height = this.model.height
        else
          throw new Error("fixed mode requires height to be set")
        break
      }
      case "max": {
        height = available_height
        break
      }
      case "auto": {
        if (this.model.height != null)
          height = this.model.height
        else
          height = available_height
        break
      }
      default:
        throw new Error("unreachable")
    }

    const outer = new BBox({left: 0, top: 0, width, height})

    let inner: BBox | undefined = undefined

    if (size_hint.inner != null) {
      const {left, top, right, bottom} = size_hint.inner
      inner = new BBox({left, top, right: width - right, bottom: height - bottom})
    }

    this.layout.set_geometry(outer, inner)
    this.update_position()

    // TODO
    this.notify_finished()
  }

  rebuild_child_views(): void {
    this.build_child_views()
    this.do_layout()
  }

  build_child_views(): void {
    const children = this.get_layoutable_models()
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

    // XXX: this.connect(this.model.change, () => this.do_layout())
    this.connect(this.model.properties.sizing_mode.change, () => this.do_layout())
  }

  handleEvent(): void {
    this.do_layout()
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

export type SizingPolicy = "fixed" | "min" | "max" | "auto"

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    width_mode: SizingPolicy
    height_mode: SizingPolicy
    height: number
    width: number
    disabled: boolean
    sizing_mode: SizingMode
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    width_mode: p.Property<SizingPolicy>
    height_mode: p.Property<SizingPolicy>
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
      width:       [ p.Number              ],
      height:      [ p.Number              ],
      width_mode:  [ p.Any,        "auto"  ],
      height_mode: [ p.Any,        "auto"  ],
      disabled:    [ p.Bool,       false   ],
      sizing_mode: [ p.SizingMode, "fixed" ],
      css_classes: [ p.Array,      []      ],
    })
  }
}
LayoutDOM.initClass()
