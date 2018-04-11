import {sprintf} from "sprintf-js"

import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import * as p from "core/properties"

export namespace PrintfTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    format: string
  }

  export interface Props extends TickFormatter.Props {}
}

export interface PrintfTickFormatter extends PrintfTickFormatter.Attrs {}

export class PrintfTickFormatter extends TickFormatter {

  properties: PrintfTickFormatter.Props

  constructor(attrs?: Partial<PrintfTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'PrintfTickFormatter'

    this.define({
      format: [ p.String, '%s' ],
    })
  }

  doFormat(ticks: number[], _axis: Axis): string[] {
    return ticks.map((tick) => sprintf(this.format, tick))
  }
}
PrintfTickFormatter.initClass()
