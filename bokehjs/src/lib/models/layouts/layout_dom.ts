import {UIElement, UIElementView} from "../ui/ui_element"
import {Menu} from "../menus/menu"
import {IterViews} from "core/view"
import {Signal} from "core/signaling"
import {Color} from "core/types"
import {Align, Dimensions, SizingMode} from "core/enums"
import {px, StyleSheet, StyleSheetLike} from "core/dom"
import {isNumber, isArray} from "core/util/types"
import {color2css} from "core/util/color"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMElementView} from "core/dom_view"
import {Layoutable, SizingPolicy, Percent} from "core/layout"
import {CanvasLayer} from "core/util/canvas"
import {SerializableState} from "core/view"

export type DOMBoxSizing = {
  width_policy: SizingPolicy
  height_policy: SizingPolicy
  width: number | null
  height: number | null
  aspect_ratio: number | "auto" | null
  halign?: Align
  valign?: Align
}

export abstract class LayoutDOMView extends UIElementView {
  override model: LayoutDOM
  override parent: DOMElementView | null

  protected _child_views: Map<UIElement, UIElementView>

  layout?: Layoutable

  readonly mouseenter = new Signal<MouseEvent, this>(this, "mouseenter")
  readonly mouseleave = new Signal<MouseEvent, this>(this, "mouseleave")

  get is_layout_root(): boolean {
    return this.is_root || !(this.parent instanceof LayoutDOMView)
  }

  override initialize(): void {
    super.initialize()
    this._child_views = new Map()
  }

  override after_resize(): void {
    this.compute_layout()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_child_views()
  }

  override remove(): void {
    for (const child_view of this.child_views)
      child_view.remove()
    this._child_views.clear()
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
      p.stylesheets,
    ], () => this.invalidate_render())
  }

  override css_classes(): string[] {
    return [...super.css_classes(), ...this.model.css_classes]
  }

  private readonly _style = new StyleSheet()
  readonly stylesheet_for_parent = new StyleSheet()

  override styles(): StyleSheetLike[] {
    return [...super.styles(), this._style, this.stylesheet_for_parent]
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.child_views
  }

  abstract get child_models(): UIElement[]

  get child_views(): UIElementView[] {
    return this.child_models.map((child) => this._child_views.get(child)!)
  }

  async build_child_views(): Promise<void> {
    const {created, removed} = await build_views(this._child_views, this.child_models, {parent: this})

    for (const view of removed) {
      this._resize_observer.unobserve(view.el)
    }

    for (const view of created) {
      this._resize_observer.observe(view.el, {box: "border-box"})
    }
  }

  override render(): void {
    super.render()

    const {background} = this.model
    this.el.style.backgroundColor = background != null ? color2css(background) : ""

    this.class_list.add(...this.css_classes())

    for (const child_view of this.child_views) {
      this.shadow_el.appendChild(child_view.el)
      child_view.render()
      child_view.after_render()
    }
  }

  protected _update_layout(): void {
    const sizing = this.box_sizing()

    function css_sizing(policy: SizingPolicy, size: number | null) {
      switch (policy) {
        case "fixed":
          return size != null ? px(size) : "max-content"
        case "fit":
          return "max-content"
        case "min":
          return "min-content"
        case "max":
          return "100%"
      }
    }

    const {width, height} = sizing

    this._style.replace(`
      :host {
        width: ${css_sizing(sizing.width_policy, width)};
        height: ${css_sizing(sizing.height_policy, height)};
      }
    `)

    function to_css(value: number | Percent) {
      return isNumber(value) ? px(value) : `${value.percent}%`
    }

    const {min_width, max_width} = this.model
    const {min_height, max_height} = this.model

    this._style.append(`:host { min-width: ${min_width == null ? "0" : to_css(min_width)}; }`)
    this._style.append(`:host { min-height: ${min_height == null ? "0" : to_css(min_height)}; }`)

    if (max_width != null)
      this._style.append(`:host { max-width: ${to_css(max_width)}; }`)
    if (max_height != null)
      this._style.append(`:host { max-height: ${to_css(max_height)}; }`)

    const {aspect_ratio} = sizing
    if (aspect_ratio == "auto") {
      if (width != null && height != null)
        this._style.append(`:host { aspect-ratio: ${width} / ${height}; }`)
    } else if (isNumber(aspect_ratio))
      this._style.append(`:host { aspect-ratio: ${aspect_ratio}; }`)

    const {margin} = this.model
    if (margin != null) {
      if (isNumber(margin))
        this._style.append(`:host { margin: ${px(margin)}; }`)
      else if (margin.length == 2) {
        const [vertical, horizontal] = margin
        this._style.append(`:host { margin: ${px(vertical)} ${px(horizontal)}; }`)
      } else {
        const [top, right, bottom, left] = margin
        this._style.append(`:host { margin: ${px(top)} ${px(right)} ${px(bottom)} ${px(left)}; }`)
      }
    }

    const {resizable} = this.model
    if (resizable !== false) {
      const resize = (() => {
        switch (resizable) {
          case "width": return "horizontal"
          case "height": return "vertical"
          case true:
          case "both": return "both"
        }
      })()

      this._style.append(`
        :host {
          resize: ${resize};
          overflow: auto;
        }
      `)
    }
  }

  update_layout(): void {
    for (const child_view of this.child_views) {
      if (child_view instanceof LayoutDOMView)
        child_view.update_layout()
    }

    this._update_layout()
  }

  compute_layout(): void {
    if (this.parent instanceof LayoutDOMView && this.parent.layout != null)
      this.parent.compute_layout()
    else {
      this.update_bbox()
      this.layout?.compute(this.bbox.size)
      this.after_layout()
    }
  }

  update_bbox(): void {
    for (const child_view of this.child_views) {
      if (child_view instanceof LayoutDOMView)
        child_view.update_bbox()
    }

    this._update_bbox()
  }

  protected _after_layout(): void {}

  after_layout(): void {
    for (const child_view of this.child_views) {
      if (child_view instanceof LayoutDOMView)
        child_view.after_layout()
    }

    this._after_layout()
    this.finish()
  }

  override renderTo(element: Node): void {
    element.appendChild(this.el)
    this.build()
    this.notify_finished()
  }

  override after_render(): void {
    super.after_render()
    this.update_layout()
    this.compute_layout()
  }

  build(): this {
    if (!this.is_layout_root)
      throw new Error(`${this.toString()} is not a root layout`)

    this.render()
    this.after_render()

    return this
  }

  async rebuild(): Promise<void> {
    await this.build_child_views()
    this.invalidate_render()
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

  box_sizing(): DOMBoxSizing {
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

    const [halign, valign] = (() => {
      const {align} = this.model
      if (align == "auto")
        return [undefined, undefined]
      else if (isArray(align))
        return align
      else
        return [align, align]
    })()

    const {width, height} = this.model

    return {
      width_policy,
      height_policy,
      width,
      height,
      aspect_ratio,
      halign,
      valign,
    }
  }

  override export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = (() => {
      switch (type) {
        case "auto": // TODO: actually infer the best type
        case "png": return "canvas"
        case "svg": return "svg"
      }
    })()

    const composite = new CanvasLayer(output_backend, hidpi)

    const {x, y, width, height} = this.bbox
    composite.resize(width, height)

    const bg_color = getComputedStyle(this.el).backgroundColor
    composite.ctx.fillStyle = bg_color
    composite.ctx.fillRect(x, y, width, height)

    for (const view of this.child_views) {
      const region = view.export(type, hidpi)
      const {x, y} = view.bbox
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
    align: p.Property<Align | [Align, Align] | "auto">
    background: p.Property<Color | null>
    css_classes: p.Property<string[]>
    context_menu: p.Property<Menu | null>
    resizable: p.Property<boolean | Dimensions>
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
      const {Boolean, Number, String, Auto, Color, Array, Tuple, Or, Null, Nullable, Ref} = types
      const Number2 = Tuple(Number, Number)
      const Number4 = Tuple(Number, Number, Number, Number)
      return {
        width:         [ Nullable(Number), null ],
        height:        [ Nullable(Number), null ],
        min_width:     [ Nullable(Number), null ],
        min_height:    [ Nullable(Number), null ],
        max_width:     [ Nullable(Number), null ],
        max_height:    [ Nullable(Number), null ],
        margin:        [ Nullable(Or(Number, Number2, Number4)), null ],
        width_policy:  [ Or(SizingPolicy, Auto), "auto" ],
        height_policy: [ Or(SizingPolicy, Auto), "auto" ],
        aspect_ratio:  [ Or(Number, Auto, Null), null ],
        sizing_mode:   [ Nullable(SizingMode), null ],
        disabled:      [ Boolean, false ],
        align:         [ Or(Align, Tuple(Align, Align), Auto), "auto" ],
        background:    [ Nullable(Color), null ],
        css_classes:   [ Array(String), [] ],
        context_menu:  [ Nullable(Ref(Menu)), null ],
        resizable:     [ Or(Boolean, Dimensions), false ],
      }
    })
  }
}
