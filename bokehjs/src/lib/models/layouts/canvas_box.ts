import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Canvas, CanvasView} from "../canvas/canvas"
import {build_view} from "core/build_views"
import {LayoutItem} from "core/layout"
import * as p from "core/properties"
import {CanvasLayer} from "core/util/canvas"

import icons_css from "styles/icons.css"

export class CanvasBoxView extends LayoutDOMView {
  override model: CanvasBox
  override layout: LayoutItem

  canvas_view: CanvasView

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.canvas_view = await build_view(this.model.canvas)
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
    this.layout = new LayoutItem()
    this.layout.set_sizing(this.box_sizing())
  }

  override after_layout(): void {
    const {width, height} = this.layout.bbox
    this.canvas_view.resize(width, height)
    super.after_layout()
  }

  override styles(): string[] {
    return [...super.styles(), icons_css]
  }

  override render(): void {
    super.render()
    this.shadow_el.appendChild(this.canvas_view.el)
    this.canvas_view.render()
  }

  to_blob(): Promise<Blob> {
    return this.canvas_view.to_blob()
  }

  override export(type: "png" | "svg", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "png" ? "canvas" : "svg"
    const composite = new CanvasLayer(output_backend, hidpi)

    const {width, height} = this.layout.bbox
    composite.resize(width, height)

    const {canvas} = this.canvas_view.compose()
    composite.ctx.drawImage(canvas, 0, 0)

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
  override properties: CanvasBox.Props
  override __view_type__: CanvasBoxView

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
