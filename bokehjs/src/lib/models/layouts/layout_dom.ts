import {Model} from "../../model"
import {SizingMode} from "core/enums"
import {empty, margin, padding} from "core/dom"
import {logger} from "core/logging"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {SizingPolicy, BoxSizing, WidthSizing, HeightSizing, Layoutable} from "core/layout"

export abstract class LayoutDOMView extends DOMView implements EventListenerObject {
  model: LayoutDOM

  protected _idle_notified: boolean = false

  protected _child_views: {[key: string]: LayoutDOMView}

  layout: Layoutable

  initialize(options: any): void {
    super.initialize(options)
    this._child_views = {}
    this.build_child_views()
    this.update_layout()
  }

  abstract get child_models(): LayoutDOM[]

  get child_views(): LayoutDOMView[] {
    return this.child_models.map((child) => this._child_views[child.id])
  }

  remove(): void {
    for (const child_view of this.child_views) {
      child_view.remove()
    }
    this._child_views = {}
    super.remove()
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

  protected _viewport_size(): {width: number | null, height: number | null} {
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
  }

  update_position(): void {
    this.el.style.position = this.is_root ? "relative" : "absolute"
    this.el.style.left = `${this.layout._left.value}px`
    this.el.style.top = `${this.layout._top.value}px`
    this.el.style.width = `${this.layout._width.value}px`
    this.el.style.height = `${this.layout._height.value}px`

    for (const child_view of this.child_views)
      child_view.update_position()
  }

  after_layout(): void {
    this._has_finished = true

    for (const child_view of this.child_views)
      child_view.after_layout()
  }

  do_layout(): void {
    /**
     * Layout's entry point.
     */
    if (!this.is_root)
      (this.root as LayoutDOMView).do_layout() // XXX
    else
      this._do_layout()
  }

  protected _do_layout(): void {
    const start = Date.now()
    const viewport = this._viewport_size()
    this.layout.compute(viewport)
    this.update_position()
    this.after_layout()
    logger.info(`layout computed in ${Date.now() - start} ms`)
    this.notify_finished()
  }

  rebuild_child_views(): void {
    this.build_child_views()
    this.update_layout()
    this.do_layout()
  }

  build_child_views(): void {
    const children = this.child_models
    build_views(this._child_views, children, {parent: this})

    empty(this.el)

    for (const child_view of this.child_views) {
      this.el.appendChild(child_view.el)
      child_view.render()
    }
  }

  abstract update_layout(): void

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

  get aspect_ratio(): number | undefined {
    const {aspect_ratio, width, height} = this.model

    if (aspect_ratio == null)
      return undefined
    else if (aspect_ratio == "auto")
      if (width == null || height == null)
        return undefined
      else
        return width/height
    else
      return aspect_ratio
  }

  get box_sizing(): BoxSizing {
    const {sizing_mode} = this.model

    if (sizing_mode == null) {
      const {width_policy, height_policy} = this.model

      let width_sizing: WidthSizing
      if (width_policy == "fixed") {
        if (this.model.width != null)
          width_sizing = {width_policy: "fixed", width: this.model.width}
        else
          throw new Error("width must be specified with fixed sizing policy")
      } else if (width_policy == "auto")
        width_sizing = {width_policy: "auto", width: this.model.width}
      else
        width_sizing = {width_policy}

      let height_sizing: HeightSizing
      if (height_policy == "fixed") {
        if (this.model.height != null)
          height_sizing = {height_policy: "fixed", height: this.model.height}
        else
          throw new Error("height must be specified with fixed sizing policy")
      } else if (height_policy == "auto")
        height_sizing = {height_policy: "auto", height: this.model.height}
      else
        height_sizing = {height_policy}

      return {...width_sizing, ...height_sizing, aspect: this.aspect_ratio}
    } else {
      switch (sizing_mode) {
        case "fixed": {
          const {width, height} = this.model
          if (width != null && height != null)
            return {width_policy: "fixed", width, height_policy: "fixed", height}
          else
            throw new Error("width and height must be specified with fixed sizing mode")
        }
        case "stretch_both":
          return {width_policy: "max", height_policy: "max"}
        case "scale_width":
          return {width_policy: "max", height_policy: "min", aspect: this.aspect_ratio || 1.0}
        case "scale_height":
          return {width_policy: "min", height_policy: "max", aspect: this.aspect_ratio || 1.0}
        case "scale_both":
          return {width_policy: "max", height_policy: "max", aspect: this.aspect_ratio || 1.0}
        default:
          throw new Error("unrechable")
      }
    }
  }
}

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    width: number
    height: number
    width_policy: SizingPolicy
    height_policy: SizingPolicy
    aspect_ratio: number | "auto"
    sizing_mode: SizingMode
    visible: boolean
    disabled: boolean
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    width: p.Property<number>
    height: p.Property<number>
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
