import {Annotation, AnnotationView} from "./annotation"
import {Toolbar, ToolbarView} from "../tools/toolbar"
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

  toolbar_view: ToolbarView
  el: HTMLElement

  override initialize(): void {
    super.initialize()
    this.el = div()
    this.plot_view.canvas_view.add_event(this.el)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.toolbar_view = await build_view(this.model.toolbar, {parent: this})
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
      this.el.appendChild(this.toolbar_view.el)
      this.toolbar_view.layout.bbox = bbox
      this.toolbar_view.render()
      if (this.model.inner)
        this.toolbar_view.el.classList.add("bk-inner")
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
    inner: p.Property<boolean>
  }
}

export interface ToolbarPanel extends ToolbarPanel.Attrs {}

export class ToolbarPanel extends Annotation {
  override properties: ToolbarPanel.Props
  override __view_type__: ToolbarPanelView

  constructor(attrs?: Partial<ToolbarPanel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarPanelView

    this.define<ToolbarPanel.Props>(({Ref}) => ({
      toolbar: [ Ref(Toolbar) ],
    }))

    this.internal<ToolbarPanel.Props>(({Boolean}) => ({
      inner: [ Boolean, false ],
    }))
  }
}
