import {UIElement, UIElementView} from "../ui_element"
import {MenuItem} from "./menu_item"
import {DividerItem} from "./divider_item"
import {apply_icon} from "../../common/resolve"
import type * as p from "core/properties"
import type {XY} from "core/util/bbox"
import {isFunction} from "core/util/types"
import type {StyleSheetLike, Keys} from "core/dom"
import {div, px} from "core/dom"
import {Or, Ref, Null} from "core/kinds"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {reversed as reverse} from "core/util/array"
import {execute} from "core/util/callbacks"

import menus_css, * as menus from "styles/menus.css"
import icons_css from "styles/icons.css"

function to_val<T>(val: T | (() => T)): T {
  return isFunction(val) ? val() : val
}

export const MenuItemLike = Or(Ref(MenuItem), Ref(DividerItem), Null)
export type MenuItemLike = typeof MenuItemLike["__type__"]

export class MenuView extends UIElementView {
  declare model: Menu

  protected _menu_views: ViewStorage<Menu> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this._menu_views.values()
  }

  private _menu_items: MenuItemLike[] = []
  get menu_items(): MenuItemLike[] {
    const items = this._menu_items
    const {reversed} = this.model
    return reversed ? reverse(items) : items
  }
  protected _compute_menu_items(): MenuItemLike[] {
    return this.model.items
  }
  protected _update_menu_items(): void {
    this._menu_items = this._compute_menu_items()
  }

  get is_empty(): boolean {
    return this.menu_items.length == 0
  }

  override initialize(): void {
    super.initialize()
    this._update_menu_items()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const menus = this.menu_items
      .map((item) => item instanceof MenuItem ? item.menu : null)
      .filter((item) => item != null)
    await build_views(this._menu_views, menus, {parent: this})
  }

  override connect_signals(): void {
    super.connect_signals()

    const {items} = this.model.properties
    this.on_change(items, () => this._update_menu_items())
  }

  prevent_hide?: (event: MouseEvent) => boolean

  protected _open: boolean = false
  get is_open(): boolean {
    return this._open
  }

  protected _item_click = (item: MenuItem) => {
    if (!to_val(item.disabled)) {
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

    const items = this.menu_items
    const entries: {item: MenuItem, el: HTMLElement}[] = []

    if (items.length == 0) {
      return
    }

    for (const item of items) {
      if (item instanceof MenuItem) {
        const check_el = div({class: menus.check})
        const label_el = div({class: menus.label}, item.label)
        const shortcut_el = div({class: menus.shortcut}, item.shortcut)
        const chevron_el = div({class: menus.chevron})

        const icon_el = (() => {
          const {icon} = item
          if (icon != null) {
            const icon_el = div({class: menus.icon})
            apply_icon(icon_el, icon)
            return icon_el
          } else {
            return null
          }
        })()

        const item_el = div(
          {class: menus.item, title: item.tooltip, tabIndex: 0},
          check_el, icon_el, label_el, shortcut_el, chevron_el,
        )

        const has_menu = item.menu != null && !this._menu_views.get(item.menu)!.is_empty
        item_el.classList.toggle(menus.menu, has_menu)
        item_el.classList.toggle(menus.disabled, to_val(item.disabled))

        if (item.checked != null) {
          item_el.classList.add(menus.checkable)
          item_el.classList.toggle(menus.checked, to_val(item.checked))
        }

        const show_submenu = (item: MenuItem): void => {
          if (item.menu != null) {
            const menu_view = this._menu_views.get(item.menu)!
            menu_view._show_submenu(item_el)
          }
        }
        const hide_submenu = (item: MenuItem): void => {
          if (item.menu != null) {
            const menu_view = this._menu_views.get(item.menu)!
            menu_view.hide()
          }
        }

        function is_target(event: Event): boolean {
          const {currentTarget, target} = event
          return currentTarget instanceof Node && target instanceof Node && currentTarget.contains(target)
        }

        item_el.addEventListener("click", (event) => {
          if (is_target(event)) {
            this._item_click(item)
          } else {
            this.hide()
          }
        })
        item_el.addEventListener("keydown", (event) => {
          // TODO https://github.com/bokeh/bokeh/issues/14241
          switch (event.key as Keys) {
            case "Enter": {
              this._item_click(item)
              break
            }
            case "ArrowDown": {
              break
            }
            case "ArrowUp": {
              break
            }
            case "ArrowLeft": {
              break
            }
            case "ArrowRight": {
              break
            }
            default:
          }
        })
        const {menu} = item
        if (menu != null) {
          item_el.addEventListener("pointerenter", () => {
            show_submenu(item)
          })
          item_el.addEventListener("pointerleave", () => {
            hide_submenu(item)
          })
        }
        this.shadow_el.append(item_el)
        entries.push({item, el: item_el})
      } else {
        const item_el = div({class: menus.divider})
        this.shadow_el.append(item_el)
      }
    }
  }

  protected _show_submenu(target: HTMLElement): void {
    if (this.is_empty) {
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

  show(at: XY): boolean {
    if (this.is_empty) {
      this.hide()
      return false
    }
    const {parent} = this
    if (parent == null) {
      // TODO position: fixed
      this.hide()
      return false
    }
    this.render()
    const target = parent.el.shadowRoot ?? parent.el
    target.append(this.el)
    const {style} = this.el
    style.left = px(at.x)
    style.top = px(at.y)
    this._listen()
    this._open = true
    return true
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
    items: p.Property<MenuItemLike[]>
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

    this.define<Menu.Props>(({Bool, List}) => ({
      items: [ List(MenuItemLike), [] ],
      reversed: [ Bool, false ],
    }))
  }
}
