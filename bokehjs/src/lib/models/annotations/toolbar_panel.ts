import {Annotation, AnnotationView} from "./annotation"
import {Toolbar} from "../tools/toolbar"
import {ToolbarBaseView} from "../tools/toolbar_base"
import {build_view} from "core/build_views"
import {div, empty, position, display, undisplay, remove} from "core/dom"
import {Size} from "core/layout"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"
import {SidePanel} from "core/layout/side_panel"

export class ToolbarPanelView extends AnnotationView {
  model: ToolbarPanel
  panel: SidePanel

  readonly rotate: boolean = true

  protected _toolbar_view: ToolbarBaseView
  protected el: HTMLElement

  initialize(): void {
    super.initialize()
    this.el = div()
    this.plot_view.canvas_view.add_event(this.el)
  }

  async lazy_initialize(): Promise<void> {
    this._toolbar_view = await build_view(this.model.toolbar, {parent: this}) as ToolbarBaseView
    this.plot_view.visibility_callbacks.push((visible) => this._toolbar_view.set_visibility(visible))
  }

  remove(): void {
    this._toolbar_view.remove()
    remove(this.el)
    super.remove()
  }

  render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  private _invalidate_toolbar = true
  private _previous_bbox: BBox = new BBox()

  protected _render(): void {
    // TODO: this should be handled by the layout
    const {bbox} = this.panel
    if (!this._previous_bbox.equals(bbox)) {
      position(this.el, bbox)
      this._previous_bbox = bbox
    }

    if (this._invalidate_toolbar) {
      this.el.style.position = "absolute"
      this.el.style.overflow = "hidden"
      this._toolbar_view.render()
      empty(this.el)
      this.el.appendChild(this._toolbar_view.el)
      this._invalidate_toolbar = false
    }

    display(this.el)
  }

  protected _get_size(): Size {
    const {tools, logo} = this.model.toolbar
    return {
      width: tools.length*30 + (logo != null ? 25 : 0), // TODO: approximate, use a proper layout instead.
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
  properties: ToolbarPanel.Props
  __view_type__: ToolbarPanelView

  constructor(attrs?: Partial<ToolbarPanel.Attrs>) {
    super(attrs)
  }

  static init_ToolbarPanel(): void {
    this.prototype.default_view = ToolbarPanelView

    this.define<ToolbarPanel.Props>({
      toolbar: [ p.Instance ],
    })
  }
}
