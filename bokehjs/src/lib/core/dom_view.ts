import {View} from "./view"
import {createElement, remove, style} from "./dom"

import root_css from "styles/root.css"

export class DOMView extends View {
  tagName: keyof HTMLElementTagNameMap

  el: HTMLElement
  shadow_el: ShadowRoot
  stylesheet_el: HTMLStyleElement

  /** @override */
  readonly root: DOMView

  initialize(): void {
    super.initialize()
    this.el = this._createElement()
    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.stylesheet_el = style({}, ...this.styles())
    this.shadow_el.appendChild(this.stylesheet_el)
  }

  remove(): void {
    remove(this.el)
    super.remove()
  }

  styles(): string[] {
    return [root_css]
  }

  css_classes(): string[] {
    return []
  }

  render(): void {}

  renderTo(element: HTMLElement): void {
    element.appendChild(this.el)
    this.render()
  }

  protected _createElement(): HTMLElement {
    return createElement(this.tagName, {class: this.css_classes()})
  }
}

DOMView.prototype.tagName = "div"
