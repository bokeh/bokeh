import {Annotation, AnnotationView} from "./annotation"
import {Toolbar} from "../tools/toolbar"
import {ToolbarBaseView} from "../tools/toolbar_base"
import {build_views, remove_views} from "core/build_views"
import {empty, show, hide} from "core/dom"
import * as p from "core/properties"

export class ToolbarPanelView extends AnnotationView {
  model: ToolbarPanel

  protected _toolbar_views: {[key: string]: ToolbarBaseView}

  initialize(options: any): void {
    super.initialize(options)
    this.plot_view.canvas_events.appendChild(this.el)
    this._toolbar_views = {}
    build_views(this._toolbar_views, [this.model.toolbar], {parent: this})
    const toolbar_view = this._toolbar_views[this.model.toolbar.id]
    this.plot_view.visibility_callbacks.push((visible: boolean) => toolbar_view.set_visibility(visible))
  }

  remove(): void {
    remove_views(this._toolbar_views)
    super.remove()
  }

  render(): void {
    super.render()
    if (!this.model.visible) {
      hide(this.el)
      return
    }

    const panel = this.model.panel!

    this.el.style.position = "absolute"
    this.el.style.left = `${panel._left.value}px`
    this.el.style.top = `${panel._top.value}px`
    this.el.style.width = `${panel._width.value}px`
    this.el.style.height = `${panel._height.value}px`

    this.el.style.overflow = "hidden"

    const toolbar_view = this._toolbar_views[this.model.toolbar.id]
    toolbar_view.render()

    empty(this.el)
    this.el.appendChild(toolbar_view.el)
    show(this.el)
  }

  protected _get_size(): number {
    return 30
  }
}

export namespace ToolbarPanel {
  export interface Attrs extends Annotation.Attrs {
    toolbar: Toolbar
  }

  export interface Props extends Annotation.Props {}
}

export interface ToolbarPanel extends ToolbarPanel.Attrs {}

export class ToolbarPanel extends Annotation {

  properties: ToolbarPanel.Props

  constructor(attrs?: Partial<ToolbarPanel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ToolbarPanel'
    this.prototype.default_view = ToolbarPanelView

    this.define({
      toolbar: [ p.Instance ],
    })
  }
}
ToolbarPanel.initClass()
