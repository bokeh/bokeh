import {UIElement, UIElementView} from "../ui/ui_element"
import {IconLike} from "../common/kinds"
import {resolve_icon} from "../common/resolve"
import {Tool} from "./tool"
import {ToolProxy} from "./tool_proxy"
import {ToolGroup} from "./tool_group"
import type {TapEvent} from "core/ui_gestures"
import {UIGestures} from "core/ui_gestures"
import type {Keys} from "core/dom"
import type {StyleSheetLike} from "core/stylesheets"
import type {VNode, TargetedEvent} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type {At} from "core/util/menus"
import {ContextMenu} from "core/util/menus"
import {reversed} from "core/util/array"
import type * as p from "core/properties"

import tool_button_css, * as tool_button from "styles/tool_button.css"
import icons_css from "styles/icons.css"

import {computed} from "@preact/signals"
import {useLayoutEffect} from "preact/hooks"

import type {ToolbarView} from "./toolbar"

type ToolLike = Tool | ToolProxy<Tool>

/**
 * Read signals of properties that derived attributes of a tool depend on
 * (e.g. `computed_icon` or `tooltip`), including tools proxied by tool
 * proxies, so that the calling computation updates when they change.
 */
function track_tool(tool: ToolLike): void {
  if (tool instanceof ToolProxy) {
    for (const proxied of tool.properties.tools.signal.value) {
      track_tool(proxied)
    }
  } else {
    const {icon, label, description} = tool.properties
    void icon.signal.value
    void label.signal.value
    void description.signal.value
  }
}

export abstract class ToolButtonView extends UIElementView {
  declare model: ToolButton
  declare readonly signals: p.SignalsOf<ToolButton.Props>
  declare readonly parent: ToolbarView

  protected _menu: ContextMenu
  protected _ui_gestures: UIGestures

  get menu(): ContextMenu {
    return this._menu
  }

  /**
   * The current tool. Reading it subscribes the calling computation to changes of `tool`.
   */
  protected get _tool(): ToolLike {
    return this.signals.tool.value
  }

  /**
   * The current tool, additionally subscribing the calling computation to changes
   * of properties that the tool's derived attributes depend on.
   */
  protected get _tracked_tool(): ToolLike {
    const tool = this._tool
    track_tool(tool)
    return tool
  }

  protected _tool_state(name: "visible" | "active" | "disabled"): boolean {
    return this._tool.properties[name].signal.value
  }

  readonly location = computed(() => this.parent.model.properties.location.signal.value)
  readonly icon = computed(() => this.signals.icon.value ?? this._tracked_tool.computed_icon ?? null)
  readonly tooltip = computed(() => this.signals.tooltip.value ?? this._tracked_tool.tooltip)
  readonly visible = computed(() => this._tool_state("visible"))
  readonly disabled = computed(() => this._tool_state("disabled"))
  readonly active = computed(() => this._is_active())
  readonly has_menu = computed(() => this._tracked_tool.menu != null)

  readonly count = computed(() => {
    const tool = this._tool
    if (tool instanceof ToolGroup && tool.properties.show_count.signal.value) {
      return tool.properties.tools.signal.value.length
    } else {
      return null
    }
  })

  protected _is_active(): boolean {
    return false
  }

  override initialize(): void {
    super.initialize()

    this._menu = this._build_menu()

    this._ui_gestures = new UIGestures(this.el, {
      on_tap: (event: TapEvent) => {
        if (this._menu.is_open) {
          this._menu.hide()
          return
        }
        if (event.native.composedPath().includes(this.el)) {
          this._tap()
        }
      },
      on_press: () => {
        this.press()
      },
    })
  }

  override connect_signals(): void {
    super.connect_signals()
    this._ui_gestures.connect_signals()
  }

  override remove(): void {
    this._ui_gestures.remove()
    this._menu.remove()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tool_button_css, icons_css]
  }

  protected readonly _on_keydown = (event: TargetedEvent<HTMLElement, KeyboardEvent>): void => {
    switch (event.key as Keys) {
      case "Enter": {
        this._tap()
        break
      }
      case " ": {
        this.press()
        break
      }
      default:
    }
  }

  override component(): VNode {
    const location = this.location.value
    const icon = resolve_icon(this.icon.value)
    const count = this.count.value

    // Updates of the button may affect the layout of the toolbar (e.g. when it becomes
    // visible), which the toolbar has to know about after the DOM was updated.
    useLayoutEffect(() => {
      this.parent.button_updated(this)
    })

    const classes = cls(
      tool_button[location],
      this.active.value ? tool_button.active : null,
      this.disabled.value ? tool_button.disabled : null,
      !this.visible.value ? tool_button.hidden : null,
    )

    return (
      <UIComponent parent={this.resolved_props} class={classes} title={this.tooltip.value} tabIndex={0} onKeyDown={this._on_keydown}>
        <div class={cls(tool_button.tool_icon, icon.class)} style={icon.style}></div>
        {this.has_menu.value ? <div class={tool_button.tool_chevron}></div> : null}
        {count != null ? <div class={tool_button.count}>{count}</div> : null}
      </UIComponent>
    )
  }

  abstract tap(): void

  protected _tap(): void {
    this.tap()
    this.parent.button_tapped(this)
  }

  protected _menu_at(): At {
    switch (this.parent.model.location) {
      case "right": return {left_of:  this.el}
      case "left":  return {right_of: this.el}
      case "above": return {below: this.el}
      case "below": return {above: this.el}
    }
  }

  /**
   * Builds the tool's menu, so that it reflects the current state of the tool
   * and the current location of the toolbar.
   */
  protected _build_menu(): ContextMenu {
    const items = this.model.tool.menu ?? []
    const {location, horizontal} = this.parent.model
    const reverse = location == "left" || location == "above"
    return new ContextMenu(!reverse ? items : reversed(items), {
      target: this.parent.el,
      orientation: horizontal ? "vertical" : "horizontal",
      prevent_hide: (event) => {
        return event.composedPath().includes(this.el)
      },
      labels: false,
    })
  }

  press(): void {
    if (this._menu.is_open) {
      this._menu.hide()
    } else {
      this._menu.remove()
      this._menu = this._build_menu()
      this._menu.show(this._menu_at())
    }
  }
}

export namespace ToolButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    tool: p.Property<Tool | ToolProxy<Tool>>
    icon: p.Property<IconLike | null>
    tooltip: p.Property<string | null>
  }
}

export interface ToolButton extends ToolButton.Attrs {}

export abstract class ToolButton extends UIElement {
  declare properties: ToolButton.Props
  declare __view_type__: ToolButtonView

  static {
    this.define<ToolButton.Props>(({Str, Ref, Nullable, Or}) => ({
      tool: [ Or(Ref(Tool), Ref(ToolProxy)) ],
      icon: [ Nullable(IconLike), null ],
      tooltip: [ Nullable(Str), null ],
    }))
  }
}
