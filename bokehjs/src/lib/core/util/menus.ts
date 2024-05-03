import type {StyleSheetLike} from "../dom"
import {div, empty, InlineStyleSheet, ClassList} from "../dom"
import type {Orientation} from "../enums"
import {reversed} from "./array"
import {isString} from "./types"
import {enumerate} from "./iterator"

import menus_css, * as menus from "styles/menus.css"
import icons_css from "styles/icons.css"
import base_css from "styles/base.css"

export type ScreenPoint = {left?: number, right?: number, top?: number, bottom?: number}
export type At =
  ScreenPoint |
  {left_of:  HTMLElement} |
  {right_of: HTMLElement} |
  {below: HTMLElement} |
  {above: HTMLElement}

export type MenuEntry = {
  icon?: string
  label?: string
  tooltip?: string
  class?: string
  content?: HTMLElement
  custom?: HTMLElement
  active?: () => boolean
  handler?: () => void
  if?: () => boolean
}

export type MenuItem = MenuEntry | null

export type MenuOptions = {
  target: HTMLElement
  orientation?: Orientation
  reversed?: boolean
  prevent_hide?: (event: MouseEvent) => boolean
  extra_styles?: StyleSheetLike[]
  entry_handler?: (entry: MenuEntry, i: number) => void
}

//import {DOMComponentView} from "../dom_view"

export class ContextMenu { //extends DOMComponentView {
  readonly el: HTMLElement = div()
  readonly shadow_el: ShadowRoot

  protected _open: boolean = false

  get is_open(): boolean {
    return this._open
  }

  get can_open(): boolean {
    return this.items.length != 0
  }

  readonly target: HTMLElement
  readonly orientation: Orientation
  readonly reversed: boolean
  readonly prevent_hide?: (event: MouseEvent) => boolean
  readonly extra_styles: StyleSheetLike[]
  readonly entry_handler?: (entry: MenuEntry, i: number) => void
  readonly class_list: ClassList

  constructor(readonly items: MenuItem[], options: MenuOptions) {
    this.target = options.target
    this.orientation = options.orientation ?? "vertical"
    this.reversed = options.reversed ?? false
    this.prevent_hide = options.prevent_hide
    this.extra_styles = options.extra_styles ?? []
    this.entry_handler = options.entry_handler

    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.class_list = new ClassList(this.el.classList)
  }

  protected _item_click = (entry: MenuEntry, i: number) => {
    this.entry_handler?.(entry, i)
    entry.handler?.()
    this.hide()
  }

  protected _on_mousedown = (event: MouseEvent) => {
    if (event.composedPath().includes(this.el)) {
      return
    }

    if (this.prevent_hide?.(event) ?? false) {
      return
    }

    this.hide()
  }

  protected _on_keydown = (event: KeyboardEvent) => {
    if (event.key == "Escape") {
      this.hide()
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

  protected _position(at: At): void {
    const pos = (() => {
      if ("left_of" in at) {
        const {left, top} = at.left_of.getBoundingClientRect()
        return {right: left, top}
      }
      if ("right_of" in at) {
        const {top, right} = at.right_of.getBoundingClientRect()
        return {left: right, top}
      }
      if ("below" in at) {
        const {left, bottom} = at.below.getBoundingClientRect()
        return {left, top: bottom}
      }
      if ("above" in at) {
        const {left, top} = at.above.getBoundingClientRect()
        return {left, bottom: top}
      }
      return at
    })()

    const parent_el = this.el.offsetParent ?? document.body
    const origin = (() => {
      const rect = parent_el.getBoundingClientRect()
      const style = getComputedStyle(parent_el)
      return {
        left: rect.left - parseFloat(style.marginLeft),
        right: rect.right + parseFloat(style.marginRight),
        top: rect.top - parseFloat(style.marginTop),
        bottom: rect.bottom + parseFloat(style.marginBottom),
      }
    })()

    const {style} = this.el
    style.left = pos.left != null ? `${pos.left - origin.left}px` : "auto"
    style.top = pos.top != null ? `${pos.top - origin.top}px` : "auto"
    style.right = pos.right != null ? `${origin.right - pos.right}px` : "auto"
    style.bottom = pos.bottom != null ? `${origin.bottom - pos.bottom}px` : "auto"
  }

  stylesheets(): StyleSheetLike[] {
    return [base_css, /*...super.stylesheets(), */ menus_css, icons_css, ...this.extra_styles]
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

    this.class_list.add(menus[this.orientation])

    const items = this.reversed ? reversed(this.items) : this.items
    for (const [item, i] of enumerate(items)) {
      let el: HTMLElement
      if (item == null) {
        el = div({class: menus.divider})
      } else if (item.if != null && !item.if()) {
        continue
      } else if (item.custom != null) {
        el = item.custom
      } else {
        const icon = item.icon != null ? div({class: [menus.menu_icon, item.icon]}) : null
        const classes = [item.active?.() ?? false ? menus.active: null, item.class]
        el = div({class: classes, title: item.tooltip, tabIndex: 0}, icon, item.label, item.content)
        el.addEventListener("click", () => {
          this._item_click(item, i)
        })
        el.addEventListener("keydown", (event) => {
          if (event.key == "Enter") {
            this._item_click(item, i)
          }
        })
      }

      this.shadow_el.appendChild(el)
    }
  }

  show(at?: At): void {
    if (this.items.length == 0) {
      return
    }
    this.render()
    if (this.shadow_el.children.length == 0) {
      return
    }
    (this.target.shadowRoot ?? this.target).appendChild(this.el)
    this._position(at ?? {left: 0, top: 0})
    this._listen()
    this._open = true
  }

  hide(): void {
    if (this._open) {
      this._open = false
      this._unlisten()
      this.el.remove()
    }
  }

  toggle(at?: At): void {
    this._open ? this.hide() : this.show(at)
  }
}
