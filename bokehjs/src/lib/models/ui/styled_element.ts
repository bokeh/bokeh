import {Model} from "../../model"
import {Node} from "../coordinates/node"
import {Styles} from "../dom/styles"
import {StyleSheet as BaseStyleSheet} from "../dom/stylesheets"
import {DOMComponentView} from "core/dom_view"
import type {StyleSheet, StyleSheetLike} from "core/dom"
import {apply_styles} from "core/css"
import {InlineStyleSheet} from "core/dom"
import {entries} from "core/util/object"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"
import {List, Or, Ref, Str, Dict, Nullable} from "core/kinds"

export const StylesLike = Or(Dict(Nullable(Str)), Ref(Styles)) // TODO: add validation for CSSStyles
export type StylesLike = typeof StylesLike["__type__"]

export const StyleSheets = List(Or(Ref(BaseStyleSheet), Str, Dict(StylesLike)))
export type StyleSheets = typeof StyleSheets["__type__"]

export const CSSVariables = Dict(Ref(Node))
export type CSSVariables = typeof CSSVariables["__type__"]

export abstract class StyledElementView extends DOMComponentView {
  declare model: StyledElement

  readonly style = new InlineStyleSheet()

  override computed_stylesheets(): InlineStyleSheet[] {
    return [...super.computed_stylesheets(), this.style]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {styles, css_classes, css_variables, stylesheets} = this.model.properties
    this.on_change(styles, () => this._update_styles())
    this.on_change(css_classes, () => this._update_css_classes())
    this.on_transitive_change(css_variables, () => this._update_css_variables())
    this.on_change(stylesheets, () => this._update_stylesheets())
  }

  override render(): void {
    super.render()
    this._apply_styles()
  }

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

  protected _apply_styles(): void {
    apply_styles(this.el.style, this.model.styles)
  }

  protected _update_styles(): void {
    this.el.removeAttribute("style") // TODO: maintain _applied_styles
    this._apply_styles()
  }
}

export namespace StyledElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
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
    this.define<StyledElement.Props>(({List, Str}) => ({
      css_classes: [ List(Str), [] ],
      css_variables: [ CSSVariables, {} ],
      styles: [ StylesLike, {} ],
      stylesheets: [ StyleSheets, [] ],
    }))
  }
}
