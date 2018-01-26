import {AdaptiveTicker} from "./adaptive_ticker"

export namespace BasicTicker {
  export interface Attrs extends AdaptiveTicker.Attrs {}
}

export interface BasicTicker extends BasicTicker.Attrs {}

export class BasicTicker extends AdaptiveTicker {
  static initClass() {
    this.prototype.type = "BasicTicker"
  }
}
BasicTicker.initClass()
