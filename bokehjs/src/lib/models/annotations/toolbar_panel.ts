import {Annotation, AnnotationView} from "./annotation"
import type {ToolbarView} from "../tools/toolbar"
import {Toolbar} from "../tools/toolbar"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import type {Size, Layoutable} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import type * as p from "core/properties"
import * as logos from "styles/logo.css"

const default_button_size = 30
const default_logo_length = 25

function to_px(value: string): number | null {
  const result = parseFloat(value)
  return Number.isFinite(result) && result > 0 ? result : null
}

export class ToolbarPanelView extends AnnotationView {
  declare model: ToolbarPanel

  declare layout: Layoutable

  override update_layout(): void {
    this.layout = new SideLayout(this.panel!, () => this.get_size(), true)
  }

  override after_layout(): void {
    this.toolbar_view.after_render()
  }

  override has_finished(): boolean {
    return super.has_finished() && this.toolbar_view.has_finished()
  }

  override _children_views(): ChildView[] {
    return [...super._children_views(), this.toolbar_view]
  }

  toolbar_view: ToolbarView

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.toolbar_view = await build_view(this.model.toolbar, {parent: this.canvas})
  }

  override connect_signals(): void {
    super.connect_signals()

    this.plot_view.mouseenter.connect(() => {
      this.toolbar_view.set_visibility(true)
    })
    this.plot_view.mouseleave.connect(() => {
      this.toolbar_view.set_visibility(false)
    })

    this.plot_view.canvas.ui_event_bus.focus.connect(() => {
      this.toolbar_view.toggle_auto_scroll(true)
    })
    this.plot_view.canvas.ui_event_bus.blur.connect(() => {
      this.toolbar_view.toggle_auto_scroll(false)
    })
  }

  override render(): void {
    super.render()
    this.toolbar_view.render_to(this.shadow_el)
  }

  private get is_horizontal(): boolean {
    return this.toolbar_view.model.horizontal
  }

  protected _paint(): void {
    const {style} = this.toolbar_view.el
    if (this.is_horizontal) {
      style.width = "100%"
      style.height = "unset"
    } else {
      style.width = "unset"
      style.height = "100%"
    }

    // allow shrinking past content size in flex layouts
    if (this.is_horizontal) {
      this.el.style.minWidth = "0"
      this.el.style.minHeight = "unset"
    } else {
      this.el.style.minWidth = "unset"
      this.el.style.minHeight = "0"
    }
  }

  protected override _get_size(): Size {
    const {tools, logo} = this.model.toolbar

    const {width: button_width, height: button_height} = this._button_size()
    const logo_size = this._logo_size()

    // The panel's dimensions are always expressed in the horizontal
    // orientation, even if the toolbar itself is vertical. For example, a
    // vertical toolbar's width is the sum of the button heights.
    const length = this.is_horizontal ? button_width : button_height
    const button_thickness = this.is_horizontal ? button_height : button_width
    const logo_length = logo_size != null
      ? (this.is_horizontal ? logo_size.width : logo_size.height)
      : (logo != null ? default_logo_length : 0)
    const logo_thickness = logo_size != null
      ? (this.is_horizontal ? logo_size.height : logo_size.width)
      : 0

    return {
      width: tools.length*length + logo_length + 15, // TODO: approximate, use a proper layout instead.
      height: Math.max(button_thickness, logo_thickness),
    }
  }

  protected _logo_size(): Size | null {
    const logo_el = this.toolbar_view.shadow_el.querySelector(`.${logos.logo}`)
    if (logo_el == null || !logo_el.isConnected) {
      return null
    }
    const rect = logo_el.getBoundingClientRect()
    const style = getComputedStyle(logo_el)
    const width = rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
    const height = rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
    return Number.isFinite(width) && Number.isFinite(height) ? {width, height} : null
  }

  protected _button_size(): Size {
    // Prefer a rendered button: its computed size reflects the actual layout
    // and avoids creating a probe element on every layout pass.
    const button_view = this.toolbar_view.tool_button_views.find((view) => view.el.isConnected)
    if (button_view != null) {
      const style = getComputedStyle(button_view.el)
      const width = to_px(style.width)
      const height = to_px(style.height)
      if (width != null && height != null) {
        return {width, height}
      }
    }

    // Fall back to a probe, which resolves CSS variables (including non-pixel
    // units such as rem) even when there are no rendered buttons.
    const probe = document.createElement("div")
    probe.style.position = "absolute"
    probe.style.width = `var(--button-width, ${default_button_size}px)`
    probe.style.height = `var(--button-height, ${default_button_size}px)`
    this.toolbar_view.shadow_el.appendChild(probe)
    const style = getComputedStyle(probe)
    const width = to_px(style.width)
    const height = to_px(style.height)
    probe.remove()
    return {
      width: width ?? default_button_size,
      height: height ?? default_button_size,
    }
  }
}

export namespace ToolbarPanel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    toolbar: p.Property<Toolbar>
  }
}

export interface ToolbarPanel extends ToolbarPanel.Attrs {}

export class ToolbarPanel extends Annotation {
  declare properties: ToolbarPanel.Props
  declare __view_type__: ToolbarPanelView

  static {
    this.prototype.default_view = ToolbarPanelView

    this.define<ToolbarPanel.Props>(({Ref}) => ({
      toolbar: [ Ref(Toolbar) ],
    }))
  }
}
