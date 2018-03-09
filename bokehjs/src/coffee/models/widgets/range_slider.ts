/* XXX: partial */
import * as numbro from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class RangeSliderView extends AbstractSliderView {
  model: RangeSlider

  _calc_to() {
    return {
      start: this.model.start,
      end: this.model.end,
      value: this.model.value,
      step: this.model.step,
    }
  }

  _calc_from(values) {
    return values
  }
}

export namespace RangeSlider {
  export interface Attrs extends AbstractSlider.Attrs {}

  export interface Props extends AbstractSlider.Props {}
}

export interface RangeSlider extends RangeSlider.Attrs {}

export class RangeSlider extends AbstractSlider {

  properties: RangeSlider.Props

  constructor(attrs?: Partial<RangeSlider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "RangeSlider"
    this.prototype.default_view = RangeSliderView

    this.override({
      format: "0[.]00",
    })
  }

  behaviour = "drag" as "drag"
  connected = [false, true, false]

  protected _formatter(value: number, format: string): string {
    return numbro.format(value, format)
  }
}

RangeSlider.initClass()
