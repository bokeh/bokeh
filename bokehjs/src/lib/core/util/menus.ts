import {div, style, classes, display, undisplay, empty, remove, Keys} from "../dom"
import {Orientation} from "../enums"
import {reversed} from "./array"

import menus_css, * as menus from "styles/menus.css"
import icons_css from "styles/icons.css"
import base_css from "styles/base.css"

export type ScreenPoint = {left?: number, right?: number, top?: number, bottom?: number}
export type At = ScreenPoint |
  {left_of:  HTMLElement} | {right_of: HTMLElement} | {below: HTMLElement} | {above: HTMLElement}

export type MenuEntry = {
  icon?: string
  label?: string
  tooltip?: string
  class?: string
  content?: HTMLElement
  active?: () => boolean
  handler?: () => void
  if?: () => boolean
}

export type MenuItem = MenuEntry | null

export type MenuOptions = {
  orientation?: Orientation
  reversed?: boolean
  prevent_hide?: (event: MouseEvent) => boolean
}

export class ContextMenu {
  readonly el: HTMLElement = div()
  readonly shadow_el: ShadowRoot
  readonly stylesheet_el: HTMLStyleElement

  protected _open: boolean = false

  get is_open(): boolean {
    return this._open
  }

  get can_open(): boolean {
    return this.items.length != 0
  }

  readonly orientation: Orientation
  readonly reversed: boolean
  readonly prevent_hide?: (event: MouseEvent) => boolean

  constructor(readonly items: MenuItem[], options: MenuOptions = {}) {
    this.orientation = options.orientation ?? "vertical"
    this.reversed = options.reversed ?? false
    this.prevent_hide = options.prevent_hide

    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.stylesheet_el = style({}, ...this.styles())
    this.shadow_el.appendChild(this.stylesheet_el)

    undisplay(this.el)
  }

  protected _item_click = (entry: MenuEntry) => {
    entry.handler?.()
    this.hide()
  }

  protected _on_mousedown = (event: MouseEvent) => {
    const {target} = event
    if (target instanceof Node && this.el.contains(target))
      return

    if (this.prevent_hide?.(event) ?? false)
      return

    this.hide()
  }

  protected _on_keydown = (event: KeyboardEvent) => {
    if (event.keyCode == Keys.Esc)
      this.hide()
  }

  protected _on_blur = () => {
    this.hide()
  }

  remove(): void {
    remove(this.el)
    this._unlisten()
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
    const parent_el = this.el.parentElement
    if (parent_el != null) {
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

      const parent = parent_el.getBoundingClientRect()
      this.el.style.left = pos.left != null ? `${pos.left - parent.left}px` : ""
      this.el.style.top = pos.top != null ? `${pos.top - parent.top}px` : ""
      this.el.style.right = pos.right != null ? `${parent.right - pos.right}px` : ""
      this.el.style.bottom = pos.bottom != null ? `${parent.bottom - pos.bottom}px` : ""
    }
  }

  styles(): string[] {
    return [base_css, /*...super.styles(), */menus_css, icons_css]
  }

  empty(): void {
    empty(this.shadow_el)
    this.shadow_el.appendChild(this.stylesheet_el)
  }

  render(): void {
    this.empty()
    classes(this.el).add(menus[this.orientation])

    const items = this.reversed ? reversed(this.items) : this.items
    for (const item of items) {
      let el: HTMLElement
      if (item == null) {
        el = div({class: menus.divider})
      } else if (item.if != null && !item.if()) {
        continue
      } else if (item.content != null) {
        el = item.content
      } else {
        const icon = item.icon != null ? div({class: [menus.menu_icon, item.icon]}) : null
        const classes = [item.active?.() ?? false ? menus.active: null, item.class]
        el = div({class: classes, title: item.tooltip, tabIndex: 0}, icon, item.label, item.content)
        el.addEventListener("click", () => {
          this._item_click(item)
        })
        el.addEventListener("keydown", (event) => {
          if (event.keyCode == Keys.Enter) {
            this._item_click(item)
          }
        })
      }

      this.shadow_el.appendChild(el)
    }
  }

  show(at?: At): void {
    if (this.items.length == 0)
      return

    if (!this._open) {
      this.render()
      if (this.shadow_el.children.length == 0)
        return
      this._position(at ?? {left: 0, top: 0})
      display(this.el)
      this._listen()
      this._open = true
    }
  }

  hide(): void {
    if (this._open) {
      this._open = false
      this._unlisten()
      undisplay(this.el)
    }
  }

  toggle(at?: At): void {
    this._open ? this.hide() : this.show(at)
  }
}
