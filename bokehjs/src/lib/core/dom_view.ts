import {View} from "./view"
import {createElement, remove, empty, style} from "./dom"
import base_css from "styles/base.css"

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: Node

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

  render(): void {}

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
  override el: Element

  shadow_el: ShadowRoot
  stylesheet_el: HTMLStyleElement

  override initialize(): void {
    super.initialize()
    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.stylesheet_el = style({}, ...this.styles())
    this.shadow_el.appendChild(this.stylesheet_el)
  }

  override styles(): string[] {
    return [base_css]
  }

  empty(): void {
    empty(this.shadow_el)
    this.shadow_el.appendChild(this.stylesheet_el)
  }
}
