import {Model} from "../../model"
import {Class} from "core/class"
import {SizingMode} from "core/enums"
import {empty, position, classes, margin, padding, undisplayed} from "core/dom"
import {logger} from "core/logging"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {SizingPolicy, BoxSizing, Margin, Layoutable} from "core/layout"

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
    this.el.style.position = this.is_root ? "relative" : "absolute"
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
    this.el.style.display = this.model.visible ? "block" : "none"
    position(this.el, this.layout.bbox)

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

  protected _width_policy(): SizingPolicy {
    return "min"
  }

  protected _height_policy(): SizingPolicy {
    return "min"
  }

  box_sizing(): Partial<BoxSizing> {
    let {width_policy, height_policy, aspect_ratio} = this.model
    if (width_policy == "auto")
      width_policy = this._width_policy()
    if (height_policy == "auto")
      height_policy = this._height_policy()

    const {sizing_mode} = this.model
    if (sizing_mode != null) {
      if (sizing_mode == "fixed")
        width_policy = height_policy = "fixed"
      else if (sizing_mode == "stretch_both")
        width_policy = height_policy = "max"
      else {
        if (aspect_ratio == null)
          aspect_ratio = "auto"

        switch (sizing_mode) {
          case "scale_width":
            width_policy = "max"
            height_policy = "min"
            break
          case "scale_height":
            width_policy = "min"
            height_policy = "max"
            break
          case "scale_both":
            width_policy = "max"
            height_policy = "max"
            break
          default:
            throw new Error("unreachable")
        }
      }
    }

    const {min_width, min_height, width, height, max_width, max_height} = this.model

    let aspect: number | undefined
    if (aspect_ratio == null)
      aspect = undefined
    else if (aspect_ratio == "auto") {
      if (width != null && height != null)
        aspect = width/height
      else
        aspect = undefined
    } else
      aspect = aspect_ratio

    let margin: Margin | undefined
    if (this.model.margin != null) {
      const [top, right, bottom, left] = this.model.margin
      margin = {top, right, bottom, left}
    }

    return {
      width_policy, height_policy, aspect, margin,
      min_width: min_width!, width: width!, max_width: max_width!,
      min_height: min_height!, height: height!, max_height: max_height!,
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

  serializable_state(): {[key: string]: unknown} {
    return {
      ...super.serializable_state(),
      bbox: this.layout.bbox.rect,
      children: this.child_views.map((child) => child.serializable_state()),
    }
  }
}

export namespace LayoutDOM {
  export interface Attrs extends Model.Attrs {
    width: number | null
    height: number | null
    min_width: number | null
    min_height: number | null
    max_width: number | null
    max_height: number | null
    margin: [number, number, number, number]
    width_policy: SizingPolicy | "auto"
    height_policy: SizingPolicy | "auto"
    aspect_ratio: number | "auto"
    sizing_mode: SizingMode | null
    visible: boolean
    disabled: boolean
    css_classes: string[]
  }

  export interface Props extends Model.Props {
    width: p.Property<number | null>
    height: p.Property<number | null>
    min_width: p.Property<number | null>
    min_height: p.Property<number | null>
    max_width: p.Property<number | null>
    max_height: p.Property<number | null>
    margin: p.Property<[number, number, number, number]>
    width_policy: p.Property<SizingPolicy | "auto">
    height_policy: p.Property<SizingPolicy | "auto">
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
      width:         [ p.Number,     null         ],
      height:        [ p.Number,     null         ],
      min_width:     [ p.Number,     null         ],
      min_height:    [ p.Number,     null         ],
      max_width:     [ p.Number,     null         ],
      max_height:    [ p.Number,     null         ],
      margin:        [ p.Any,        [0, 0, 0, 0] ],
      width_policy:  [ p.Any,        "auto"       ],
      height_policy: [ p.Any,        "auto"       ],
      aspect_ratio:  [ p.Number,     null         ],
      sizing_mode:   [ p.SizingMode, null         ],
      visible:       [ p.Bool,       true         ],
      disabled:      [ p.Bool,       false        ],
      css_classes:   [ p.Array,      []           ],
    })
  }
}
LayoutDOM.initClass()
