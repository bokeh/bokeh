import {Model} from "../../model"
import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Styles} from "./styles"
import {span} from "core/dom"
import {View} from "core/view"
import {DOMView} from "core/dom_view"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"
import {isString} from "core/util/types"
import {entries} from "core/util/object"
import * as styles from "styles/tooltips.css"

import {Index as DataIndex, _get_column_value} from "core/util/templating"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export {Styles}

export abstract class DOMNodeView extends DOMView {
  override model: DOMNode
}

export namespace DOMNode {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DOMNode extends DOMNode.Attrs {}

export abstract class DOMNode extends Model {
  override properties: DOMNode.Props
  override __view_type__: DOMNodeView
  static override __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<DOMNode.Attrs>) {
    super(attrs)
  }

  static init_DOMNode(): void {}
}

export class TextView extends DOMNodeView {
  override model: Text
  override el: globalThis.Text

  override render(): void {
    super.render()
    this.el.textContent = this.model.content
  }

  protected override _createElement(): globalThis.Text {
    return document.createTextNode("")
  }
}

export namespace Text {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    content: p.Property<string>
  }
}

export interface Text extends Text.Attrs {}

export class Text extends DOMNode {
  override properties: Text.Props
  override __view_type__: TextView

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static init_Text(): void {
    this.prototype.default_view = TextView
    this.define<Text.Props>(({String}) => ({
      content: [ String, "" ],
    }))
  }
}

export abstract class PlaceholderView extends DOMNodeView {
  override model: Placeholder
  static override tag_name = "span" as const

  abstract update(source: ColumnarDataSource, i: DataIndex, vars: object/*, formatters?: Formatters*/): void
}

export namespace Placeholder {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {}
}

export interface Placeholder extends Placeholder.Attrs {}

export abstract class Placeholder extends DOMNode {
  override properties: Placeholder.Props
  override __view_type__: PlaceholderView

  constructor(attrs?: Partial<Placeholder.Attrs>) {
    super(attrs)
  }

  static init_Placeholder(): void {
    this.define<Placeholder.Props>(({}) => ({}))
  }
}

export class IndexView extends PlaceholderView {
  override model: Index

  update(_source: ColumnarDataSource, i: DataIndex, _vars: object/*, formatters?: Formatters*/): void {
    this.el.textContent = i.toString()
  }
}

export namespace Index {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props & {}
}

export interface Index extends Index.Attrs {}

export class Index extends Placeholder {
  override properties: Index.Props
  override __view_type__: IndexView

  constructor(attrs?: Partial<Index.Attrs>) {
    super(attrs)
  }

  static init_Index(): void {
    this.prototype.default_view = IndexView
    this.define<Index.Props>(({}) => ({}))
  }
}

export class ValueRefView extends PlaceholderView {
  override model: ValueRef

  update(source: ColumnarDataSource, i: DataIndex, _vars: object/*, formatters?: Formatters*/): void {
    const value = _get_column_value(this.model.field, source, i)
    const text = value == null ? "???" : `${value}` //.toString()
    this.el.textContent = text
  }
}

export namespace ValueRef {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props & {
    field: p.Property<string>
  }
}

export interface ValueRef extends ValueRef.Attrs {}

export class ValueRef extends Placeholder {
  override properties: ValueRef.Props
  override __view_type__: ValueRefView

  constructor(attrs?: Partial<ValueRef.Attrs>) {
    super(attrs)
  }

  static init_ValueRef(): void {
    this.prototype.default_view = ValueRefView
    this.define<ValueRef.Props>(({String}) => ({
      field: [ String ],
    }))
  }
}

export class ColorRefView extends ValueRefView {
  override model: ColorRef

  value_el?: HTMLElement
  swatch_el?: HTMLElement

  override render(): void {
    super.render()

    this.value_el = span()
    this.swatch_el = span({class: styles.tooltip_color_block}, " ")

    this.el.appendChild(this.value_el)
    this.el.appendChild(this.swatch_el)
  }

  override update(source: ColumnarDataSource, i: DataIndex, _vars: object/*, formatters?: Formatters*/): void {
    const value = _get_column_value(this.model.field, source, i)
    const text = value == null ? "???" : `${value}` //.toString()
    this.el.textContent = text
  }
}

export namespace ColorRef {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ValueRef.Props & {
    hex: p.Property<boolean>
    swatch: p.Property<boolean>
  }
}

export interface ColorRef extends ColorRef.Attrs {}

export class ColorRef extends ValueRef {
  override properties: ColorRef.Props
  override __view_type__: ColorRefView

  constructor(attrs?: Partial<ColorRef.Attrs>) {
    super(attrs)
  }

  static init_ColorRef(): void {
    this.prototype.default_view = ColorRefView
    this.define<ColorRef.Props>(({Boolean}) => ({
      hex: [ Boolean, true ],
      swatch: [ Boolean, true ],
    }))
  }
}

export abstract class DOMElementView extends DOMNodeView {
  override model: DOMElement
  override el: HTMLElement

  child_views: Map<DOMNode | LayoutDOM, DOMNodeView | LayoutDOMView> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const children = this.model.children.filter((obj): obj is DOMNode | LayoutDOM => obj instanceof Model)
    await build_views(this.child_views, children, {parent: this})
  }

  override render(): void {
    super.render()

    const {style} = this.model
    if (style != null) {
      /*
      type IsString<T> = T extends string ? T : never
      type Key = Exclude<IsString<keyof CSSStyleDeclaration>,
        "length" | "parentRule" | "getPropertyPriority" | "getPropertyValue" | "item" | "removeProperty" | "setProperty">
      //this.el.style[key as Key] = value
      */

      if (style instanceof Styles) {
        for (const prop of style) {
          const value = prop.get_value()
          if (isString(value)) {
            const name = prop.attr.replace(/_/g, "-")
            if (this.el.style.hasOwnProperty(name)) {
              this.el.style.setProperty(name, value as string)
            }
          }
        }
      } else {
        for (const [key, value] of entries(style)) {
          const name = key.replace(/_/g, "-")
          if (this.el.style.hasOwnProperty(name)) {
            this.el.style.setProperty(name, value)
          }
        }
      }
    }

    for (const child of this.model.children) {
      if (isString(child)) {
        const node = document.createTextNode(child)
        this.el.appendChild(node)
      } else {
        const child_view = this.child_views.get(child)!
        child_view.renderTo(this.el)
      }
    }
  }
}

export namespace DOMElement {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    style: p.Property<Styles | {[key: string]: string} | null>
    children: p.Property<(string | DOMNode | LayoutDOM)[]>
  }
}

export interface DOMElement extends DOMElement.Attrs {}

export abstract class DOMElement extends DOMNode {
  override properties: DOMElement.Props
  override __view_type__: DOMElementView

  constructor(attrs?: Partial<DOMElement.Attrs>) {
    super(attrs)
  }

  static init_DOMElement(): void {
    this.define<DOMElement.Props>(({String, Array, Dict, Or, Nullable, Ref}) => ({
      style: [ Nullable(Or(Ref(Styles), Dict(String))), null ],
      children: [ Array(Or(String, Ref(DOMNode), Ref(LayoutDOM))), [] ],
    }))
  }
}

export abstract class ActionView extends View {
  override model: Action

  abstract update(source: ColumnarDataSource, i: DataIndex, vars: object/*, formatters?: Formatters*/): void
}

export namespace Action {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {}
}

export interface Action extends Action.Attrs {}

export abstract class Action extends Model {
  override properties: Action.Props
  override __view_type__: ActionView
  static override __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<Action.Attrs>) {
    super(attrs)
  }

  static init_Action(): void {
    this.define<Action.Props>(({}) => ({}))
  }
}

export class TemplateView extends DOMElementView {
  override model: Template
  static override tag_name = "div" as const

  action_views: Map<Action, ActionView> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this.action_views, this.model.actions, {parent: this})
  }

  override remove(): void {
    remove_views(this.action_views)
    super.remove()
  }

  update(source: ColumnarDataSource, i: DataIndex, vars: object = {}/*, formatters?: Formatters*/): void {
    function descend(obj: DOMElementView): void {
      for (const child of obj.child_views.values()) {
        if (child instanceof PlaceholderView) {
          child.update(source, i, vars)
        } else if (child instanceof DOMElementView) {
          descend(child)
        }
      }
    }

    descend(this)

    for (const action of this.action_views.values()) {
      action.update(source, i, vars)
    }
  }
}

export namespace Template {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props & {
    actions: p.Property<Action[]>
  }
}

export interface Template extends Template.Attrs {}

export class Template extends DOMElement {
  override properties: Template.Props
  override __view_type__: TemplateView

  static init_Template(): void {
    this.prototype.default_view = TemplateView
    this.define<Template.Props>(({Array, Ref}) => ({
      actions: [ Array(Ref(Action)), [] ],
    }))
  }
}

export class SpanView extends DOMElementView {
  override model: Span
  static override tag_name = "span" as const
}
export class Span extends DOMElement {
  override __view_type__: SpanView
  static init_Span(): void {
    this.prototype.default_view = SpanView
  }
}

export class DivView extends DOMElementView {
  override model: Div
  static override tag_name = "div" as const
}
export class Div extends DOMElement {
  override __view_type__: DivView
  static init_Div(): void {
    this.prototype.default_view = DivView
  }
}

export class TableView extends DOMElementView {
  override model: Table
  static override tag_name = "table" as const
}
export class Table extends DOMElement {
  override __view_type__: TableView
  static init_Table(): void {
    this.prototype.default_view = TableView
  }
}

export class TableRowView extends DOMElementView {
  override model: TableRow
  static override tag_name = "tr" as const
}
export class TableRow extends DOMElement {
  override __view_type__: TableRowView
  static init_TableRow(): void {
    this.prototype.default_view = TableRowView
  }
}

/////

import {RendererGroup} from "../renderers/renderer"
import {enumerate} from "core/util/iterator"

export class ToggleGroupView extends ActionView {
  override model: ToggleGroup

  update(_source: ColumnarDataSource, i: DataIndex, _vars: object/*, formatters?: Formatters*/): void {
    for (const [group, j] of enumerate(this.model.groups)) {
      group.visible = i == j
    }
  }
}

export namespace ToggleGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Action.Props & {
    groups: p.Property<RendererGroup[]>
  }
}

export interface ToggleGroup extends ToggleGroup.Attrs {}

export class ToggleGroup extends Action {
  override properties: ToggleGroup.Props
  override __view_type__: ToggleGroupView

  constructor(attrs?: Partial<ToggleGroup.Attrs>) {
    super(attrs)
  }

  static init_ToggleGroup(): void {
    this.prototype.default_view = ToggleGroupView
    this.define<ToggleGroup.Props>(({Array, Ref}) => ({
      groups: [ Array(Ref(RendererGroup)), [] ],
    }))
  }
}


/*
export namespace X {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Y.Props & {}
}

export interface X extends X.Attrs {}

export class X extends Y {
  override properties: X.Props

  constructor(attrs?: Partial<X.Attrs>) {
    super(attrs)
  }

  static init_X(): void {
    this.define<X.Props>(({}) => ({
    }))
  }
}
*/
