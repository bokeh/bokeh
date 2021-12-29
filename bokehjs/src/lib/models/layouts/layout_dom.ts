import {UIElement, UIElementView} from "../ui/ui_element"
import {Menu} from "../menus/menu"
import {IterViews} from "core/view"
import {Signal} from "core/signaling"
import {Color} from "core/types"
import {Align, SizingMode} from "core/enums"
import {classes, StyleSheetLike} from "core/dom"
import {logger} from "core/logging"
import {BBox} from "core/util/bbox"
import {isNumber, isArray} from "core/util/types"
import {color2css} from "core/util/color"
import {assign} from "core/util/object"
import {parse_css_font_size} from "core/util/text"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMComponentView} from "core/dom_view"
import {SizingPolicy, BoxSizing, Size, Layoutable} from "core/layout"
import {CanvasLayer} from "core/util/canvas"
import {SerializableState} from "core/view"

export abstract class LayoutDOMView extends UIElementView {
  override model: LayoutDOM

  override el: HTMLElement

  protected _child_views: Map<LayoutDOM, LayoutDOMView>

  protected _viewport: Partial<Size> = {}

  protected _resize_observer: ResizeObserver

  layout: Layoutable

  override get bbox(): BBox {
    return this.layout.bbox
  }

  readonly mouseenter = new Signal<MouseEvent, this>(this, "mouseenter")
  readonly mouseleave = new Signal<MouseEvent, this>(this, "mouseleave")

  get is_layout_root(): boolean {
    return this.is_root || !(this.parent instanceof LayoutDOMView)
  }

  get base_font_size(): number | null {
    const font_size = getComputedStyle(this.el).fontSize
    const result = parse_css_font_size(font_size)

    if (result != null) {
      const {value, unit} = result
      if (unit == "px")
        return value
    }

    return null
  }

  override initialize(): void {
    super.initialize()
    this._child_views = new Map()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_child_views()
  }

  override remove(): void {
    for (const child_view of this.child_views)
      child_view.remove()
    this._child_views.clear()
    this._resize_observer.disconnect()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    this.el.addEventListener("mouseenter", (event) => {
      this.mouseenter.emit(event)
    })
    this.el.addEventListener("mouseleave", (event) => {
      this.mouseleave.emit(event)
    })
    this.el.addEventListener("contextmenu", (event) => {
      if (this.model.context_menu != null) {
        console.log("context menu")
        event.preventDefault()
      }
    })

    this._resize_observer = new ResizeObserver((entries) => {
      const {width, height} = entries[0].contentRect
      console.log("resize", `${this}`, width, height)
      this.resize_layout(width, height)

      this._has_finished = true
      this.notify_finished()
    })
    this._resize_observer.observe(this.el, {box: "border-box"})

    const p = this.model.properties
    this.on_change([
      p.width, p.height,
      p.min_width, p.min_height,
      p.max_width, p.max_height,
      p.margin,
      p.width_policy, p.height_policy, p.sizing_mode,
      p.aspect_ratio,
      p.visible,
    ], () => this.invalidate_layout())

    this.on_change([
      p.background,
      p.css_classes,
      p.style,
      p.stylesheets,
    ], () => this.invalidate_render())
  }

  override disconnect_signals(): void {
    super.disconnect_signals()
  }

  override css_classes(): string[] {
    return [...super.css_classes(), ...this.model.css_classes]
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), ...this.model.stylesheets]
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.child_views
  }

  abstract get child_models(): LayoutDOM[]

  get child_views(): LayoutDOMView[] {
    return this.child_models.map((child) => this._child_views.get(child)!)
  }

  async build_child_views(): Promise<void> {
    await build_views(this._child_views, this.child_models, {parent: this})
  }

  override render(): void {
    this.empty()

    assign(this.el.style, this.model.style)

    const {background} = this.model
    this.el.style.backgroundColor = background != null ? color2css(background) : ""

    classes(this.el).clear().add(...this.css_classes())

    for (const child_view of this.child_views) {
      this.shadow_el.appendChild(child_view.el)
      child_view.render()
    }
  }

  _update_layout(): void {
    const sizing = this.box_sizing()

    const {style} = this.el
    style.display = (sizing.visible ?? true) ? "" : "none"
    style.width = sizing.width != null ? `${sizing.width}px` : "auto"
    style.height = sizing.height != null ? `${sizing.height}px` : "auto"
    style.minWidth = `${sizing.min_width}px`
    style.minHeight = `${sizing.min_height}px`
    style.aspectRatio = `${sizing.aspect}`

    if (sizing.margin != null) {
      const {left, right, top, bottom} = sizing.margin
      style.margin = `${top}px ${right}px ${bottom}px ${left}px`
    }
    // TODO: padding
    // valign
    // halign
  }

  update_layout(): void {
    for (const child_view of this.child_views) {
      child_view.update_layout()
    }

    this._update_layout()
  }

  update_position(): void {
    for (const child_view of this.child_views)
      child_view.update_position()
  }

  after_layout(): void {
    for (const child_view of this.child_views)
      child_view.after_layout()
  }

  update_viewport(width?: number, height?: number): boolean {
    if (width == null)
      width = parseFloat(getComputedStyle(this.el).width)
    if (height == null)
      height = parseFloat(getComputedStyle(this.el).height)

    if (this._viewport.width != width || this._viewport.height != height) {
      this._viewport = {width, height}
      return true
    }

    return false
  }

  override renderTo(element: Node): void {
    element.appendChild(this.el)
    this.build()
    this.notify_finished()
  }

  build(): this {
    if (!this.is_layout_root)
      throw new Error(`${this.toString()} is not a root layout`)

    this.render()
    this.update_layout()
    this.update_viewport()
    this.compute_layout()

    return this
  }

  async rebuild(): Promise<void> {
    await this.build_child_views()
    this.invalidate_render()
  }

  compute_layout(): void {
    const start = Date.now()
    this.layout?.compute(this._viewport)
    this.update_position()
    this.after_layout()
    logger.debug(`layout computed in ${Date.now() - start} ms`)
  }

  resize_layout(width: number, height: number): void {
    if (this.update_viewport(width, height))
      this.compute_layout()
  }

  invalidate_layout(): void {
    this.update_layout()
    this.compute_layout()
  }

  invalidate_render(): void {
    this.render()
    this.invalidate_layout()
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const child_view of this.child_views) {
      if (!child_view.has_finished())
        return false
    }

    return true
  }

  protected _width_policy(): SizingPolicy {
    return "fixed"
  }

  protected _height_policy(): SizingPolicy {
    return "fixed"
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
        }
      }
    }

    const sizing: Partial<BoxSizing> = {width_policy, height_policy}

    const {min_width, min_height} = this.model
    if (min_width != null)
      sizing.min_width = min_width
    if (min_height != null)
      sizing.min_height = min_height

    const {width, height} = this.model
    if (width != null)
      sizing.width = width
    if (height != null)
      sizing.height = height

    const {max_width, max_height} = this.model
    if (max_width != null)
      sizing.max_width = max_width
    if (max_height != null)
      sizing.max_height = max_height

    if (aspect_ratio == "auto" && width != null && height != null)
      sizing.aspect = width/height
    else if (isNumber(aspect_ratio))
      sizing.aspect = aspect_ratio

    const {margin} = this.model
    if (margin != null) {
      if (isNumber(margin))
        sizing.margin = {top: margin, right: margin, bottom: margin, left: margin}
      else if (margin.length == 2) {
        const [vertical, horizontal] = margin
        sizing.margin = {top: vertical, right: horizontal, bottom: vertical, left: horizontal}
      } else {
        const [top, right, bottom, left] = margin
        sizing.margin = {top, right, bottom, left}
      }
    }

    sizing.visible = this.model.visible

    const {align} = this.model
    if (isArray(align))
      [sizing.halign, sizing.valign] = align
    else
      sizing.halign = sizing.valign = align

    return sizing
  }

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = (() => {
      switch (type) {
        case "auto": // TODO: actually infer the best type
        case "png": return "canvas"
        case "svg": return "svg"
      }
    })()

    const composite = new CanvasLayer(output_backend, hidpi)

    const {x, y, width, height} = this.layout.bbox
    composite.resize(width, height)

    const bg_color = getComputedStyle(this.el).backgroundColor
    composite.ctx.fillStyle = bg_color
    composite.ctx.fillRect(x, y, width, height)

    for (const view of this.child_views) {
      const region = view.export(type, hidpi)
      const {x, y} = view.layout.bbox
      composite.ctx.drawImage(region.canvas, x, y)
    }

    return composite
  }

  override serializable_state(): SerializableState {
    return {
      ...super.serializable_state(),
      children: this.child_views.map((child) => child.serializable_state()),
    }
  }
}

export type FilterStrings<T> = {[K in keyof T & string as T[K] extends string ? K : never]?: T[K]}

export type CSSInlineStyle = FilterStrings<CSSStyleDeclaration>

export namespace LayoutDOM {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    width: p.Property<number | null>
    height: p.Property<number | null>
    min_width: p.Property<number | null>
    min_height: p.Property<number | null>
    max_width: p.Property<number | null>
    max_height: p.Property<number | null>
    margin: p.Property<number | [number, number] | [number, number, number, number] | null>
    width_policy: p.Property<SizingPolicy | "auto">
    height_policy: p.Property<SizingPolicy | "auto">
    aspect_ratio: p.Property<number | "auto" | null>
    sizing_mode: p.Property<SizingMode | null>
    disabled: p.Property<boolean>
    align: p.Property<Align | [Align, Align]>
    background: p.Property<Color | null>
    css_classes: p.Property<string[]>
    style: p.Property<CSSInlineStyle>
    stylesheets: p.Property<string[]>
    context_menu: p.Property<Menu | null>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends UIElement {
  override properties: LayoutDOM.Props
  override __view_type__: LayoutDOMView

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static {
    this.define<LayoutDOM.Props>((types) => {
      const {Boolean, Number, String, Auto, Color, Array, Tuple, Dict, Or, Null, Nullable, Ref} = types
      const Number2 = Tuple(Number, Number)
      const Number4 = Tuple(Number, Number, Number, Number)
      return {
        width:         [ Nullable(Number), null ],
        height:        [ Nullable(Number), null ],
        min_width:     [ Nullable(Number), null ],
        min_height:    [ Nullable(Number), null ],
        max_width:     [ Nullable(Number), null ],
        max_height:    [ Nullable(Number), null ],
        margin:        [ Nullable(Or(Number, Number2, Number4)), [0, 0, 0, 0] ],
        width_policy:  [ Or(SizingPolicy, Auto), "auto" ],
        height_policy: [ Or(SizingPolicy, Auto), "auto" ],
        aspect_ratio:  [ Or(Number, Auto, Null), null ],
        sizing_mode:   [ Nullable(SizingMode), null ],
        disabled:      [ Boolean, false ],
        align:         [ Or(Align, Tuple(Align, Align)), "start" ],
        background:    [ Nullable(Color), null ],
        css_classes:   [ Array(String), [] ],
        style:         [ Dict(String), {} ], // TODO: add validation for CSSInlineStyle
        stylesheets:   [ Array(String), [] ],
        context_menu:  [ Nullable(Ref(Menu)), null ],
      }
    })
  }
}
