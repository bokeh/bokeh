import Hammer, {Manager} from "hammerjs"

import {Class} from "core/class"
import {DOMView} from "core/dom_view"
import {Tool, ToolView} from "./tool"
import {empty, Keys} from "core/dom"
import {Dimensions, ToolIcon} from "core/enums"
import * as p from "core/properties"
import {startsWith} from "core/util/string"
import {reversed} from "core/util/array"

import toolbar_css, * as toolbars from "styles/toolbar.css"
import icons_css from "styles/icons.css"
import menus_css from "styles/menus.css"

import {ContextMenu, MenuItem} from "core/util/menus"

import type {ToolbarBaseView} from "./toolbar_base"

export abstract class ButtonToolButtonView extends DOMView {
  override model: ButtonTool
  override readonly parent: ToolbarBaseView
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
    return [...super.styles(), toolbar_css, icons_css, menus_css]
  }

  override css_classes(): string[] {
    return super.css_classes().concat(toolbars.toolbar_button)
  }

  override render(): void {
    empty(this.el)
    const icon = this.model.computed_icon
    if (icon != null) {
      if (startsWith(icon, "data:image")) {
        const url = `url("${encodeURI(icon)}")`
        this.el.style.backgroundImage = url
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
      this.root.shadow_el.appendChild(this._menu.el)
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

export abstract class ButtonToolView extends ToolView {
  override model: ButtonTool
}

export namespace ButtonTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    disabled: p.Property<boolean>
  }
}

export interface ButtonTool extends ButtonTool.Attrs {}

export abstract class ButtonTool extends Tool {
  override properties: ButtonTool.Props
  override __view_type__: ButtonToolView

  constructor(attrs?: Partial<ButtonTool.Attrs>) {
    super(attrs)
  }

  static {
    this.internal<ButtonTool.Props>(({Boolean}) => ({
      disabled: [ Boolean, false ],
    }))
  }

  readonly tool_name: string
  readonly tool_icon?: string

  button_view: Class<ButtonToolButtonView>

  // utility function to return a tool name, modified
  // by the active dimensions. Used by tools that have dimensions
  protected _get_dim_tooltip(dims: Dimensions): string {
    const {description, tool_name} = this
    if (description != null)
      return description
    else if (dims == "both")
      return tool_name
    else
      return `${tool_name} (${dims == "width" ? "x" : "y"}-axis)`
  }

  get tooltip(): string {
    return this.description ?? this.tool_name
  }

  get computed_icon(): string | undefined {
    return this.icon ?? `.${this.tool_icon}`
  }

  get menu(): MenuItem[] | null {
    return null
  }
}
