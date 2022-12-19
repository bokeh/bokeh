import {View} from "./view"
import {createElement, remove, empty, InlineStyleSheet, StyleSheetLike, ClassList} from "./dom"
import {isString} from "./util/types"
import base_css from "styles/base.css"

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  override parent: DOMView | null

  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: Node
  shadow_el?: ShadowRoot

  get children_el(): Node {
    return this.shadow_el ?? this.el
  }

  override initialize(): void {
    super.initialize()
    this.el = this._createElement()
  }

  override remove(): void {
    remove(this.el)
    super.remove()
  }

  css_classes(): string[] {
    return []
  }

  styles(): StyleSheetLike[] {
    return []
  }

  abstract render(): void

  render_to(element: Node): void {
    element.appendChild(this.el)
    this.render()
  }

  finish(): void {
    this._has_finished = true
    this.notify_finished()
  }

  protected _createElement(): this["el"] {
    return createElement(this.constructor.tag_name, {class: this.css_classes()})
  }
}

export abstract class DOMElementView extends DOMView {
  override el: HTMLElement

  class_list: ClassList

  override initialize(): void {
    super.initialize()
    this.class_list = new ClassList(this.el.classList)
  }
}

export abstract class DOMComponentView extends DOMElementView {
  override parent: DOMElementView | null
  override readonly root: DOMComponentView

  override shadow_el: ShadowRoot

  override initialize(): void {
    super.initialize()
    this.shadow_el = this.el.attachShadow({mode: "open"})
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), base_css]
  }

  empty(): void {
    empty(this.shadow_el)
    this.class_list.clear()
  }

  render(): void {
    this.empty()
    this._apply_stylesheets(this.styles())
    this._apply_classes(this.css_classes())
  }

  protected _apply_stylesheets(stylesheets: StyleSheetLike[]): void {
    /*
    if (supports_adopted_stylesheets) {
      const sheets: CSSStyleSheet[] = []
      for (const style of this.styles()) {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(style)
        sheets.push(sheet)
      }
      this.shadow_el.adoptedStyleSheets = sheets
    } else {
    */
    for (const style of stylesheets) {
      const stylesheet = isString(style) ? new InlineStyleSheet(style) : style
      stylesheet.install(this.shadow_el)
    }
  }

  protected _apply_classes(classes: string[]): void {
    this.class_list.add(...classes)
  }
}
