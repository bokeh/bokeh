import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import {SerializableState} from "core/view"
import {CanvasLayer} from "core/util/canvas"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"

const {round} = Math

export abstract class UIElementView extends DOMComponentView {
  override model: UIElement

  private _bbox: BBox = new BBox()
  get bbox(): BBox {
    return this._bbox
  }

  protected _update_bbox(): void {
    const self = this.el.getBoundingClientRect()

    const {left, top} = (() => {
      if (this.parent != null) {
        const parent = this.parent.el.getBoundingClientRect()
        return {
          left: self.left - parent.left,
          top: self.top - parent.top,
        }
      } else {
        return {left: 0, top: 0}
      }
    })()

    const bbox = new BBox({
      left: round(left),
      top: round(top),
      width: round(self.width),
      height: round(self.height),
    })

    // TODO: const changed = this._bbox.equals(bbox)
    this._bbox = bbox
  }

  protected _resize_observer: ResizeObserver

  override initialize(): void {
    super.initialize()

    this._resize_observer = new ResizeObserver((_entries) => this.on_resize())
    this._resize_observer.observe(this.el, {box: "border-box"})
  }

  override remove(): void {
    this._resize_observer.disconnect()
    super.remove()
  }

  on_resize(): void {
    this._update_bbox()
    this._has_finished = true
    this.notify_finished()
  }

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "auto" || type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    const {width, height} = this.bbox
    canvas.resize(width, height)
    return canvas
  }

  override serializable_state(): SerializableState {
    return {
      ...super.serializable_state(),
      bbox: this.bbox.box,
    }
  }
}

export namespace UIElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export interface UIElement extends UIElement.Attrs {}

export abstract class UIElement extends Model {
  override properties: UIElement.Props
  override __view_type__: UIElementView

  constructor(attrs?: Partial<UIElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UIElement.Props>(({Boolean}) => ({
      visible: [ Boolean, true ],
    }))
  }
}
