import {View} from "./view"
import * as DOM from "./dom"
import {bk_root} from "styles/root"

export namespace DOMView {
  export type Options = View.Options
}

export class DOMView extends View {

  tagName: keyof HTMLElementTagNameMap

  protected _has_finished: boolean

  el: HTMLElement

  initialize(): void {
    super.initialize()
    this._has_finished = false
    this.el = this._createElement()
  }

  remove(): void {
    DOM.removeElement(this.el)
    super.remove()
  }

  css_classes(): string[] {
    return []
  }

  cursor(_sx: number, _sy: number): string | null {
    return null
  }

  render(): void {}

  renderTo(element: HTMLElement): void {
    element.appendChild(this.el)
    this.render()
  }

  on_hit?(sx: number, sy: number): boolean

  has_finished(): boolean {
    return this._has_finished
  }

  protected get _root_element(): HTMLElement {
    return DOM.parent(this.el, `.${bk_root}`) || document.body
  }

  get is_idle(): boolean {
    return this.has_finished()
  }

  protected _createElement(): HTMLElement {
    return DOM.createElement(this.tagName, {class: this.css_classes()})
  }
}

DOMView.prototype.tagName = "div"
