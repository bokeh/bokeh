import {View, ViewOptions} from "./view"
import {Solver} from "./layout/solver"
import * as DOM from "./dom"

export class DOMView extends View {

  tagName: string
  className: string | null

  protected _has_finished: boolean

  protected _solver: Solver

  el: HTMLElement

  initialize(options: ViewOptions) {
    super.initialize(options)
    this._has_finished = false
    this.el = this._createElement()
  }

  remove(): void {
    DOM.removeElement(this.el)
    super.remove()
  }

  layout(): void {}

  render(): void {}

  renderTo(element: HTMLElement, replace: boolean = false): void {
    if (!replace)
      element.appendChild(this.el)
    else
      DOM.replaceWith(element, this.el)

    this.layout()
  }

  has_finished(): boolean {
    return this._has_finished
  }

  protected get _root_element(): HTMLElement | null {
    return DOM.parent(this.el, ".bk-root")
  }

  get solver(): Solver {
    return this.is_root ? this._solver : (this.parent as DOMView).solver
  }

  get is_idle(): boolean {
    return this.has_finished()
  }

  protected _createElement(): HTMLElement {
    return DOM.createElement(this.tagName, {id: this.id, class: this.className})
  }
}

DOMView.prototype.tagName = "div"
DOMView.prototype.className = null
