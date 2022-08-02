import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import {SerializableState} from "core/view"
import {BBox} from "core/util/bbox"
import * as p from "core/properties"

const {round} = Math

export abstract class UIElementView extends DOMComponentView {
  override model: UIElement

  get bbox(): BBox {
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

    return bbox
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
