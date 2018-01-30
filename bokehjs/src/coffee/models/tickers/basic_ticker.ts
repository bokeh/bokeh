import {AdaptiveTicker} from "./adaptive_ticker"

export namespace BasicTicker {
  export interface Attrs extends AdaptiveTicker.Attrs {}

  export interface Opts extends AdaptiveTicker.Opts {}
}

export interface BasicTicker extends BasicTicker.Attrs {}

export class BasicTicker extends AdaptiveTicker {

  constructor(attrs?: Partial<BasicTicker.Attrs>, opts?: BasicTicker.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "BasicTicker"
  }
}
BasicTicker.initClass()
