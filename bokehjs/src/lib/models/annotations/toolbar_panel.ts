import {Annotation, AnnotationView} from "./annotation"
import {Toolbar} from "../tools/toolbar"
import {ToolbarBaseView} from "../tools/toolbar_base"
import {build_views, remove_views} from "core/build_views"
import {empty, position, display, undisplay} from "core/dom"
import {Size} from "core/layout"
import * as p from "core/properties"

export class ToolbarPanelView extends AnnotationView {
  model: ToolbarPanel

  readonly rotate: boolean = true

  protected _toolbar_views: {[key: string]: ToolbarBaseView}

  initialize(): void {
    super.initialize()
    this.plot_view.canvas_events.appendChild(this.el)
    this._toolbar_views = {}
    build_views(this._toolbar_views, [this.model.toolbar], {parent: this})
    const toolbar_view = this._toolbar_views[this.model.toolbar.id]
    this.plot_view.visibility_callbacks.push((visible) => toolbar_view.set_visibility(visible))
  }

  remove(): void {
    remove_views(this._toolbar_views)
    super.remove()
  }

  render(): void {
    super.render()
    if (!this.model.visible) {
      undisplay(this.el)
      return
    }

    this.el.style.position = "absolute"
    this.el.style.overflow = "hidden"

    position(this.el, this.panel!.bbox)

    const toolbar_view = this._toolbar_views[this.model.toolbar.id]
    toolbar_view.render()

    empty(this.el)
    this.el.appendChild(toolbar_view.el)
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
