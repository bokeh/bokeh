import {Model} from "../../model"
import {Styles} from "../dom/styles"
import {StyleSheet as BaseStyleSheet} from "../dom/stylesheets"
import {logger} from "core/logging"
import {Align} from "core/enums"
import {SizingPolicy} from "core/layout"
import {DOMComponentView} from "core/dom_view"
import {SerializableState} from "core/view"
import {CSSStyles, StyleSheet, InlineStyleSheet, StyleSheetLike} from "core/dom"
import {CanvasLayer} from "core/util/canvas"
import {keys, entries} from "core/util/object"
import {BBox} from "core/util/bbox"
import {isString} from "core/util/types"
import * as p from "core/properties"
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

const {round} = Math

function* _iter_styles(styles: CSSStyles | Styles): Iterable<[string, unknown]> {
  if (styles instanceof Styles) {
    const model_attrs = new Set(keys(Model.prototype._props))
    for (const prop of styles) {
      if (!model_attrs.has(prop.attr)) {
        yield [prop.attr, prop.get_value()]
      }
    }
  } else
    yield* entries(styles)
}

export abstract class UIElementView extends DOMComponentView {
  declare model: UIElement

  protected readonly _display = new InlineStyleSheet()
  readonly style = new InlineStyleSheet()

  get stylesheets(): StyleSheet[] {
    return [...this._stylesheets()]
  }

  protected *_stylesheets(): Iterable<StyleSheet> {
    yield this.style
    yield this._display
  }

  get computed_stylesheets(): StyleSheet[] {
    return [...this._computed_stylesheets()]
  }

  protected *_computed_stylesheets(): Iterable<StyleSheet> {
    for (const stylesheet of this.model.stylesheets) {
      if (isString(stylesheet)) {
        yield new InlineStyleSheet(stylesheet)
      } else if (stylesheet instanceof BaseStyleSheet) {
        yield stylesheet.underlying()
      } else {
        const output = []

        for (const [selector, styles] of entries(stylesheet)) {
          output.push(`${selector} {`)

          for (const [attr, value] of _iter_styles(styles)) {
            const name = attr.replace(/_/g, "-")

            if (isString(value) && value.length != 0) {
              output.push(`  ${name}: ${value};`)
            }
          }

          output.push("}")
        }

        const css = output.join("\n")
        yield new InlineStyleSheet(css)
      }
    }
  }

  get classes(): string[] {
    return [...this.css_classes(), ...this._classes()]
  }

  public *_classes(): Iterable<string> {
    yield `bk-${this.model.type}`
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), ui_css]
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

  private _bbox?: BBox
  get bbox(): BBox {
    // XXX: this shouldn't be necessary
    if (this._bbox == null)
      this._update_bbox()
    return this._bbox!
  }

  update_bbox(): void {
    this._update_bbox()
  }

  protected _update_bbox(): void {
    const displayed = this.el.offsetParent != null // TODO: position == "sticky"

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
        width: round(self.width),
        height: round(self.height),
      })
    })()

    // TODO: const changed = this._bbox.equals(bbox)
    this._bbox = bbox
    this._is_displayed = displayed
  }

  protected _resize_observer: ResizeObserver

  override initialize(): void {
    super.initialize()

    this._resize_observer = new ResizeObserver((_entries) => this.after_resize())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible, styles} = this.model.properties
    this.on_change(visible, () => this._apply_visible())
    this.on_change(styles, () => this._apply_styles())
  }

  override remove(): void {
    this._resize_observer.disconnect()
    super.remove()
  }

  protected _after_resize(): void {}

  after_resize(): void {
    this.update_bbox()
    this._after_resize()
    this.finish()
  }

  override render_to(element: Node): void {
    super.render_to(element)
    this.after_render()
  }

  override render(): void {
    this.empty()
    this._apply_stylesheets(this.styles())
    this._apply_stylesheets(this.stylesheets)
    this._apply_stylesheets(this.computed_stylesheets)
    this._apply_styles()
    this._apply_classes(this.classes)
    this._apply_classes(this.model.classes)
    this._apply_visible()
  }

  after_render(): void {
    this.update_style()
    this.update_bbox()

    // If not displayed, then after_resize() will not be called.
    if (!this.is_displayed) {
      this.finish()
    }
  }

  private _is_displayed: boolean = false
  protected get is_displayed(): boolean {
    return this._is_displayed
  }

  protected _apply_styles(): void {
    const {styles} = this.model

    const apply = (name: string, value: unknown) => {
      const known = name in this.el.style   // XXX: hasOwnProperty() doesn't work for unknown reasons
      if (known && isString(value)) {
        this.el.style[name as any] = value  // XXX: setProperty() doesn't support camel-case
      }
      return known
    }

    for (const [attr, value] of _iter_styles(styles)) {
      const name = attr.replace(/_/g, "-")

      if (!apply(name, value)) {
        if (!apply(`-webkit-${name}`, value) && !apply(`-moz-${name}`, value))
          logger.trace(`unknown CSS property '${name}'`)
      }
    }
  }

  protected _apply_visible(): void {
    if (this.model.visible)
      this._display.clear()
    else {
      // in case `display` element style was set, use `!important` to work around this
      this._display.replace(":host { display: none !important; }")
    }
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
}

export namespace UIElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    visible: p.Property<boolean>
    classes: p.Property<string[]>
    styles: p.Property<CSSStyles | Styles>
    stylesheets: p.Property<(BaseStyleSheet | string | {[key: string]: CSSStyles | Styles})[]>
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
    this.define<UIElement.Props>(({Boolean, Array, Dict, String, Ref, Or, Nullable}) => {
      const StylesLike = Or(Dict(Nullable(String)), Ref(Styles)) // TODO: add validation for CSSStyles
      return {
        visible: [ Boolean, true ],
        classes: [Array(String), [] ],
        styles: [ StylesLike, {} ],
        stylesheets: [ Array(Or(Ref(BaseStyleSheet), String, Dict(StylesLike))), [] ],
      }
    })
  }
}
