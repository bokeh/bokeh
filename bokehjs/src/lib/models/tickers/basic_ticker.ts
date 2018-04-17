import {AdaptiveTicker} from "./adaptive_ticker"

export namespace BasicTicker {
  export interface Attrs extends AdaptiveTicker.Attrs {}

  export interface Props extends AdaptiveTicker.Props {}
}

export interface BasicTicker extends BasicTicker.Attrs {}

export class BasicTicker extends AdaptiveTicker {

  properties: BasicTicker.Props

  constructor(attrs?: Partial<BasicTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "BasicTicker"
  }
}
BasicTicker.initClass()
