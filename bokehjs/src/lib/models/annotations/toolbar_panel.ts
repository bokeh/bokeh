import {Annotation, AnnotationView} from "./annotation"
import {Toolbar} from "../tools/toolbar"
import {ToolbarBaseView} from "../tools/toolbar_base"
import {build_view} from "core/build_views"
import {div, empty, position, display, undisplay, remove} from "core/dom"
import {Size, Layoutable} from "core/layout"
import {Panel, SideLayout} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"

export class ToolbarPanelView extends AnnotationView {
  override model: ToolbarPanel

  override panel: Panel
  override layout: Layoutable

  override update_layout(): void {
    this.layout = new SideLayout(this.panel, () => this.get_size(), true)
  }

  protected _toolbar_view: ToolbarBaseView
  protected el: HTMLElement

  override initialize(): void {
    super.initialize()
    this.el = div()
    this.plot_view.canvas_view.add_event(this.el)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this._toolbar_view = await build_view(this.model.toolbar, {parent: this}) as ToolbarBaseView
    this.plot_view.visibility_callbacks.push((visible) => this._toolbar_view.set_visibility(visible))
  }

  override remove(): void {
    this._toolbar_view.remove()
    remove(this.el)
    super.remove()
  }

  override render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  private _invalidate_toolbar = true
  private _previous_bbox: BBox = new BBox()

  protected _render(): void {
    // TODO: this should be handled by the layout
    const {bbox} = this.layout
    if (!this._previous_bbox.equals(bbox)) {
      position(this.el, bbox)
      this._previous_bbox = bbox
      this._invalidate_toolbar = true
    }

    if (this._invalidate_toolbar) {
      this.el.style.position = "absolute"
      this.el.style.overflow = "hidden"
      empty(this.el)
      this.el.appendChild(this._toolbar_view.el)
      this._toolbar_view.layout.bbox = bbox
      this._toolbar_view.render()
      this._invalidate_toolbar = false
    }

    display(this.el)
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
  override properties: ToolbarPanel.Props
  override __view_type__: ToolbarPanelView

  constructor(attrs?: Partial<ToolbarPanel.Attrs>) {
    super(attrs)
  }

  static init_ToolbarPanel(): void {
    this.prototype.default_view = ToolbarPanelView

    this.define<ToolbarPanel.Props>(({Ref}) => ({
      toolbar: [ Ref(Toolbar) ],
    }))
  }
}
