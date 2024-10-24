import {StyledElement, StyledElementView} from "../ui/styled_element"
import type {PlotView} from "../plots/plot"
import type {Node} from "../coordinates/node"
import type * as p from "core/properties"
import {InlineStyleSheet} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import type {XY} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {Place} from "core/enums"
import {isNumber} from "core/util/types"
import * as css from "styles/canvas_panel.css"

export class CanvasPanelView extends StyledElementView {
  declare model: CanvasPanel
  declare parent: PlotView

  private _bbox: BBox = new BBox()
  override get bbox(): BBox {
    return this._bbox
  }

  readonly position = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), css.default, this.position]
  }

  override rendering_target(): HTMLElement {
    return this.parent.canvas_view.events_el
  }

  override render(): void {
    super.render()
    this.class_list.add(css[this.model.place])
  }

  set_geometry(bbox: BBox): void {
    this._bbox = bbox
    this._update_position()
    this.mark_finished()
  }

  /**
   * Updates the position of the associated DOM element.
   */
  protected _update_position(): void {
    const {bbox, position} = this
    if (!bbox.is_valid) {
      position.replace(`
      :host {
        display: none;
      }
      `)
    }
  }

  // TODO remove this when bbox handling is unified
  override resolve_symbol(node: Node): XY | number {
    const target = this
    const value = target.bbox.resolve(node.symbol)
    const {offset} = node
    if (isNumber(value)) {
      return value + offset
    } else {
      const {x, y} = value
      return {x: x + offset, y: y + offset}
    }
  }
}

export namespace CanvasPanel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = StyledElement.Props & {
    place: p.Property<Place>
  }
}

export interface CanvasPanel extends CanvasPanel.Attrs {}

export class CanvasPanel extends StyledElement {
  declare properties: CanvasPanel.Props
  declare __view_type__: CanvasPanelView

  constructor(attrs?: Partial<CanvasPanel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CanvasPanelView

    this.define<CanvasPanel.Props>({
      place: [ Place ],
    })
  }
}
