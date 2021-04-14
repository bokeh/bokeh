import {Model} from "../../model"
import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Style} from "./style"
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

export {Style}

export abstract class DOMNodeView extends DOMView {
  model: DOMNode
}

export namespace DOMNode {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DOMNode extends DOMNode.Attrs {}

export abstract class DOMNode extends Model {
  properties: DOMNode.Props
  __view_type__: DOMNodeView
  static __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<DOMNode.Attrs>) {
    super(attrs)
  }

  static init_DOMNode(): void {}
}

export class TextView extends DOMNodeView {
  model: Text
  el: globalThis.Text

  render(): void {
    super.render()
    this.el.textContent = this.model.content
  }

  protected _createElement(): globalThis.Text {
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
  properties: Text.Props
  __view_type__: TextView

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
  model: Placeholder
  static tag_name = "span" as const

  abstract update(source: ColumnarDataSource, i: DataIndex, vars: object/*, formatters?: Formatters*/): void
}

export namespace Placeholder {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {}
}

export interface Placeholder extends Placeholder.Attrs {}

export abstract class Placeholder extends DOMNode {
  properties: Placeholder.Props
  __view_type__: PlaceholderView

  constructor(attrs?: Partial<Placeholder.Attrs>) {
    super(attrs)
  }

  static init_Placeholder(): void {
    this.define<Placeholder.Props>(({}) => ({}))
  }
}

export class IndexView extends PlaceholderView {
  model: Index

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
  properties: Index.Props
  __view_type__: IndexView

  constructor(attrs?: Partial<Index.Attrs>) {
    super(attrs)
  }

  static init_Index(): void {
    this.prototype.default_view = IndexView
    this.define<Index.Props>(({}) => ({}))
  }
}

export class ValueRefView extends PlaceholderView {
  model: ValueRef

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
  properties: ValueRef.Props
  __view_type__: ValueRefView

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
  model: ColorRef

  value_el?: HTMLElement
  swatch_el?: HTMLElement

  render(): void {
    super.render()

    this.value_el = span()
    this.swatch_el = span({class: styles.tooltip_color_block}, " ")

    this.el.appendChild(this.value_el)
    this.el.appendChild(this.swatch_el)
  }

  update(source: ColumnarDataSource, i: DataIndex, _vars: object/*, formatters?: Formatters*/): void {
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
  properties: ColorRef.Props
  __view_type__: ColorRefView

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

export abstract class HTMLView extends DOMNodeView {
  model: HTML
  el: HTMLElement

  child_views: Map<DOMNode | LayoutDOM, DOMNodeView | LayoutDOMView> = new Map()

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const children = this.model.children.filter((obj): obj is DOMNode | LayoutDOM => obj instanceof Model)
    await build_views(this.child_views, children, {parent: null})
  }

  render(): void {
    super.render()

    const {style} = this.model
    if (style != null) {
      /*
      type IsString<T> = T extends string ? T : never
      type Key = Exclude<IsString<keyof CSSStyleDeclaration>,
        "length" | "parentRule" | "getPropertyPriority" | "getPropertyValue" | "item" | "removeProperty" | "setProperty">
      //this.el.style[key as Key] = value
      */

      if (style instanceof Style) {
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

export namespace HTML {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    style: p.Property<Style | {[key: string]: string} | null>
    children: p.Property<(string | DOMNode | LayoutDOM)[]>
  }
}

export interface HTML extends HTML.Attrs {}

export abstract class HTML extends DOMNode {
  properties: HTML.Props
  __view_type__: HTMLView

  constructor(attrs?: Partial<HTML.Attrs>) {
    super(attrs)
  }

  static init_HTML(): void {
    this.define<HTML.Props>(({String, Array, Dict, Or, Nullable, Ref}) => ({
      style: [ Nullable(Or(Ref(Style), Dict(String))), null ],
      children: [ Array(Or(String, Ref(DOMNode), Ref(LayoutDOM))), [] ],
    }))
  }
}

export abstract class ActionView extends View {
  model: Action

  abstract update(source: ColumnarDataSource, i: DataIndex, vars: object/*, formatters?: Formatters*/): void
}

export namespace Action {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {}
}

export interface Action extends Action.Attrs {}

export abstract class Action extends Model {
  properties: Action.Props
  __view_type__: ActionView
  static __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<Action.Attrs>) {
    super(attrs)
  }

  static init_Action(): void {
    this.define<Action.Props>(({}) => ({}))
  }
}

export class TemplateView extends HTMLView {
  model: Template
  static tag_name = "div" as const

  action_views: Map<Action, ActionView> = new Map()

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this.action_views, this.model.actions, {parent: this})
  }

  remove(): void {
    remove_views(this.action_views)
    super.remove()
  }

  update(source: ColumnarDataSource, i: DataIndex, vars: object = {}/*, formatters?: Formatters*/): void {
    function descend(obj: HTMLView): void {
      for (const child of obj.child_views.values()) {
        if (child instanceof PlaceholderView) {
          child.update(source, i, vars)
        } else if (child instanceof HTMLView) {
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
  export type Props = HTML.Props & {
    actions: p.Property<Action[]>
  }
}

export interface Template extends Template.Attrs {}

export class Template extends HTML {
  properties: Template.Props
  __view_type__: TemplateView

  static init_Template(): void {
    this.prototype.default_view = TemplateView
    this.define<Template.Props>(({Array, Ref}) => ({
      actions: [ Array(Ref(Action)), [] ],
    }))
  }
}

export class SpanView extends HTMLView {
  model: Span
  static tag_name = "span" as const
}
export class Span extends HTML {
  __view_type__: SpanView
  static init_Span(): void {
    this.prototype.default_view = SpanView
  }
}

export class DivView extends HTMLView {
  model: Div
  static tag_name = "div" as const
}
export class Div extends HTML {
  __view_type__: DivView
  static init_Div(): void {
    this.prototype.default_view = DivView
  }
}

export class TableView extends HTMLView {
  model: Table
  static tag_name = "table" as const
}
export class Table extends HTML {
  __view_type__: TableView
  static init_Table(): void {
    this.prototype.default_view = TableView
  }
}

export class TableRowView extends HTMLView {
  model: TableRow
  static tag_name = "tr" as const
}
export class TableRow extends HTML {
  __view_type__: TableRowView
  static init_TableRow(): void {
    this.prototype.default_view = TableRowView
  }
}

export class VBoxView extends HTMLView {
  model: VBox

  protected _createElement() {
    const el = super._createElement()
    el.style.display = "flex"
    el.style.flexDirection = "column"
    return el
  }
}
export class VBox extends HTML {
  __view_type__: VBoxView
  static init_VBox(): void {
    this.prototype.default_view = VBoxView
  }
}

export class HBoxView extends HTMLView {
  model: HBox

  protected _createElement() {
    const el = super._createElement()
    el.style.display = "flex"
    el.style.flexDirection = "row"
    return el
  }
}
export class HBox extends HTML {
  __view_type__: HBoxView
  static init_HBox(): void {
    this.prototype.default_view = HBoxView
  }
}

/////

import {RendererGroup} from "../renderers/renderer"
import {enumerate} from "core/util/iterator"

export class ToggleGroupView extends ActionView {
  model: ToggleGroup

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
  properties: ToggleGroup.Props
  __view_type__: ToggleGroupView

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
  properties: X.Props

  constructor(attrs?: Partial<X.Attrs>) {
    super(attrs)
  }

  static init_X(): void {
    this.define<X.Props>(({}) => ({
    }))
  }
}
*/
