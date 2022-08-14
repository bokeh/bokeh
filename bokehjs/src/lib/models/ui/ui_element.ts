import {Model} from "../../model"
import {Styles} from "../dom/styles"
import {logger} from "core/logging"
import {DOMComponentView} from "core/dom_view"
import {SerializableState} from "core/view"
import {CSSStyles, StyleSheet, StyleSheetLike} from "core/dom"
import {CanvasLayer} from "core/util/canvas"
import {keys, entries} from "core/util/object"
import {BBox} from "core/util/bbox"
import {isString, isPlainObject} from "core/util/types"
import * as p from "core/properties"
import ui_css from "styles/ui_element.css"

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
  override model: UIElement

  protected readonly _display = new StyleSheet()

  override styles(): StyleSheetLike[] {
    return [...super.styles(), ui_css, this._display]
  }

  override css_classes(): string[] {
    return [...super.css_classes(), `bk-${this.model.type}`]
  }

  private _bbox?: BBox
  get bbox(): BBox {
    // XXX: this shouldn't be necessary
    if (this._bbox == null)
      this._update_bbox()
    return this._bbox!
  }

  protected _update_bbox(): void {
    const bbox = (() => {
      if (this.el.offsetParent != null) {
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
      } else
        return new BBox()
    })()

    // TODO: const changed = this._bbox.equals(bbox)
    this._bbox = bbox
  }

  protected _resize_observer: ResizeObserver

  override initialize(): void {
    super.initialize()

    this._resize_observer = new ResizeObserver((_entries) => this.after_resize())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override connect_signals(): void {
    super.connect_signals()

    const {visible} = this.model.properties
    this.on_change(visible, () => this._apply_visible())
  }

  override remove(): void {
    this._resize_observer.disconnect()
    super.remove()
  }

  after_resize(): void {
    this._update_bbox()
    this.finish()
  }

  override render(): void {
    super.render()
    this._apply_stylesheets(this.model.stylesheets)
    this._apply_styles()
    this._apply_classes(this.model.classes)
    this._apply_visible()
  }

  after_render(): void {
    if (!this.model.visible) {
      this.finish()
    }
  }

  protected _apply_styles(): void {
    const {styles} = this.model

    const apply = (name: string, value: unknown) => {
      const known = this.el.style.hasOwnProperty(name)
      if (known && isString(value)) {
        this.el.style.setProperty(name, value)
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

  protected override _apply_stylesheets(stylesheets: (StyleSheetLike | {[key: string]: CSSStyles | Styles})[]): void {
    super._apply_stylesheets(stylesheets.map((stylesheet) => {
      if (isPlainObject(stylesheet)) {
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

        return output.join("\n")
      } else
        return stylesheet
    }))
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
    return {
      ...super.serializable_state(),
      bbox: this.bbox.box,
    }
  }
}

export namespace UIElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    visible: p.Property<boolean>
    classes: p.Property<string[]>
    styles: p.Property<CSSStyles | Styles>
    stylesheets: p.Property<(string | {[key: string]: CSSStyles | Styles})[]>
  }
}

export interface UIElement extends UIElement.Attrs {}

export abstract class UIElement extends Model {
  override properties: UIElement.Props
  override __view_type__: UIElementView

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
        stylesheets: [ Array(Or(String, Dict(StylesLike))), [] ],
      }
    })
  }
}
