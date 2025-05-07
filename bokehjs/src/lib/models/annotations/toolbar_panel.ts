import {Annotation, AnnotationView} from "./annotation"
import type {ToolbarView} from "../tools/toolbar"
import {Toolbar} from "../tools/toolbar"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type {Size, Layoutable} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import type * as p from "core/properties"

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

  override *children(): IterViews {
    yield* super.children()
    yield this.toolbar_view
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

  override remove(): void {
    this.toolbar_view.remove()
    super.remove()
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
    return {
      width: tools.length*30 + (logo != null ? 25 : 0) + 15, // TODO: approximate, use a proper layout instead.
      height: 30,
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

  constructor(attrs?: Partial<ToolbarPanel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarPanelView

    this.define<ToolbarPanel.Props>(({Ref}) => ({
      toolbar: [ Ref(Toolbar) ],
    }))
  }
}
