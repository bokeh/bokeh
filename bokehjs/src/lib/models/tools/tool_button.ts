import Hammer, {Manager} from "hammerjs"

import {DOMView} from "core/dom_view"
import {empty, Keys} from "core/dom"
import {ToolIcon} from "core/enums"
import {ContextMenu} from "core/util/menus"
import {startsWith} from "core/util/string"
import {reversed} from "core/util/array"

import tools_css, * as tools from "styles/tool_button.css"
import icons_css from "styles/icons.css"

import type {ToolbarView} from "./toolbar"
import type {Tool} from "./tool"

export abstract class ToolButtonView extends DOMView {
  override model: Tool
  override readonly parent: ToolbarView
  override el: HTMLElement

  private _hammer: InstanceType<typeof Manager>
  private _menu?: ContextMenu

  override initialize(): void {
    super.initialize()

    const items = this.model.menu
    if (items != null) {
      const location = this.parent.model.toolbar_location
      const reverse = location == "left" || location == "above"
      const orientation = this.parent.model.horizontal ? "vertical" : "horizontal"
      this._menu = new ContextMenu(!reverse ? items : reversed(items), {
        orientation,
        prevent_hide: (event) => event.composedPath().includes(this.el),
      })
    }

    this._hammer = new Hammer(this.el, {
      touchAction: "auto",
      inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
    })
    this.connect(this.model.change, () => this.render())
    this._hammer.on("tap", (e) => {
      const {_menu} = this
      if (_menu != null && _menu.is_open) {
        _menu.hide()
        return
      }
      if (e.target == this.el) {
        this._clicked()
      }
    })
    this._hammer.on("press", () => this._pressed())
    this.el.addEventListener("keydown", (event) => {
      if (event.keyCode == Keys.Enter) {
        this._clicked()
      }
    })
  }

  override remove(): void {
    this._hammer.destroy()
    this._menu?.remove()
    super.remove()
  }

  override styles(): string[] {
    return [...super.styles(), tools_css, icons_css]
  }

  override css_classes(): string[] {
    return super.css_classes().concat(tools.toolbar_button)
  }

  override render(): void {
    empty(this.el)
    const icon = this.model.computed_icon
    if (icon != null) {
      if (startsWith(icon, "data:image")) {
        const url = `url("${encodeURI(icon)}")`
        this.el.style.backgroundImage = url
      } else if (startsWith(icon, "--")) {
        this.el.style.backgroundImage = `var(${icon})`
      } else if (startsWith(icon, ".")) {
        const cls = icon.substring(1)
        this.el.classList.add(cls)
      } else if (ToolIcon.valid(icon)) {
        const cls = `bk-tool-icon-${icon.replace(/_/g, "-")}`
        this.el.classList.add(cls)
      }
    }
    this.el.title = this.model.tooltip
    this.el.tabIndex = 0

    if (this._menu != null) {
      this.root.children_el.appendChild(this._menu.el)
    }
  }

  protected abstract _clicked(): void

  protected _pressed(): void {
    const at = (() => {
      switch (this.parent.model.toolbar_location) {
        case "right": return {left_of:  this.el}
        case "left":  return {right_of: this.el}
        case "above": return {below: this.el}
        case "below": return {above: this.el}
      }
    })()
    this._menu?.toggle(at)
  }
}
