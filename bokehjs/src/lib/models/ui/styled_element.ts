import {Model} from "../../model"
import {Node} from "../coordinates/node"
import {Styles} from "../dom/styles"
import {StyleSheet as BaseStyleSheet} from "../dom/stylesheets"
import {DOMComponentView} from "core/dom_view"
import type {StyleSheet, StyleSheetLike} from "core/dom"
import {apply_styles} from "core/css"
import {InlineStyleSheet} from "core/dom"
import {entries} from "core/util/object"
import {isNumber, isString} from "core/util/types"
import type * as p from "core/properties"
import {List, Or, Ref, Str, Dict, Nullable} from "core/kinds"

export const StylesLike = Or(Dict(Nullable(Str)), Ref(Styles)) // TODO: add validation for CSSStyles
export type StylesLike = typeof StylesLike["__type__"]

export const StyleSheets = List(Or(Ref(BaseStyleSheet), Str, Dict(StylesLike)))
export type StyleSheets = typeof StyleSheets["__type__"]

export const CSSVariables = Dict(Or(Ref(Node), Str))
export type CSSVariables = typeof CSSVariables["__type__"]

export abstract class StyledElementView extends DOMComponentView {
  declare model: StyledElement

  /**
   * Computed styles applied to self.
   */
  readonly style = new InlineStyleSheet("", "style") // TODO rename to `self_style`

  /**
   * Computed styles append by the parent.
   */
  readonly parent_style = new InlineStyleSheet("", "parent", true)

  override computed_stylesheets(): InlineStyleSheet[] {
    return [...super.computed_stylesheets(), this.style, this.parent_style]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {html_attributes, html_id, styles, css_classes, css_variables, stylesheets} = this.model.properties
    this.on_change([html_attributes, html_id, css_classes, styles], () => this._apply_html_attributes())
    this.on_transitive_change(css_variables, () => this._apply_html_attributes())
    this.on_transitive_change(stylesheets, () => this._update_stylesheets())
  }

  protected override *_css_classes(): Iterable<string> {
    yield* super._css_classes()
    yield* this.model.css_classes
  }

  protected override *_css_variables(): Iterable<[string, string]> {
    yield* super._css_variables()
    for (const [key, val] of entries(this.model.css_variables)) {
      if (val instanceof Node) {
        const value = this.resolve_coordinate(val)
        if (isNumber(value)) {
          yield [key, `${value}px`]
        } else if (isString(value)) {
          yield [key, value]
        }
      } else {
        yield [key, val]
      }
    }
  }

  override user_stylesheets(): StyleSheetLike[] {
    return [...super.user_stylesheets(), ...this._user_stylesheets()]
  }

  protected *_user_stylesheets(): Iterable<StyleSheet> {
    for (const stylesheet of this.model.stylesheets) {
      if (stylesheet instanceof BaseStyleSheet) {
        yield stylesheet.underlying()
      } else {
        yield new InlineStyleSheet(stylesheet)
      }
    }
  }

  protected override _apply_html_attributes(): void {
    for (const key of this._applied_html_attributes) {
      this.el.removeAttribute(key)
    }
    this._applied_html_attributes = []

    this._update_css_classes()

    for (const [key, val] of entries(this.model.html_attributes)) {
      if (key == "class") {
        const classes = val.split(/ +/)
        this._applied_css_classes.push(...classes)
        this.class_list.add(...classes)
      } else {
        this.el.setAttribute(key, val)
        this._applied_html_attributes.push(key)
      }
    }

    const id = this.model.html_id
    if (id != null) {
      this.el.setAttribute("id", id)
      this._applied_html_attributes.push("id")
    }

    this._apply_styles()
    this._update_css_variables()
  }

  protected _apply_styles(): void {
    apply_styles(this.el.style, this.model.styles)
  }
}

export namespace StyledElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    html_attributes: p.Property<Dict<string>>
    html_id: p.Property<string | null>
    css_classes: p.Property<string[]>
    css_variables: p.Property<CSSVariables>
    styles: p.Property<StylesLike>
    stylesheets: p.Property<StyleSheets>
  }
}

export interface StyledElement extends StyledElement.Attrs {}

export abstract class StyledElement extends Model {
  declare properties: StyledElement.Props
  declare __view_type__: StyledElementView

  constructor(attrs?: Partial<StyledElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StyledElement.Props>({
      html_attributes: [ Dict(Str), {} ],
      html_id: [ Nullable(Str), null ],
      css_classes: [ List(Str), [] ],
      css_variables: [ CSSVariables, {} ],
      styles: [ StylesLike, {} ],
      stylesheets: [ StyleSheets, [] ],
    })
  }
}
