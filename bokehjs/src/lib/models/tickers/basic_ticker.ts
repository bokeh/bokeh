import {AdaptiveTicker} from "./adaptive_ticker"
import * as p from "core/properties"

export namespace BasicTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AdaptiveTicker.Props
}

export interface BasicTicker extends BasicTicker.Attrs {}

export class BasicTicker extends AdaptiveTicker {
  properties: BasicTicker.Props

  constructor(attrs?: Partial<BasicTicker.Attrs>) {
    super(attrs)
  }
}
