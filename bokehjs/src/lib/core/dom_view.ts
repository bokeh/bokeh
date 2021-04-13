import {View} from "./view"
import {createElement, remove} from "./dom"

export interface DOMView extends View {
  constructor: Function & {tag_name: keyof HTMLElementTagNameMap}
}

export abstract class DOMView extends View {
  static tag_name: keyof HTMLElementTagNameMap = "div"

  el: Node

  /** @override */
  readonly root: DOMView

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

  renderTo(element: Node): void {
    element.appendChild(this.el)
    this.render()
  }

  protected _createElement(): this["el"] {
    return createElement(this.constructor.tag_name, {class: this.css_classes()})
  }
}
