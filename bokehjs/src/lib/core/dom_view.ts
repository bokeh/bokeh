import {View} from "./view"
import {createElement, remove} from "./dom"

export class DOMView extends View {

  tagName: keyof HTMLElementTagNameMap

  el: HTMLElement

  /** @override */
  root: DOMView

  initialize(): void {
    super.initialize()
    this.el = this._createElement()
  }

  remove(): void {
    remove(this.el)
    super.remove()
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
