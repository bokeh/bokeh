import {UIElement, UIElementView} from "../ui_element"
import {MenuItem} from "./menu_item"
import {ActionItem} from "./action_item"
import {CheckableItem} from "./checkable_item"
import {DividerItem} from "./divider_item"
import type * as p from "core/properties"
import type {XY} from "core/util/bbox"
import type {StyleSheetLike} from "core/dom"
import {div, px} from "core/dom"
import {ToolIcon} from "core/enums"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {reversed as reverse} from "core/util/array"
import {execute} from "core/util/callbacks"

import menus_css, * as menus from "styles/menus_.css"
import icons_css from "styles/icons.css"

export class MenuView extends UIElementView {
  declare model: Menu

  protected _menu_views: ViewStorage<Menu> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this._menu_views.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const menus = this.model.items
      .map((item) => item instanceof ActionItem ? item.menu : null)
      .filter((item) => item != null)
    await build_views(this._menu_views, menus, {parent: this})
  }

  prevent_hide?: (event: MouseEvent) => boolean

  protected _open: boolean = false
  get is_open(): boolean {
    return this._open
  }

  protected _item_click = (item: ActionItem) => {
    if (!item.disabled) {
      const {action} = item
      if (action != null) {
        void execute(action, this.model, {item})
      }
      this.hide()
    }
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

  override remove(): void {
    this._unlisten()
    remove_views(this._menu_views)
    super.remove()
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

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), menus_css, icons_css]
  }

  override render(): void {
    super.render()

    const items = (() => {
      const {reversed, items} = this.model
      return reversed ? reverse(items) : items
    })()
    for (const item of items) {
      if (item instanceof DividerItem) {
        const item_el = div({class: menus.divider})
        this.shadow_el.append(item_el)
      } else if (item instanceof ActionItem) {
        const check_el = div({class: menus.check})
        const icon_el = div({class: menus.icon})
        const label_el = div({class: menus.label}, item.label)
        const shortcut_el = div({class: menus.shortcut}, item.shortcut)
        const chevron_el = div({class: menus.chevron})

        const {icon} = item
        if (icon != null) {
          if (icon.startsWith("data:image")) {
            const url = `url("${encodeURI(icon)}")`
            icon_el.style.backgroundImage = url
          } else if (icon.startsWith("--")) {
            icon_el.style.backgroundImage = `var(${icon})`
          } else if (icon.startsWith(".")) {
            const cls = icon.substring(1)
            icon_el.classList.add(cls)
          } else if (ToolIcon.valid(icon)) {
            const cls = `bk-tool-icon-${icon.replace(/_/g, "-")}`
            icon_el.classList.add(cls)
          }
        }

        const item_el = div(
          {class: menus.item, title: item.tooltip, tabIndex: 0},
          check_el, icon_el, label_el, shortcut_el, chevron_el,
        )

        item_el.classList.toggle(menus.menu, item.menu != null)
        item_el.classList.toggle(menus.disabled, item.disabled)

        if (item instanceof CheckableItem) {
          item_el.classList.add(menus.checkable)
          item_el.classList.toggle(menus.checked, item.checked)
        }

        item_el.addEventListener("click", () => {
          this._item_click(item)
        })
        item_el.addEventListener("keydown", (event) => {
          if (event.key == "Enter") {
            this._item_click(item)
          }
        })
        const {menu} = item
        if (menu != null) {
          item_el.addEventListener("pointerenter", () => {
            const menu_view = this._menu_views.get(menu)!
            menu_view._show_submenu(item_el)
          })
          item_el.addEventListener("pointerleave", () => {
            const menu_view = this._menu_views.get(menu)!
            menu_view.hide()
          })
        }
        this.shadow_el.append(item_el)
      }
    }
  }

  protected _show_submenu(target: HTMLElement): void {
    if (this.model.items.length == 0) {
      this.hide()
      return
    }
    this.render()
    target.append(this.el)
    const {style} = this.el
    style.left = "100%"
    style.top = "0"
    this._listen()
    this._open = true
  }

  show(at: XY): void {
    if (this.model.items.length == 0) {
      this.hide()
      return
    }
    const {parent} = this
    if (parent == null) {
      // TODO position: fixed
      this.hide()
      return
    }
    this.render()
    const target = parent.el.shadowRoot ?? parent.el
    target.append(this.el)
    const {style} = this.el
    style.left = px(at.x)
    style.top = px(at.y)
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
}

export namespace Menu {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    items: p.Property<MenuItem[]>
    reversed: p.Property<boolean>
  }
}

export interface Menu extends Menu.Attrs {}

export class Menu extends UIElement {
  declare properties: Menu.Props
  declare __view_type__: MenuView

  constructor(attrs?: Partial<Menu.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MenuView

    this.define<Menu.Props>(({Bool, List, Ref}) => ({
      items: [ List(Ref(MenuItem)), [] ],
      reversed: [ Bool, false ],
    }))
  }
}
