import {Model} from "../../model"
import {Node} from "../coordinates/node"
import {Styles} from "../dom/styles"
import type {Menu} from "./menus/menu"
import {StyleSheet as BaseStyleSheet} from "../dom/stylesheets"
import type {DictLike} from "core/types"
import type {Align} from "core/enums"
import type {SizingPolicy} from "core/layout"
import type {ViewOf} from "core/view"
import {DOMComponentView} from "core/dom_view"
import type {SerializableState} from "core/view"
import type {StyleSheet, StyleSheetLike} from "core/dom"
import {build_view} from "core/build_views"
import {apply_styles} from "core/css"
import {InlineStyleSheet} from "core/dom"
import {CanvasLayer} from "core/util/canvas"
import type {XY} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {entries} from "core/util/object"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"
import ui_css from "styles/ui.css"
import {Array, Or, Ref, String, Dict, Nullable} from "core/kinds"

export const StylesLike = Or(Dict(Nullable(String)), Ref(Styles)) // TODO: add validation for CSSStyles
export type StylesLike = typeof StylesLike["__type__"]

export const StyleSheets = Array(Or(Ref(BaseStyleSheet), String, Dict(StylesLike)))
export type StyleSheets = typeof StyleSheets["__type__"]

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

export abstract class UIElementView extends DOMComponentView {
  declare model: UIElement

  protected readonly _display = new InlineStyleSheet()
  readonly style = new InlineStyleSheet()

  protected override *_css_classes(): Iterable<string> {
    yield* super._css_classes()
    yield* this.model.css_classes
  }

  protected override *_css_variables(): Iterable<[string, string]> {
    yield* super._css_variables()
    for (const [name, node] of entries(this.model.css_variables)) {
      const value = this.resolve_coordinate(node)
      if (isNumber(value)) {
        yield [name, `${value}px`]
      }
    }
  }

  protected override *_stylesheets(): Iterable<StyleSheet> {
    yield* super._stylesheets()
    yield this.style
    yield this._display
    yield* this._computed_stylesheets()
  }

  protected *_computed_stylesheets(): Iterable<StyleSheet> {
    for (const stylesheet of this.model.stylesheets) {
      if (stylesheet instanceof BaseStyleSheet) {
        yield stylesheet.underlying()
      } else {
        yield new InlineStyleSheet(stylesheet)
      }
    }
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
  get bbox(): BBox {
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

    const {visible, styles, css_classes, css_variables, stylesheets} = this.model.properties
    this.on_change(visible, () => this._update_visible())
    this.on_change(styles, () => this._update_styles())
    this.on_change(css_classes, () => this._update_css_classes())
    this.on_transitive_change(css_variables, () => this._update_css_variables())
    this.on_change(stylesheets, () => this._update_stylesheets())

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

  protected _after_resize(): void {}

  after_resize(): void {
    if (this.update_bbox()) {
      this._after_resize()
    }
    this.finish()
  }

  override render(): void {
    super.render()
    this._apply_styles()
    this._apply_visible()
  }

  protected _after_render(): void {}

  override after_render(): void {
    super.after_render()

    this.update_style()
    this.update_bbox()

    this._after_render()

    // If not displayed, then after_resize() will not be called.
    if (!this.is_displayed) {
      this.finish()
    }
  }

  private _is_displayed: boolean = false
  get is_displayed(): boolean {
    return this._is_displayed
  }

  protected _apply_visible(): void {
    if (this.model.visible) {
      this._display.clear()
    } else {
      // in case `display` element style was set, use `!important` to work around this
      this._display.replace(":host { display: none !important; }")
    }
  }

  protected _apply_styles(): void {
    apply_styles(this.el.style, this.model.styles)
  }

  protected _update_visible(): void {
    this._apply_visible()
  }

  protected _update_styles(): void {
    this.el.removeAttribute("style") // TODO: maintain _applied_styles
    this._apply_styles()
  }

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "auto" || type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    const {width, height} = this.bbox
    canvas.resize(width, height)
    return canvas
  }

  override serializable_state(): SerializableState {
    return {...super.serializable_state(), bbox: this.bbox}
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

  export type Props = Model.Props & {
    visible: p.Property<boolean>
    css_classes: p.Property<string[]>
    css_variables: p.Property<DictLike<Node>>
    styles: p.Property<StylesLike>
    stylesheets: p.Property<StyleSheets>
    context_menu: p.Property<Menu | null>
  }
}

export interface UIElement extends UIElement.Attrs {}

export abstract class UIElement extends Model {
  declare properties: UIElement.Props
  declare __view_type__: UIElementView

  constructor(attrs?: Partial<UIElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UIElement.Props>(({Boolean, Array, String, Ref, AnyRef}) => ({
      visible: [ Boolean, true ],
      css_classes: [ Array(String), [] ],
      css_variables: [ Dict(Ref(Node)), {} ],
      styles: [ StylesLike, {} ],
      stylesheets: [ StyleSheets, [] ],
      context_menu: [ Nullable(AnyRef<Menu>()), null ],
    }))
  }
}
