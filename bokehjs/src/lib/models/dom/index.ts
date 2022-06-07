import {Model} from "../../model"
import {UIElement, UIElementView} from "../ui/ui_element"
import {Styles} from "./styles"
import {HasProps} from "core/has_props"
import {span, empty} from "core/dom"
import {View} from "core/view"
import {DOMView} from "core/dom_view"
import {build_views, remove_views, ViewStorage} from "core/build_views"
import * as p from "core/properties"
import {enumerate} from "core/util/iterator"
import {entries} from "core/util/object"
import {Index as DataIndex, _get_column_value} from "core/util/templating"
import {isString} from "core/util/types"
import {RendererGroup} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {to_string} from "core/util/pretty"
import {assert} from "core/util/assert"
import * as styles from "styles/tooltips.css"

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
}

export class TextView extends DOMNodeView {
  override model: Text
  override el: globalThis.Text

  override render(): void {
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

  static {
    this.prototype.default_view = TextView
    this.define<Text.Props>(({String}) => ({
      content: [ String, "" ],
    }))
  }
}

export abstract class PlaceholderView extends DOMNodeView {
  override model: Placeholder
  static override tag_name = "span" as const

  override render(): void {
    // XXX: no implementation?
  }

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: object/*, formatters?: Formatters*/): void
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

  static {
    this.define<Placeholder.Props>(({}) => ({}))
  }
}

export class IndexView extends PlaceholderView {
  override model: Index

  update(_source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
    this.el.textContent = i == null ? "(null)" : i.toString()
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

  static {
    this.prototype.default_view = IndexView
    this.define<Index.Props>(({}) => ({}))
  }
}

export class ValueRefView extends PlaceholderView {
  override model: ValueRef

  update(source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
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

  static {
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

  override update(source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
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

  static {
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

  child_views: Map<DOMNode | UIElement, DOMNodeView | UIElementView> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const children = this.model.children.filter((obj): obj is DOMNode | UIElement => obj instanceof Model)
    await build_views(this.child_views, children, {parent: this})
  }

  override render(): void {
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
              this.el.style.setProperty(name, value)
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
    children: p.Property<(string | DOMNode | UIElement)[]>
  }
}

export interface DOMElement extends DOMElement.Attrs {}

export abstract class DOMElement extends DOMNode {
  override properties: DOMElement.Props
  override __view_type__: DOMElementView

  constructor(attrs?: Partial<DOMElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DOMElement.Props>(({String, Array, Dict, Or, Nullable, Ref}) => ({
      style: [ Nullable(Or(Ref(Styles), Dict(String))), null ],
      children: [ Array(Or(String, Ref(DOMNode), Ref(UIElement))), [] ],
    }))
  }
}

export abstract class ActionView extends View {
  override model: Action

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: object/*, formatters?: Formatters*/): void
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

  static {
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

  update(source: ColumnarDataSource, i: DataIndex | null, vars: object = {}/*, formatters?: Formatters*/): void {
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

  static {
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
  static {
    this.prototype.default_view = SpanView
  }
}

export class DivView extends DOMElementView {
  override model: Div
  static override tag_name = "div" as const
}
export class Div extends DOMElement {
  override __view_type__: DivView
  static {
    this.prototype.default_view = DivView
  }
}

export class TableView extends DOMElementView {
  override model: Table
  static override tag_name = "table" as const
}
export class Table extends DOMElement {
  override __view_type__: TableView
  static {
    this.prototype.default_view = TableView
  }
}

export class TableRowView extends DOMElementView {
  override model: TableRow
  static override tag_name = "tr" as const
}
export class TableRow extends DOMElement {
  override __view_type__: TableRowView
  static {
    this.prototype.default_view = TableRowView
  }
}


export class ToggleGroupView extends ActionView {
  override model: ToggleGroup

  update(_source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
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

  static {
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

  static {
    this.define<X.Props>(({}) => ({
    }))
  }
}
*/

export class HTMLView extends DOMNodeView {
  override model: HTML
  override el: HTMLElement

  protected _refs: ViewStorage<DOMNode | UIElement> = new Map()

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._refs, this.model.refs)
  }

  render(): void {
    empty(this.el)
    this.el.style.display = "contents"

    const parser = new DOMParser()

    const nodes = (() => {
      const {html} = this.model
      if (isString(html)) {
        const document = parser.parseFromString(html, "text/html")

        const iter = document.createNodeIterator(document, NodeFilter.SHOW_ELEMENT, (node) => {
          return node.nodeName.toLowerCase() == "ref" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        })

        let node: Node | null
        while (node = iter.nextNode()) {
          assert(node instanceof Element)

          const id = node.getAttribute("id")
          if (id != null) {
            for (const [model, view] of this._refs) {
              if (model.id == id) {
                view.render()
                node.replaceWith(view.el)
                break
              }
            }
          }
        }

        return [...document.body.childNodes]
      } else {
        return [] // TODO
      }
    })()

    for (const node of nodes) {
      this.el.appendChild(node)
    }
  }
}

export namespace HTML {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DOMNode.Props & {
    html: p.Property<string | (string | DOMNode | UIElement)[]>
    refs: p.Property<(DOMNode | UIElement)[]>
  }
}

export interface HTML extends HTML.Attrs {}

export class HTML extends DOMNode {
  override properties: HTML.Props
  override __view_type__: HTMLView

  constructor(attrs?: Partial<HTML.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLView

    this.define<HTML.Props>(({String, Array, Or, Ref}) => ({
      html: [ Or(String, Array(Or(String, Ref(DOMNode), Ref(UIElement)))) ],
      refs: [ Array(Or(Ref(DOMNode), Ref(UIElement))), [] ],
    }))
  }
}

export class ValueOfView extends DOMNodeView {
  override model: ValueOf
  override el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()

    const {obj, attr} = this.model
    if (attr in obj.properties) {
      this.on_change(obj.properties[attr], () => this.render())
    }
  }

  render(): void {
    empty(this.el)
    this.el.style.display = "contents"

    const text = (() => {
      const {obj, attr} = this.model
      if (attr in obj.properties) {
        const value = obj.properties[attr].get_value()
        return to_string(value)
      } else
        return `<not found: ${obj.type}.${attr}>`
    })()

    this.el.textContent = text
  }
}

export namespace ValueOf {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    obj: p.Property<HasProps>
    attr: p.Property<string>
  }
}

export interface ValueOf extends ValueOf.Attrs {}

export class ValueOf extends DOMNode {
  override properties: ValueOf.Props
  override __view_type__: ValueOfView

  constructor(attrs?: Partial<ValueOf.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ValueOfView

    this.define<ValueOf.Props>(({AnyRef, String}) => ({
      obj: [ AnyRef() ],
      attr: [ String ],
    }))
  }
}
