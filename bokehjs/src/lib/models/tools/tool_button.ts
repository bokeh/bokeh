import Hammer, {Manager} from "hammerjs"

import {UIElement, UIElementView} from "../ui/ui_element"
import {Tool} from "./tool"
import {div, StyleSheetLike} from "core/dom"
import {ToolIcon} from "core/enums"
import {ContextMenu} from "core/util/menus"
import {reversed} from "core/util/array"
import * as p from "core/properties"

import tool_button_css, * as tool_button from "styles/tool_button.css"
import icons_css from "styles/icons.css"

import type {ToolbarView} from "./toolbar"

export abstract class ToolButtonView extends UIElementView {
  override model: ToolButton
  override readonly parent: ToolbarView

  private _hammer?: InstanceType<typeof Manager>
  private _menu?: ContextMenu

  override initialize(): void {
    super.initialize()

    const items = this.model.tool.menu
    if (items == null) {
      this.el.addEventListener("click", (e) => {
        if (e.composedPath().includes(this.el)) {
          this._clicked()
        }
      })
    } else {
      const {location} = this.parent.model
      const reverse = location == "left" || location == "above"
      const orientation = this.parent.model.horizontal ? "vertical" : "horizontal"
      this._menu = new ContextMenu(!reverse ? items : reversed(items), {
        target: this.root.el,
        orientation,
        prevent_hide: (event) => event.composedPath().includes(this.el),
      })

      this._hammer = new Hammer(this.el, {
        cssProps: {} as any, // NOTE: don't assign style, use .bk-events instead
        touchAction: "auto",
        inputClass: Hammer.TouchMouseInput, // https://github.com/bokeh/bokeh/issues/9187
      })
      this._hammer.on("tap", (e) => {
        const {_menu} = this
        if (_menu != null && _menu.is_open) {
          _menu.hide()
          return
        }
        if (e.srcEvent.composedPath().includes(this.el)) {
          this._clicked()
        }
      })
      this._hammer.on("press", () => this._pressed())
      this.el.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
          this._clicked()
        }
      })
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
    this.connect(this.model.tool.change, () => this.render())
  }

  override remove(): void {
    this._hammer?.destroy()
    this._menu?.remove()
    super.remove()
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), tool_button_css, icons_css]
  }

  override render(): void {
    super.render()

    this.class_list.add(tool_button[this.parent.model.location])
    if (this.model.tool.disabled)
      this.class_list.add(tool_button.disabled)

    const icon_el = div({class: tool_button.tool_icon})
    this.shadow_el.appendChild(icon_el)

    const icon = this.model.icon ?? this.model.tool.computed_icon
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

    if (this.model.tool.menu != null) {
      const chevron_el = div({class: tool_button.tool_chevron})
      this.shadow_el.appendChild(chevron_el)
    }

    const tooltip = this.model.tooltip ?? this.model.tool.tooltip
    this.el.title = tooltip

    this.el.tabIndex = 0
  }

  protected abstract _clicked(): void

  protected _pressed(): void {
    const at = (() => {
      switch (this.parent.model.location) {
        case "right": return {left_of:  this.el}
        case "left":  return {right_of: this.el}
        case "above": return {below: this.el}
        case "below": return {above: this.el}
      }
    })()
    this._menu?.toggle(at)
  }
}

export namespace ToolButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    tool: p.Property<Tool>
    icon: p.Property<ToolIcon | string | null>
    tooltip: p.Property<string | null>
  }
}

export interface ToolButton extends ToolButton.Attrs {}

export abstract class ToolButton extends UIElement {
  override properties: ToolButton.Props
  override __view_type__: ToolButtonView

  constructor(attrs?: Partial<ToolButton.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToolButton.Props>(({String, Regex, Ref, Nullable, Or}) => ({
      tool: [ Ref(Tool) ],
      icon: [ Nullable(Or(ToolIcon, Regex(/^--/), Regex(/^\./), Regex(/^data:image/))), null ],
      tooltip: [ Nullable(String), null ],
    }))
  }
}
