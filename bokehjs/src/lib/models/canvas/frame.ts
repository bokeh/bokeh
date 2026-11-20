import {CanvasPanel, CanvasPanelView} from "./canvas_panel"
import {Range1d} from "../ranges/range1d"
import type {BBox} from "core/util/bbox"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import * as css from "styles/frame.css"

/** Rectangular screen geometry, independent of any data coordinate system. */
export class FrameView extends CanvasPanelView {
  declare model: Frame

  protected _x_target: Range1d
  protected _y_target: Range1d

  override initialize(): void {
    super.initialize()
    this._configure_ranges()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), css.default]
  }

  protected _configure_ranges(): void {
    const {bbox} = this
    this._x_target = Range1d.create({start: bbox.left, end: bbox.right})
    this._y_target = Range1d.create({start: bbox.bottom, end: bbox.top})
  }

  override set_geometry(bbox: BBox): void {
    super.set_geometry(bbox)
    this._configure_ranges()
  }

  get x_target(): Range1d {
    return this._x_target
  }

  get y_target(): Range1d {
    return this._y_target
  }
}

export namespace Frame {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CanvasPanel.Props
}

export interface Frame extends Frame.Attrs {}

export abstract class Frame extends CanvasPanel {
  declare properties: Frame.Props
  declare __view_type__: FrameView

  static {
    this.prototype.default_view = FrameView
  }
}
