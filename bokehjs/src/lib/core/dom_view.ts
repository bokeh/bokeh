import {View} from "./view"
import {StyleSheet, stylesheet} from "./dom"
import * as DOM from "./dom"
import root_css from "styles/root.css"

export namespace DOMView {
  export type Options = View.Options
}

export class DOMView extends View {

  tagName: keyof HTMLElementTagNameMap

  protected _has_finished: boolean

  el: HTMLElement

  /** @override */
  root: DOMView

  initialize(): void {
    super.initialize()
    this._has_finished = false
    if (this.is_root) {
      this._stylesheet = stylesheet
    }
    this._inject_styles()
    this.el = this._createElement()
  }

  remove(): void {
    DOM.removeElement(this.el)
    super.remove()
  }

  css_classes(): string[] {
    return []
  }

  styles(): string[] {
    return [root_css]
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

  get is_idle(): boolean {
    return this.has_finished()
  }

  private _stylesheet: StyleSheet

  get stylesheet(): StyleSheet {
    if (this.is_root)
      return this._stylesheet
    else
      return this.root.stylesheet
  }

  protected _inject_styles(): void {
    const {stylesheet} = this
    for (const style of this.styles()) {
      stylesheet.append(style)
    }
  }

  protected _createElement(): HTMLElement {
    return DOM.createElement(this.tagName, {class: this.css_classes()})
  }
}

DOMView.prototype.tagName = "div"
