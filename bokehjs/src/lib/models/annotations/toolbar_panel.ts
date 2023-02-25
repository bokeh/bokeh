import {Annotation, AnnotationView} from "./annotation"
import {Toolbar, ToolbarView} from "../tools/toolbar"
import {build_view, IterViews} from "core/build_views"
import {div, empty, position, display, undisplay, remove} from "core/dom"
import {Size, Layoutable} from "core/layout"
import {Panel, SideLayout} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"

export class ToolbarPanelView extends AnnotationView {
  declare model: ToolbarPanel

  declare panel: Panel
  declare layout: Layoutable

  override update_layout(): void {
    this.layout = new SideLayout(this.panel, () => this.get_size(), true)
  }

  override has_finished(): boolean {
    return super.has_finished() && this.toolbar_view.has_finished()
  }

  override *children(): IterViews {
    yield* super.children()
    yield this.toolbar_view
  }

  toolbar_view: ToolbarView
  readonly el: HTMLElement = div()

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
  }

  override remove(): void {
    this.toolbar_view.remove()
    remove(this.el)
    super.remove()
  }

  private _previous_bbox: BBox = new BBox()

  protected _render(): void {
    display(this.el)

    // TODO: this should be handled by the layout
    const {bbox} = this.layout
    if (!this._previous_bbox.equals(bbox)) {
      position(this.el, bbox)
      this._previous_bbox = bbox

      empty(this.el)
      this.el.style.position = "absolute"

      const {style} = this.toolbar_view.el
      if (this.toolbar_view.model.horizontal) {
        style.width = "100%"
        style.height = "unset"
      } else {
        style.width = "unset"
        style.height = "100%"
      }

      this.toolbar_view.render()
      this.plot_view.canvas_view.add_event(this.el)
      this.el.appendChild(this.toolbar_view.el)
      this.toolbar_view.after_render()
    }

    if (!this.model.visible) {
      undisplay(this.el)
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
