import {View} from "./view"
import {createElement, remove, empty, style} from "./dom"
import base_css from "styles/base.css"

const has_adopted_stylesheets = "adoptedStyleSheets" in ShadowRoot.prototype

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: Node
  shadow_el?: ShadowRoot

  get children_el(): Node {
    return this.shadow_el ?? this.el
  }

  override readonly root: DOMView

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

  styles(): string[] {
    return []
  }

  abstract render(): void

  renderTo(element: Node): void {
    element.appendChild(this.el)
    this.render()
    this._has_finished = true
    this.notify_finished()
  }

  protected _createElement(): this["el"] {
    return createElement(this.constructor.tag_name, {class: this.css_classes()})
  }
}

export abstract class DOMComponentView extends DOMView {
  override el: HTMLElement

  override shadow_el: ShadowRoot
  stylesheet_els: HTMLStyleElement[] = []

  override initialize(): void {
    super.initialize()
    this.shadow_el = this.el.attachShadow({mode: "open"})

    if (has_adopted_stylesheets) {
      const sheets: CSSStyleSheet[] = []
      for (const style of this.styles()) {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(style)
        sheets.push(sheet)
      }
      this.shadow_el.adoptedStyleSheets = sheets
    } else {
      for (const style_ of this.styles()) {
        const stylesheet_el = style({}, style_)
        this.stylesheet_els.push(stylesheet_el)
        this.shadow_el.appendChild(stylesheet_el)
      }
    }
  }

  override styles(): string[] {
    return [...super.styles(), base_css]
  }

  empty(): void {
    empty(this.shadow_el)
    for (const stylesheet_el of this.stylesheet_els) {
      this.shadow_el.appendChild(stylesheet_el)
    }
  }
}
