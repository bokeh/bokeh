import Hammer, {Manager} from "hammerjs"

import {Class} from "core/class"
import {DOMView} from "core/dom_view"
import {Tool, ToolView} from "./tool"
import {empty} from "core/dom"
import * as p from "core/properties"
import {startsWith} from "core/util/string"
import {isString} from "core/util/types"
import {reversed} from "core/util/array"

import {bk_toolbar_button} from "styles/toolbar"

import toolbar_css from "styles/toolbar.css"
import icons_css from "styles/icons.css"
import menus_css from "styles/menus.css"

import {ContextMenu, MenuItem} from "core/util/menus"

import type {ToolbarBaseView} from "./toolbar_base"

export abstract class ButtonToolButtonView extends DOMView {
  model: ButtonTool
  parent: ToolbarBaseView

  private _hammer: InstanceType<typeof Manager>
  private _menu?: ContextMenu

  initialize(): void {
    super.initialize()

    const items = this.model.menu
    if (items != null) {
      const location = this.parent.model.toolbar_location
      const reverse = location == "left" || location == "above"
      const orientation = this.parent.model.horizontal ? "vertical" : "horizontal"
      this._menu = new ContextMenu(!reverse ? items : reversed(items), {
        orientation,
        prevent_hide: (event) => event.target == this.el,
      })
    }

    this._hammer = new Hammer(this.el, {
      touchAction: "auto",
      inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
    })
    this.connect(this.model.change, () => this.render())
    this._hammer.on("tap", (e) => {
      if (this._menu?.is_open) {
        this._menu.hide()
        return
      }
      if (e.target == this.el) {
        this._clicked()
      }
    })
    this._hammer.on("press", () => this._pressed())
  }

  remove(): void {
    this._hammer.destroy()
    this._menu?.remove()
    super.remove()
  }

  styles(): string[] {
    return [...super.styles(), toolbar_css, icons_css, menus_css]
  }

  css_classes(): string[] {
    return super.css_classes().concat(bk_toolbar_button)
  }

  render(): void {
    empty(this.el)
    const icon = this.model.computed_icon
    if (isString(icon)) {
      if (startsWith(icon, "data:image"))
        this.el.style.backgroundImage = "url('" + icon + "')"
      else
        this.el.classList.add(icon)
    }
    this.el.title = this.model.tooltip

    if (this._menu != null) {
      this.root.el.appendChild(this._menu.el)
    }
  }

  protected abstract _clicked(): void

  protected _pressed(): void {
    const {left, top, right, bottom} = this.el.getBoundingClientRect()
    const at = (() => {
      switch (this.parent.model.toolbar_location) {
        case "right":
          return {right: left, top}
        case "left":
          return {left: right, top}
        case "above":
          return {left, top: bottom}
        case "below":
          return {left, bottom: top}
      }
    })()
    this._menu?.toggle(at)
  }
}

export abstract class ButtonToolView extends ToolView {
  model: ButtonTool
}

export namespace ButtonTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    disabled: p.Property<boolean>
  }
}

export interface ButtonTool extends ButtonTool.Attrs {}

export abstract class ButtonTool extends Tool {
  properties: ButtonTool.Props
  __view_type__: ButtonToolView

  constructor(attrs?: Partial<ButtonTool.Attrs>) {
    super(attrs)
  }

  static init_ButtonTool(): void {
    this.internal({
      disabled: [ p.Boolean, false ],
    })
  }

  tool_name: string

  icon: string

  button_view: Class<ButtonToolButtonView>

  get tooltip(): string {
    return this.tool_name
  }

  get computed_icon(): string {
    return this.icon
  }

  get menu(): MenuItem[] | null {
    return null
  }
}
