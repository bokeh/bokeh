import {StyledElement, StyledElementView} from "./styled_element"
import type {Node} from "../coordinates/node"
import type {Menu} from "./menus/menu"
import type {Align} from "core/enums"
import type {SizingPolicy} from "core/layout"
import type {ViewOf} from "core/view"
import type {StyleSheetLike} from "core/dom"
import {build_view} from "core/build_views"
import {InlineStyleSheet} from "core/dom"
import {CanvasLayer} from "core/util/canvas"
import type {XY} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {isNumber} from "core/util/types"
import {defer} from "core/util/defer"
import type * as p from "core/properties"
import ui_css from "styles/ui.css"

export type DOMBoxSizing = {
  width_policy: SizingPolicy | "auto"
  height_policy: SizingPolicy | "auto"
  width: number | null
  height: number | null
  aspect_ratio: number | "auto" | null
  halign?: Align
  valign?: Align
}

const {round, floor} = Math

export abstract class UIElementView extends StyledElementView {
  declare model: UIElement

  protected readonly display = new InlineStyleSheet()

  override computed_stylesheets(): InlineStyleSheet[] {
    return [...super.computed_stylesheets(), this.display]
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), ui_css]
  }

  update_style(): void {
    this.style.clear()
  }

  box_sizing(): DOMBoxSizing {
    return {
      width_policy: "auto", height_policy: "auto",
      width: null, height: null,
      aspect_ratio: null,
    }
  }

  private _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  update_bbox(): boolean {
    return this._update_bbox()
  }

  protected _update_bbox(): boolean {
    const displayed = (() => {
      // Consider using Element.checkVisibility() in the future.
      // https://w3c.github.io/csswg-drafts/cssom-view-1/#dom-element-checkvisibility
      if (!this.el.isConnected) {
        return false
      } else if (this.el.offsetParent != null) {
        return true
      } else {
        const {position, display} = getComputedStyle(this.el)
        return position == "fixed" && display != "none"
      }
    })()

    const bbox = !displayed ? new BBox() : (() => {
      const self = this.el.getBoundingClientRect()

      const {left, top} = (() => {
        if (this.parent != null) {
          const parent = this.parent.el.getBoundingClientRect()
          return {
            left: self.left - parent.left,
            top: self.top - parent.top,
          }
        } else {
          return {left: 0, top: 0}
        }
      })()

      return new BBox({
        left: round(left),
        top: round(top),
        width: floor(self.width),
        height: floor(self.height),
      })
    })()

    const changed = !this._bbox.equals(bbox)
    this._bbox = bbox
    this._is_displayed = displayed
    return changed
  }

  protected _resize_observer: ResizeObserver

  protected _context_menu: ViewOf<Menu> | null = null

  override initialize(): void {
    super.initialize()

    this._resize_observer = new ResizeObserver((_entries) => this.after_resize())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {context_menu} = this.model
    if (context_menu != null) {
      this._context_menu = await build_view(context_menu, {parent: this})
    }
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible} = this.model.properties
    this.on_change(visible, () => this._update_visible())

    this.el.addEventListener("contextmenu", (event) => this.show_context_menu(event))
  }

  get_context_menu(_xy: XY): ViewOf<Menu> | null {
    return this._context_menu
  }

  show_context_menu(event: MouseEvent): void {
    if (!event.shiftKey) {
      const rect = this.el.getBoundingClientRect()
      const x = event.x - rect.x
      const y = event.y - rect.y

      const context_menu = this.get_context_menu({x, y})
      if (context_menu != null) {
        event.stopPropagation()
        event.preventDefault()
        context_menu.show({x, y})
      }
    }
  }

  override remove(): void {
    this._resize_observer.disconnect()
    this._context_menu?.remove()
    super.remove()
  }

  private _resized: boolean = false

  protected _after_resize(): void {}

  after_resize(): void {
    this._resized = true
    if (this.update_bbox()) {
      this._after_resize()
    }
    this.finish()
  }

  override render(): void {
    super.render()
    this._apply_visible()
  }

  protected _after_render(): void {
    this.update_style()
    this.update_bbox()
  }

  override after_render(): void {
    super.after_render()
    this._after_render()

    if (!this._has_finished) {
      // If not displayed, then after_resize() will not be called.
      if (!this.is_displayed) {
        this.force_finished()
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

  private _is_displayed: boolean = false
  get is_displayed(): boolean {
    return this._is_displayed
  }

  protected _apply_visible(): void {
    if (this.model.visible) {
      this.display.clear()
    } else {
      this.display.replace(":host { display: none; }")
    }
  }

  protected _update_visible(): void {
    this._apply_visible()
  }

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "auto" || type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    const {width, height} = this.bbox
    canvas.resize(width, height)
    return canvas
  }

  override resolve_symbol(node: Node): XY | number {
    const value = this.bbox.resolve(node.symbol)
    const {offset} = node
    if (isNumber(value)) {
      return value + offset
    } else {
      const {x, y} = value
      return {x: x + offset, y: y + offset}
    }
  }
}

export namespace UIElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StyledElement.Props & {
    visible: p.Property<boolean>
    context_menu: p.Property<Menu | null>
  }
}

export interface UIElement extends UIElement.Attrs {}

export abstract class UIElement extends StyledElement {
  declare properties: UIElement.Props
  declare __view_type__: UIElementView

  constructor(attrs?: Partial<UIElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UIElement.Props>(({Bool, AnyRef, Nullable}) => ({
      visible: [ Bool, true ],
      context_menu: [ Nullable(AnyRef<Menu>()), null ],
    }))
  }
}
