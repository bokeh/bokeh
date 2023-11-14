import type {DOMBoxSizing} from "../ui/ui_element"
import {UIElement, UIElementView} from "../ui/ui_element"
import {Menu} from "../menus/menu"
import {logger} from "core/logging"
import {Signal} from "core/signaling"
import {Align, Dimensions, FlowMode, SizingMode} from "core/enums"
import type {CSSOurStyles} from "core/dom"
import {remove, px} from "core/dom"
import type {Display} from "core/css"
import {isNumber, isArray, isNotNull} from "core/util/types"
import type * as p from "core/properties"

import type {ViewStorage, IterViews} from "core/build_views"
import {build_views} from "core/build_views"
import type {DOMElementView} from "core/dom_view"
import type {Layoutable, Percent} from "core/layout"
import {SizingPolicy} from "core/layout"
import {defer} from "core/util/defer"
import {CanvasLayer} from "core/util/canvas"
import {unreachable} from "core/util/assert"
import type {SerializableState} from "core/view"

export {type DOMBoxSizing}

export type CSSSizeKeyword = "auto" | "min-content" | "fit-content" | "max-content"

type InnerDisplay = "block" | "inline"
type OuterDisplay = "flow" | "flow-root" | "flex" | "grid" | "table"

export type FullDisplay = {inner: InnerDisplay, outer: OuterDisplay}

export abstract class LayoutDOMView extends UIElementView {
  declare model: LayoutDOM
  declare parent: DOMElementView | null

  protected readonly _child_views: ViewStorage<UIElement> = new Map()

  layout?: Layoutable

  readonly mouseenter = new Signal<MouseEvent, this>(this, "mouseenter")
  readonly mouseleave = new Signal<MouseEvent, this>(this, "mouseleave")

  readonly disabled = new Signal<boolean, this>(this, "disabled")

  get is_layout_root(): boolean {
    return this.is_root || !(this.parent instanceof LayoutDOMView)
  }

  private _resized = false

  override _after_resize(): void {
    this._resized = true
    super._after_resize()

    if (this.is_layout_root && !this._was_built) {
      // This can happen only in pathological cases primarily in tests.
      logger.warn(`${this} wasn't built properly`)
      this.render_to(null)
    } else {
      this.compute_layout()
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_child_views()
  }

  override remove(): void {
    for (const child_view of this.child_views) {
      child_view.remove()
    }
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

    if (this.parent instanceof LayoutDOMView) {
      this.connect(this.parent.disabled, (disabled) => {
        this.disabled.emit(disabled || this.model.disabled)
      })
    }

    const p = this.model.properties
    this.on_change(p.disabled, () => {
      this.disabled.emit(this.model.disabled)
    })

    this.on_change([
      p.css_classes,
      p.stylesheets,
      p.width, p.height,
      p.min_width, p.min_height,
      p.max_width, p.max_height,
      p.margin,
      p.width_policy, p.height_policy,
      p.flow_mode, p.sizing_mode,
      p.aspect_ratio,
      p.visible,
    ], () => this.invalidate_layout())
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.child_views
  }

  abstract get child_models(): UIElement[]

  get child_views(): UIElementView[] {
    // TODO In case of a race condition somewhere between layout, resize and children updates,
    // child_models and _child_views may be temporarily inconsistent, resulting in undefined
    // values. Eventually this shouldn't happen and undefined should be treated as a bug.
    return this.child_models.map((child) => this._child_views.get(child)).filter(isNotNull)
  }

  get layoutable_views(): LayoutDOMView[] {
    return this.child_views.filter((c): c is LayoutDOMView => c instanceof LayoutDOMView)
  }

  async build_child_views(): Promise<UIElementView[]> {
    const {created, removed} = await build_views(this._child_views, this.child_models, {parent: this})

    for (const view of removed) {
      this._resize_observer.unobserve(view.el)
    }

    for (const view of created) {
      this._resize_observer.observe(view.el, {box: "border-box"})
    }

    return created
  }

  override render(): void {
    super.render()

    for (const child_view of this.child_views) {
      child_view.render()
      this.shadow_el.appendChild(child_view.el)
      // No after_render() here. See r_after_render().
    }
  }

  protected _update_children(): void {}

  async update_children(): Promise<void> {
    const created_children = new Set(await this.build_child_views())

    if (created_children.size != 0) {
      for (const child_view of this.child_views) {
        remove(child_view.el)
      }

      for (const child_view of this.child_views) {
        this.shadow_el.append(child_view.el)

        if (created_children.has(child_view)) {
          child_view.render()
          if (child_view instanceof LayoutDOMView) {
            child_view.r_after_render()
          } else {
            child_view.after_render()
          }
        }
      }
    }

    this._update_children()
    this.invalidate_layout()
  }

  protected readonly _auto_width: CSSSizeKeyword = "fit-content"
  protected readonly _auto_height: CSSSizeKeyword = "fit-content"

  protected _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "flow"}
  }

  protected _update_layout(): void {
    function css_sizing(policy: SizingPolicy | "auto", size: number | null, auto_size: string, margin: string | null) {
      switch (policy) {
        case "auto":
          return size != null ? px(size) : auto_size
        case "fixed":
          return size != null ? px(size) : "fit-content"
        case "fit":
          return "fit-content"
        case "min":
          return "min-content"
        case "max":
          return margin == null ? "100%" : `calc(100% - ${margin})`
      }
    }

    function css_display(display: FullDisplay): Display {
      // Convert to legacy values due to limitted browser support.
      const {inner, outer} = display
      switch (`${inner} ${outer}`) {
        case "block flow": return "block"
        case "inline flow": return "inline"
        case "block flow-root": return "flow-root"
        case "inline flow-root": return "inline-block"
        case "block flex": return "flex"
        case "inline flex": return "inline-flex"
        case "block grid": return "grid"
        case "inline grid": return "inline-grid"
        case "block table": return "table"
        case "inline table": return "inline-table"
        default: unreachable()
      }
    }

    function to_css(value: number | Percent) {
      return isNumber(value) ? px(value) : `${value.percent}%`
    }

    const styles: CSSOurStyles = {}

    const display = this._intrinsic_display()
    styles.display = css_display(display)

    const sizing = this.box_sizing()
    const {width_policy, height_policy, width, height, aspect_ratio} = sizing

    const computed_aspect = (() => {
      if (aspect_ratio == "auto") {
        if (width != null && height != null) {
          return width/height
        }
      } else if (isNumber(aspect_ratio)) {
        return aspect_ratio
      }

      return null
    })()

    if (aspect_ratio == "auto") {
      if (width != null && height != null) {
        styles.aspect_ratio = `${width} / ${height}`
      } else {
        styles.aspect_ratio = "auto"
      }
    } else if (isNumber(aspect_ratio)) {
      styles.aspect_ratio = `${aspect_ratio}`
    }

    const {margin} = this.model
    const margins = (() => {
      if (margin != null) {
        if (isNumber(margin)) {
          styles.margin = px(margin)
          return {width: px(2*margin), height: px(2*margin)}
        } else if (margin.length == 2) {
          const [vertical, horizontal] = margin
          styles.margin = `${px(vertical)} ${px(horizontal)}`
          return {width: px(2*horizontal), height: px(2*vertical)}
        } else {
          const [top, right, bottom, left] = margin
          styles.margin = `${px(top)} ${px(right)} ${px(bottom)} ${px(left)}`
          return {width: px(left + right), height: px(top + bottom)}
        }
      } else {
        return {width: null, height: null}
      }
    })()

    const [css_width, css_height] = (() => {
      const css_width = css_sizing(width_policy, width, this._auto_width, margins.width)
      const css_height = css_sizing(height_policy, height, this._auto_height, margins.height)

      if (aspect_ratio != null) {
        if (width_policy != height_policy) {
          if (width_policy == "fixed") {
            return [css_width, "auto"]
          }
          if (height_policy == "fixed") {
            return ["auto", css_height]
          }
          if (width_policy == "max") {
            return [css_width, "auto"]
          }
          if (height_policy == "max") {
            return ["auto", css_height]
          }
          return ["auto", "auto"]
        } else {
          if (width_policy != "fixed" && height_policy != "fixed") {
            if (computed_aspect != null) {
              if (computed_aspect >= 1) {
                return [css_width, "auto"]
              } else {
                return ["auto", css_height]
              }
            }
          }
        }
      }

      return [css_width, css_height]
    })()

    styles.width = css_width
    styles.height = css_height

    const {min_width, max_width} = this.model
    const {min_height, max_height} = this.model

    styles.min_width = min_width == null ? "0px" : to_css(min_width)
    styles.min_height = min_height == null ? "0px" : to_css(min_height)

    if (this.is_layout_root) {
      if (max_width != null) {
        styles.max_width = to_css(max_width)
      }

      if (max_height != null) {
        styles.max_height = to_css(max_height)
      }
    } else {
      if (max_width != null) {
        styles.max_width = `min(${to_css(max_width)}, 100%)`
      } else if (width_policy != "fixed") {
        styles.max_width = "100%"
      }

      if (max_height != null) {
        styles.max_height = `min(${to_css(max_height)}, 100%)`
      } else if (height_policy != "fixed") {
        styles.max_height = "100%"
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

      styles.resize = resize
      styles.overflow = "auto"
    }

    this.style.append(":host", styles)
  }

  update_layout(): void {
    this.update_style()

    for (const child_view of this.layoutable_views) {
      child_view.update_layout()
    }

    this._update_layout()
  }

  get is_managed(): boolean {
    return this.parent instanceof LayoutDOMView
  }

  /**
   * Update CSS layout with computed values from canvas layout.
   * This can be done more frequently than `_update_layout()`.
   */
  protected _measure_layout(): void {}

  measure_layout(): void {
    for (const child_view of this.layoutable_views) {
      child_view.measure_layout()
    }

    this._measure_layout()
  }

  private _layout_computed: boolean = false

  compute_layout(): void {
    if (this.parent instanceof LayoutDOMView) { // TODO: this.is_managed
      this.parent.compute_layout()
    } else {
      this.measure_layout()
      this.update_bbox()
      this._compute_layout()
      this.after_layout()
    }
    this._layout_computed = true
  }

  protected _compute_layout(): void {
    if (this.layout != null) {
      this.layout.compute(this.bbox.size)

      for (const child_view of this.layoutable_views) {
        if (child_view.layout == null) {
          child_view._compute_layout()
        } else {
          child_view._propagate_layout()
        }
      }
    } else {
      for (const child_view of this.layoutable_views) {
        child_view._compute_layout()
      }
    }
  }

  protected _propagate_layout(): void {
    for (const child_view of this.layoutable_views) {
      if (child_view.layout == null) {
        child_view._compute_layout()
      }
    }
  }

  override update_bbox(): boolean {
    for (const child_view of this.layoutable_views) {
      child_view.update_bbox()
    }

    const changed = super.update_bbox()

    if (this.layout != null) {
      this.layout.visible = this.is_displayed
    }

    return changed
  }

  protected _after_layout(): void {}

  after_layout(): void {
    for (const child_view of this.layoutable_views) {
      child_view.after_layout()
    }

    this._after_layout()
  }

  private _was_built: boolean = false
  override render_to(target: Node | null): void {
    if (!this.is_layout_root) {
      throw new Error(`${this.toString()} is not a root layout`)
    }

    if (target != null) {
      target.appendChild(this.el)
    }
    this.render()

    this.r_after_render()
    this._was_built = true

    this.notify_finished()
  }

  r_after_render(): void {
    for (const child_view of this.child_views) {
      if (child_view instanceof LayoutDOMView) {
        child_view.r_after_render()
      } else {
        child_view.after_render()
      }
    }

    this.after_render()
  }

  override after_render(): void {
    this._after_render()

    if (!this.is_managed) {
      this.invalidate_layout()
    }

    if (!this._has_finished) {
      if (!this.is_displayed) {
        this.finish()
      } else {
        // In case after_resize() wasn't called (see regression test for issue
        // #9113), then wait one macro task and consider this view finished.
        void defer().then(() => {
          if (!this._resized) {
            this.finish()
          }
        })
      }
    }
  }

  async rebuild(): Promise<void> {
    await this.build_child_views()
    this.invalidate_render()
  }

  invalidate_layout(): void {
    // TODO: it would be better and more efficient to do a localized
    // update, but for now this guarantees consistent state of layout.
    if (this.parent instanceof LayoutDOMView) {
      this.parent.invalidate_layout()
    } else {
      this.update_layout()
      this.compute_layout()
    }
  }

  invalidate_render(): void {
    this.render()
    this.invalidate_layout()
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    if (this.is_layout_root && !this._layout_computed) {
      return false
    }

    for (const child_view of this.child_views) {
      if (!child_view.has_finished()) {
        return false
      }
    }

    return true
  }

  override box_sizing(): DOMBoxSizing {
    let {width_policy, height_policy, aspect_ratio} = this.model

    const {sizing_mode} = this.model
    if (sizing_mode != null) {
      if (sizing_mode == "inherit") {
        if (this.parent instanceof LayoutDOMView) {
          const sizing = this.parent.box_sizing()
          width_policy = sizing.width_policy
          height_policy = sizing.height_policy
          if (aspect_ratio == null) {
            aspect_ratio = sizing.aspect_ratio
          }
        }
      } else if (sizing_mode == "fixed") {
        width_policy = height_policy = "fixed"
      } else if (sizing_mode == "stretch_both") {
        width_policy = height_policy = "max"
      } else if (sizing_mode == "stretch_width") {
        width_policy = "max"
      } else if (sizing_mode == "stretch_height") {
        height_policy = "max"
      } else {
        if (aspect_ratio == null) {
          aspect_ratio = "auto"
        }

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
      if (align == "auto") {
        return [undefined, undefined]
      } else if (isArray(align)) {
        return align
      } else {
        return [align, align]
      }
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
      const {x, y} = view.bbox.scale(composite.pixel_ratio)
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
    flow_mode: p.Property<FlowMode>
    sizing_mode: p.Property<SizingMode | null>
    disabled: p.Property<boolean>
    align: p.Property<Align | [Align, Align] | "auto">
    context_menu: p.Property<Menu | null>
    resizable: p.Property<boolean | Dimensions>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends UIElement {
  declare properties: LayoutDOM.Props
  declare __view_type__: LayoutDOMView

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static {
    this.define<LayoutDOM.Props>((types) => {
      const {Boolean, Number, Auto, Tuple, Or, Null, Nullable, Ref} = types
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
        flow_mode:     [ FlowMode, "block" ],
        sizing_mode:   [ Nullable(SizingMode), null ],
        disabled:      [ Boolean, false ],
        align:         [ Or(Align, Tuple(Align, Align), Auto), "auto" ],
        context_menu:  [ Nullable(Ref(Menu)), null ],
        resizable:     [ Or(Boolean, Dimensions), false ],
      }
    })
  }
}
