import {Model} from "../../model"
import {Color} from "core/types"
import {Class} from "core/class"
import {SizingMode} from "core/enums"
import {empty, position, classes, extents, undisplayed} from "core/dom"
import {logger} from "core/logging"
import {isNumber} from "core/util/types"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMView} from "core/dom_view"
import {SizingPolicy, BoxSizing, Margin, Size, Layoutable} from "core/layout"

export namespace LayoutDOMView {
  export type Options = DOMView.Options & {model: LayoutDOM}
}

export abstract class LayoutDOMView extends DOMView {
  model: LayoutDOM

  root: LayoutDOMView
  parent: LayoutDOMView

  protected _idle_notified: boolean = false

  protected _child_views: {[key: string]: LayoutDOMView}

  protected _on_resize?: () => void

  protected _offset_parent: Element | null = null

  protected _parent_observer?: number

  protected _viewport: Partial<Size> = {}

  layout: Layoutable

  initialize(): void {
    super.initialize()
    this.el.style.position = this.is_root ? "relative" : "absolute"
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
      this._on_resize = () => this.resize_layout()
      window.addEventListener("resize", this._on_resize)

      this._parent_observer = setInterval(() => {
        const offset_parent = this.el.offsetParent

        if (this._offset_parent != offset_parent) {
          this._offset_parent = offset_parent

          if (offset_parent != null) {
            this.compute_viewport()
            this.invalidate_layout()
          }
        }
      }, 250)
    }

    const p = this.model.properties
    this.on_change([
      p.width, p.height,
      p.min_width, p.min_height,
      p.max_width, p.max_height,
      p.margin,
      p.width_policy, p.height_policy, p.sizing_mode,
      p.aspect_ratio,
      p.visible, p.disabled,
      p.background, p.css_classes,
    ], () => this.invalidate_layout())
  }

  disconnect_signals(): void {
    if (this._parent_observer != null)
      clearTimeout(this._parent_observer)
    if (this._on_resize != null)
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
    super.render()
    empty(this.el) // XXX: this should be in super

    const {background} = this.model
    this.el.style.backgroundColor = background != null ? background : ""

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

    const margin = this.is_root ? this.layout.sizing.margin : undefined
    position(this.el, this.layout.bbox, margin)

    for (const child_view of this.child_views)
      child_view.update_position()
  }

  after_layout(): void {
    for (const child_view of this.child_views)
      child_view.after_layout()

    this._has_finished = true
  }

  compute_viewport(): void {
    this._viewport = this._viewport_size()
  }

  renderTo(element: HTMLElement): void {
    element.appendChild(this.el)
    this._offset_parent = this.el.offsetParent
    this.compute_viewport()
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
    this.invalidate_layout()
  }

  compute_layout(): void {
    const start = Date.now()
    this.layout.compute(this._viewport)
    this.update_position()
    this.after_layout()
    logger.debug(`layout computed in ${Date.now() - start} ms`)
    this.notify_finished()
  }

  resize_layout(): void {
    this.root.compute_viewport()
    this.root.compute_layout()
  }

  invalidate_layout(): void {
    this.root.update_layout()
    this.root.compute_layout()
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
    return "fit"
  }

  protected _height_policy(): SizingPolicy {
    return "fit"
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
      else if (sizing_mode == "stretch_width")
        width_policy = "max"
      else if (sizing_mode == "stretch_height")
        height_policy = "max"
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

    const margin: Margin | undefined = (() => {
      const {margin} = this.model
      if (margin == null)
        return undefined
      else if (isNumber(margin))
        return {top: margin, right: margin, bottom: margin, left: margin}
      else if (margin.length == 2) {
        const [vertical, horizontal] = margin
        return {top: vertical, right: horizontal, bottom: vertical, left: horizontal}
      } else {
        const [top, right, bottom, left] = margin
        return {top, right, bottom, left}
      }
    })()

    const {visible} = this.model

    return {
      width_policy, height_policy, aspect, margin, visible,
      min_width: min_width!, width: width!, max_width: max_width!,
      min_height: min_height!, height: height!, max_height: max_height!,
    }
  }

  protected _viewport_size(): Partial<Size> {
    return undisplayed(this.el, () => {
      let measuring: HTMLElement | null = this.el

      while (measuring = measuring.parentElement) {
        // .bk-root element doesn't bring any value
        if (measuring.classList.contains("bk-root"))
          continue

        // we reached <body> element, so use viewport size
        if (measuring == document.body) {
          const {margin: {left, right, top, bottom}} = extents(document.body)
          const width  = Math.ceil(document.documentElement!.clientWidth  - left - right)
          const height = Math.ceil(document.documentElement!.clientHeight - top  - bottom)
          return {width, height}
        }

        // stop on first element with sensible dimensions
        const {padding: {left, right, top, bottom}} = extents(measuring)
        const {width, height} = measuring.getBoundingClientRect()

        const inner_width = Math.ceil(width - left - right)
        const inner_height = Math.ceil(height - top - bottom)

        if (inner_width > 0 || inner_height > 0)
          return {
            width: inner_width > 0 ? inner_width : undefined,
            height: inner_height > 0 ? inner_height : undefined,
          }
      }

      // this element is detached from DOM
      return {}
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    width: p.Property<number | null>
    height: p.Property<number | null>
    min_width: p.Property<number | null>
    min_height: p.Property<number | null>
    max_width: p.Property<number | null>
    max_height: p.Property<number | null>
    margin: p.Property<number | [number, number] | [number, number, number, number]>
    width_policy: p.Property<SizingPolicy | "auto">
    height_policy: p.Property<SizingPolicy | "auto">
    aspect_ratio: p.Property<number | "auto" | null>
    sizing_mode: p.Property<SizingMode | null>
    visible: p.Property<boolean>
    disabled: p.Property<boolean>
    background: p.Property<Color | null>
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

    this.define<LayoutDOM.Props>({
      width:         [ p.Number,     null         ],
      height:        [ p.Number,     null         ],
      min_width:     [ p.Number,     null         ],
      min_height:    [ p.Number,     null         ],
      max_width:     [ p.Number,     null         ],
      max_height:    [ p.Number,     null         ],
      margin:        [ p.Any,        [0, 0, 0, 0] ],
      width_policy:  [ p.Any,        "auto"       ],
      height_policy: [ p.Any,        "auto"       ],
      aspect_ratio:  [ p.Any,        null         ],
      sizing_mode:   [ p.SizingMode, null         ],
      visible:       [ p.Boolean,    true         ],
      disabled:      [ p.Boolean,    false        ],
      background:    [ p.Color,      null         ],
      css_classes:   [ p.Array,      []           ],
    })
  }
}
LayoutDOM.initClass()
