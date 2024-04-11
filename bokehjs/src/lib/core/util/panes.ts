import type {StyleSheetLike, Keys} from "../dom"
import {div, empty, InlineStyleSheet, ClassList} from "../dom"
import type {Orientation} from "../enums"
import {isString} from "./types"

import panes_css/*, * as panes*/ from "styles/panes.css"
import base_css from "styles/base.css"

export type Options = {
  target: HTMLElement
  prevent_hide?: HTMLElement | ((event: UIEvent) => boolean)
  extra_stylesheets?: StyleSheetLike[]
}

//import {DOMComponentView} from "../dom_view"

export class DropPane { //extends DOMComponentView {
  readonly el: HTMLElement = div()
  readonly shadow_el: ShadowRoot

  protected _open: boolean = false

  get is_open(): boolean {
    return this._open
  }

  readonly target: HTMLElement
  readonly orientation: Orientation
  readonly reversed: boolean
  readonly prevent_hide?: HTMLElement | ((event: UIEvent) => boolean)
  readonly extra_stylesheets: StyleSheetLike[]
  readonly class_list: ClassList

  constructor(public contents: HTMLElement[], options: Options) {
    this.target = options.target
    this.prevent_hide = options.prevent_hide
    this.extra_stylesheets = options.extra_stylesheets ?? []

    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.class_list = new ClassList(this.el.classList)
  }

  protected _on_mousedown = (event: UIEvent) => {
    if (event.composedPath().includes(this.el)) {
      return
    }

    const {prevent_hide} = this
    if (prevent_hide instanceof HTMLElement) {
      if (event.composedPath().includes(prevent_hide)) {
        return
      }
    } else if (prevent_hide != null) {
      if (prevent_hide(event)) {
        return
      }
    }

    this.hide()
  }

  protected _on_keydown = (event: KeyboardEvent) => {
    switch (event.key as Keys) {
      case "Escape": {
        this.hide()
        break
      }
      default:
    }
  }

  protected _on_blur = () => {
    this.hide()
  }

  remove(): void {
    this._unlisten()
    this.el.remove()
  }

  protected _listen(): void {
    document.addEventListener("mousedown", this._on_mousedown)
    document.addEventListener("keydown", this._on_keydown)
    window.addEventListener("blur", this._on_blur)
  }

  protected _unlisten(): void {
    document.removeEventListener("mousedown", this._on_mousedown)
    document.removeEventListener("keydown", this._on_keydown)
    window.removeEventListener("blur", this._on_blur)
  }

  stylesheets(): StyleSheetLike[] {
    return [base_css, /*...super.stylesheets(), */ panes_css, ...this.extra_stylesheets]
  }

  empty(): void {
    empty(this.shadow_el)
    this.class_list.clear()
  }

  render(): void {
    this.empty()

    for (const style of this.stylesheets()) {
      const stylesheet = isString(style) ? new InlineStyleSheet(style) : style
      stylesheet.install(this.shadow_el)
    }

    this.shadow_el.append(...this.contents)
  }

  show(): void {
    if (!this._open) {
      this.render()
      const actual_target = this.target.shadowRoot ?? this.target
      actual_target.appendChild(this.el)
      this._listen()
      this._open = true
    }
  }

  hide(): void {
    if (this._open) {
      this._open = false
      this._unlisten()
      this.el.remove()
    }
  }

  toggle(): void {
    this._open ? this.hide() : this.show()
  }
}
