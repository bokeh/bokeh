import {UIElement, UIElementView} from "../ui/ui_element"
import {MenuItem} from "./menu_item"
import type {StyleSheetLike} from "core/dom"
import {Orientation} from "core/enums"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {reverse, map} from "core/util/iterator"
import type * as p from "core/properties"

import menus_css, * as menus from "styles/menus.css"

export class MenuView extends UIElementView {
  declare model: Menu

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), menus_css]
  }

  protected readonly items: ViewStorage<MenuItem> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this.items.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this.items, this.model.items)
  }

  override remove(): void {
    remove_views(this.items)
    super.remove()
  }

  override render(): void {
    super.render()

    this.el.classList.add(menus[this.model.orientation])

    const items = (() => {
      const {items, reversed} = this.model
      const ordererd = reversed ? reverse(items) : items
      return map(ordererd, (item) => this.items.get(item)!)
    })()

    for (const item of items) {
      item.render()
      this.shadow_el.appendChild(item.el)
    }
  }
}

export namespace Menu {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    items: p.Property<MenuItem[]>
    reversed: p.Property<boolean>
    orientation: p.Property<Orientation>
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
    this.define<Menu.Props>(({Boolean, Array, Ref}) => ({
      items: [ Array(Ref(MenuItem)), [] ],
      reversed: [ Boolean, false ],
      orientation: [ Orientation, "vertical" ],
    }))
  }
}
