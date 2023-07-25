import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Canvas} from "../canvas/canvas"
import type {CanvasView} from "../canvas/canvas"
import {build_view} from "core/build_views"
import type {Layoutable} from "core/layout"
import type * as p from "core/properties"
import {CanvasLayer} from "core/util/canvas"

export class CanvasBoxView extends LayoutDOMView {
  declare model: CanvasBox
  declare layout: Layoutable

  protected canvas_view: CanvasView

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.canvas_view = await build_view(this.model.canvas, {parent: this})
  }

  override remove(): void {
    this.canvas_view.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
  }

  get child_models(): LayoutDOM[] {
    return []
  }

  override _update_layout(): void {
    super._update_layout()
    /*
    this.layout = new LayoutItem()
    this.layout.set_sizing(this.box_sizing())
    */
  }

  override render(): void {
    super.render()
    this.canvas_view.el.style.width = "100%"
    this.canvas_view.el.style.height = "100%"
    this.shadow_el.appendChild(this.canvas_view.el)
    this.canvas_view.render()
  }

  override export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = (() => {
      switch (type) {
        case "auto": return this.canvas_view.model.output_backend
        case "png":  return "canvas"
        case "svg":  return "svg"
      }
    })()

    const composite = new CanvasLayer(output_backend, hidpi)

    const {width, height} = this.bbox
    composite.resize(width, height)

    if (width != 0 && height != 0) {
      const {canvas} = this.canvas_view.compose()
      composite.ctx.drawImage(canvas, 0, 0)
    }

    return composite
  }
}

export namespace CanvasBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    canvas: p.Property<Canvas>
  }
}

export interface CanvasBox extends CanvasBox.Attrs {}

export class CanvasBox extends LayoutDOM {
  declare properties: CanvasBox.Props
  declare __view_type__: CanvasBoxView

  constructor(attrs?: Partial<CanvasBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CanvasBoxView

    this.define<CanvasBox.Props>(({Ref}) => ({
      canvas: [ Ref(Canvas), () => new Canvas() ],
    }))

    this.override<CanvasBox.Props>({
      width: 600,
      height: 600,
    })
  }
}
