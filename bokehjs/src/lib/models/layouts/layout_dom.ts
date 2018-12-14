import {Model} from "../../model"
import {Class} from "core/class"
import {SizingMode} from "core/enums"
import {empty, classes, margin, padding, undisplayed} from "core/dom"
import {logger} from "core/logging"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {SizingPolicy, BoxSizing, WidthSizing, HeightSizing, Layoutable} from "core/layout"

export namespace LayoutDOMView {
  export type Options = DOMView.Options & {model: LayoutDOM}
}

export abstract class LayoutDOMView extends DOMView {
  model: LayoutDOM

  root: LayoutDOMView
  parent: LayoutDOMView

  protected _idle_notified: boolean = false

  protected _child_views: {[key: string]: LayoutDOMView}

  protected _on_resize: () => void

  layout: Layoutable

  initialize(options: any): void {
    super.initialize(options)
    this._on_resize = () => this.compute_layout()
    this._child_views = {}
    this.build_child_views()
  }

  remove(): void {
    for (const child_view of this.child_views)
      child_view.remove()
    this._child_views = {}
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()

    if (this.is_root) {
      window.addEventListener("resize", this._on_resize)
    }

    this.connect(this.model.properties.sizing_mode.change, () => {
      this.root.update_layout()
      this.root.compute_layout()
    })
  }

  disconnect_signals(): void {
    window.removeEventListener("resize", this._on_resize)
    super.disconnect_signals()
  }

  css_classes(): string[] {
    return super.css_classes().concat(this.model.css_classes)
  }

  abstract get child_models(): LayoutDOM[]

  get child_views(): LayoutDOMView[] {
    return this.child_models.map((child) => this._child_views[child.id])
  }

  build_child_views(): void {
    build_views(this._child_views, this.child_models, {parent: this})
  }

  render(): void {
    empty(this.el)

    classes(this.el).clear().add(...this.css_classes())

    for (const child_view of this.child_views) {
      this.el.appendChild(child_view.el)
      child_view.render()
    }
  }

  abstract _update_layout(): void

  update_layout(): void {
    for (const child_view of this.child_views)
      child_view.update_layout()

    this._update_layout()
  }

  update_position(): void {
    this.el.style.position = this.is_root ? "relative" : "absolute"
    this.el.style.display = this.model.visible ? "block" : "none"
    this.el.style.left = `${this.layout._left.value}px`
    this.el.style.top = `${this.layout._top.value}px`
    this.el.style.width = `${this.layout._width.value}px`
    this.el.style.height = `${this.layout._height.value}px`

    for (const child_view of this.child_views)
      child_view.update_position()
  }

  after_layout(): void {
    for (const child_view of this.child_views)
      child_view.after_layout()

    this._has_finished = true
  }

  renderTo(element: HTMLElement): void {
    element.appendChild(this.el)
    this.build()
  }

  build(): this {
    this.assert_root()
    this.render()
    this.update_layout()
    this.compute_layout()
    return this
  }

  rebuild(): void {
    this.build_child_views()
    this.render()
    this.root.update_layout()
    this.root.compute_layout()
  }

  compute_layout(): void {
    const start = Date.now()
    const viewport = this._viewport_size()
    this.layout.compute(viewport)
    this.update_position()
    this.after_layout()
    logger.debug(`layout computed in ${Date.now() - start} ms`)
    this.notify_finished()
  }

  has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const child_view of this.child_views) {
      if (!child_view.has_finished())
        return false
    }

    return true
  }

  notify_finished(): void {
    if (!this.is_root)
      this.root.notify_finished()
    else {
      if (!this._idle_notified && this.has_finished()) {
        if (this.model.document != null) {
          this._idle_notified = true
          this.model.document.notify_idle(this.model)
        }
      }
    }
  }

  box_sizing(): BoxSizing {
    const {sizing_mode} = this.model

    const resolve_aspect = (aspect: number | "auto" | null): number | undefined => {
      const {width, height} = this.model

      if (aspect == null)
        return undefined
      else if (aspect == "auto") {
        if (width != null && height != null)
          return width/height
        else
          return undefined
      } else
        return aspect
    }

    if (sizing_mode == null) {
      const {width_policy, height_policy} = this.model

      let width_sizing: WidthSizing
      if (width_policy == "fixed") {
        if (this.model.width != null)
          width_sizing = {width_policy: "fixed", width: this.model.width}
        else {
          logger.warn("width must be specified with fixed sizing policy, falling back to auto policy instead")
          width_sizing = {width_policy: "auto"}
        }
      } else if (width_policy == "auto")
        width_sizing = {width_policy: "auto", width: this.model.width}
      else
        width_sizing = {width_policy}

      let height_sizing: HeightSizing
      if (height_policy == "fixed") {
        if (this.model.height != null)
          height_sizing = {height_policy: "fixed", height: this.model.height}
        else {
          logger.warn("height must be specified with fixed sizing policy, falling back to auto policy instead")
          height_sizing = {height_policy: "auto"}
        }
      } else if (height_policy == "auto")
        height_sizing = {height_policy: "auto", height: this.model.height}
      else
        height_sizing = {height_policy}

      const aspect = resolve_aspect(this.model.aspect_ratio)
      return {...width_sizing, ...height_sizing, aspect}
    } else {
      if (sizing_mode == "fixed") {
        const {width, height} = this.model
        if (width != null && height != null)
          return {width_policy: "fixed", width, height_policy: "fixed", height}
        else {
          logger.warn("width and height must be specified with fixed sizing mode, falling back to auto policy instead")
          return {width_policy: "auto", width, height_policy: "auto", height}
        }
      } else if (sizing_mode == "stretch_both") {
        return {width_policy: "max", height_policy: "max"}
      } else {
        const aspect = resolve_aspect(this.model.aspect_ratio || "auto")

        switch (sizing_mode) {
          case "scale_width":
            return {width_policy: "max", height_policy: "min", aspect}
          case "scale_height":
            return {width_policy: "min", height_policy: "max", aspect}
          case "scale_both":
            return {width_policy: "max", height_policy: "max", aspect}
          default:
            throw new Error("unreachable")
        }
      }
    }
  }

  protected _viewport_size(): {width: number | null, height: number | null} {
    return undisplayed(this.el, () => {
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
          return {width, height}
        }

        // stop on first element with sensible dimensions
        const {left, right, top, bottom} = padding(measuring)
        const {width, height} = measuring.getBoundingClientRect()

        const inner_width = width - left - right
        const inner_height = height - top - bottom

        if (inner_width > 0 || inner_height > 0)
          return {
            width: inner_width > 0 ? inner_width : null,
            height: inner_height > 0 ? inner_height : null,
          }
      }

      // this element is detached from DOM
      return {width: null, height: null}
    })
  }
}

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    width: number | null
    height: number | null
    width_policy: SizingPolicy
    height_policy: SizingPolicy
    aspect_ratio: number | "auto"
    sizing_mode: SizingMode | null
    visible: boolean
    disabled: boolean
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    width: p.Property<number | null>
    height: p.Property<number | null>
    width_policy: p.Property<SizingPolicy>
    height_policy: p.Property<SizingPolicy>
    aspect_ratio: p.Property<number | "auto">
    sizing_mode: p.Property<SizingMode>
    visible: p.Property<boolean>
    disabled: p.Property<boolean>
    css_classes: p.Property<string[]>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends Model {
  properties: LayoutDOM.Props
  default_view: Class<LayoutDOMView, [LayoutDOMView.Options]>

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LayoutDOM"

    this.define({
      width:         [ p.Number,     null    ],
      height:        [ p.Number,     null    ],
      width_policy:  [ p.Any,        "auto"  ],
      height_policy: [ p.Any,        "auto"  ],
      aspect_ratio:  [ p.Number,     null    ],
      sizing_mode:   [ p.SizingMode, null    ],
      visible:       [ p.Bool,       true    ],
      disabled:      [ p.Bool,       false   ],
      css_classes:   [ p.Array,      []      ],
    })
  }
}
LayoutDOM.initClass()
