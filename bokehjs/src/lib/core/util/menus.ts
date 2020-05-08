import {div, classes, display, undisplay, empty, append, Keys} from "../dom"
import {Orientation} from "../enums"

//import menus_css from "styles/menus.css"
import * as styles from "styles/menus"

export type ScreenPoint = {left?: number, right?: number, top?: number, bottom?: number}

export type MenuItem = {
  icon?: string
  label?: string
  tooltip?: string
  active?: () => boolean
  handler: () => void
} | null

export class ContextMenu {

  readonly el: HTMLElement = div()
  protected _open: boolean = false

  get is_open(): boolean {
    return this._open
  }

  constructor(readonly items: MenuItem[], readonly orientation: Orientation) {}

  protected _item_click = (i: number) => {
    this.items[i]?.handler()
    this.hide()
  }

  protected _on_mousedown = (event: MouseEvent) => {
    const {target} = event
    if (!(target instanceof Node && this.el.contains(target))) {
      this.hide()
    }
  }

  protected _on_keydown = (event: KeyboardEvent) => {
    if (event.keyCode == Keys.Esc)
      this.hide()
  }

  protected _on_blur = () => {
    this.hide()
  }

  remove(): void {
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
    empty(this.el)
    undisplay(this.el)

    classes(this.el).add("bk-context-menu", `bk-${this.orientation}`)

    append(this.el, ...this.items.map((item, i) => {
      let el: HTMLElement
      if (item != null) {
        const icon = item.icon != null ? div({class: ["bk-toolbar-button", item.icon]}) : null
        el = div({class: item.active?.() ? "bk-active": null, title: item.tooltip}, icon, item.label)
      } else {
        el = div({class: styles.bk_divider})
      }

      el.addEventListener("click", () => this._item_click(i))
      return el
    }))
  }

  show(at?: ScreenPoint): void {
    if (!this._open) {
      if (at != null) {
        this._position(at)
      }
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
