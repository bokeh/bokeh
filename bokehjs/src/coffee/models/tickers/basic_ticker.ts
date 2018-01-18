import {AdaptiveTicker} from "./adaptive_ticker"

export class BasicTicker extends AdaptiveTicker {
  static initClass() {
    this.prototype.type = "BasicTicker"
  }
}

BasicTicker.initClass()
