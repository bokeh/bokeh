import {div, classes, display, undisplay, empty, remove, Keys} from "../dom"
import {Orientation} from "../enums"
import {enumerate} from "./iterator"

//import menus_css from "styles/menus.css"
import * as styles from "styles/menus"

export type ScreenPoint = {left?: number, right?: number, top?: number, bottom?: number}

export type MenuItem = {
  icon?: string
  label?: string
  tooltip?: string
  active?: () => boolean
  handler: () => void
  if?: () => boolean
} | null

export type MenuOptions = {
  orientation?: Orientation
  prevent_hide?: (event: MouseEvent) => boolean
}

export class ContextMenu {

  readonly el: HTMLElement = div()
  protected _open: boolean = false

  get is_open(): boolean {
    return this._open
  }

  get can_open(): boolean {
    return this.items.length != 0
  }

  constructor(readonly items: MenuItem[], readonly options: MenuOptions = {}) {
    undisplay(this.el)
  }

  protected _item_click = (i: number) => {
    this.items[i]?.handler()
    this.hide()
  }

  protected _on_mousedown = (event: MouseEvent) => {
    const {target} = event
    if (target instanceof Node && this.el.contains(target))
      return

    if (this.options.prevent_hide?.(event))
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

  protected _position(at: ScreenPoint): void {
    const parent_el = this.el.parentElement
    if (parent_el != null) {
      const parent = parent_el.getBoundingClientRect()
      this.el.style.left = at.left != null ? `${at.left - parent.left}px` : ""
      this.el.style.top = at.top != null ? `${at.top - parent.top}px` : ""
      this.el.style.right = at.right != null ? `${parent.right - at.right}px` : ""
      this.el.style.bottom = at.bottom != null ? `${parent.bottom - at.bottom}px` : ""
    }
  }

  /*
  styles(): string[] {
    return [...super.styles(), menus_css]
  }
  */

  render(): void {
    empty(this.el, true)
    const orientation = this.options.orientation ?? "vertical"
    classes(this.el).add("bk-context-menu", `bk-${orientation}`)

    for (const [item, i] of enumerate(this.items)) {
      let el: HTMLElement
      if (item == null) {
        el = div({class: styles.bk_divider})
      } else if (item.if != null && !item.if()) {
        continue
      } else {
        const icon = item.icon != null ? div({class: ["bk-menu-icon", item.icon]}) : null
        el = div({class: item.active?.() ? "bk-active": null, title: item.tooltip}, icon, item.label)
      }

      el.addEventListener("click", () => this._item_click(i))
      this.el.appendChild(el)
    }
  }

  show(at?: ScreenPoint): void {
    if (this.items.length == 0)
      return

    if (!this._open) {
      this.render()
      if (this.el.children.length == 0)
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

  toggle(at?: ScreenPoint): void {
    this._open ? this.hide() : this.show(at)
  }
}
