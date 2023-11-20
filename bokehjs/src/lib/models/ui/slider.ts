import {UIElement, UIElementView} from "./ui_element"
import type * as p from "core/properties"

export class SliderView extends UIElementView {
  declare model: Slider

  override connect_signals(): void {
    super.connect_signals()
  }

  override render(): void {
    super.render()
  }
}

export namespace Slider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
  }
}

export interface Slider extends Slider.Attrs {}

export class Slider extends UIElement {
  declare properties: Slider.Props
  declare __view_type__: SliderView

  constructor(attrs?: Partial<Slider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SliderView

    this.define<Slider.Props>(({}) => ({
    }))
  }
}
